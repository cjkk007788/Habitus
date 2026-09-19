"""
Embedding Service — sentence-transformers 기반 텍스트 임베딩 및 코사인 유사도 검색

사용 모델: all-MiniLM-L6-v2 (384차원, 무료, CPU에서 빠름)
전략: 앨범 저장/수정 시 사전 계산하여 DB에 JSON 배열로 저장
"""
import logging
import json
from typing import List, Optional

import numpy as np

logger = logging.getLogger(__name__)

# 모델을 싱글톤으로 한 번만 로드 (서버 기동 시 약 5~10초 소요)
_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("sentence-transformers 모델 로딩 중 (all-MiniLM-L6-v2)...")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("임베딩 모델 로드 완료.")
        except ImportError:
            logger.warning("sentence-transformers 미설치. 임베딩 기능 비활성화.")
            return None
    return _model


def build_album_text(album) -> str:
    """
    앨범의 핵심 필드를 하나의 문자열로 조합하여 임베딩 대상 텍스트를 만든다.
    포함 내용: 앨범 제목 / 아이템 제목들 / 장르·태그들 / 한줄 인상 / 아티스트·감독
    """
    parts = [album.title or ""]

    for item in (album.items or []):
        if item.title:
            parts.append(item.title)

        # genres는 JSON 배열
        genres = item.genres or []
        if isinstance(genres, list):
            parts.extend(genres)

        if item.impression:
            parts.append(item.impression)

        media_meta = item.media_meta or {}
        if isinstance(media_meta, dict):
            for key in ("artists", "related_artists", "director", "author"):
                val = media_meta.get(key)
                if isinstance(val, list):
                    parts.extend(val)
                elif isinstance(val, str) and val:
                    parts.append(val)

    return " ".join(filter(None, parts))


def embed_text(text: str) -> Optional[List[float]]:
    """텍스트 → 384차원 float 리스트로 변환"""
    model = _get_model()
    if model is None or not text.strip():
        return None
    try:
        vector = model.encode(text, normalize_embeddings=True)
        return vector.tolist()
    except Exception as e:
        logger.error("임베딩 생성 실패: %s", e)
        return None


def compute_album_embedding(album) -> Optional[List[float]]:
    """앨범 객체로부터 임베딩 벡터를 계산하여 반환"""
    text = build_album_text(album)
    return embed_text(text)


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """두 벡터의 코사인 유사도 계산 (이미 정규화된 벡터라면 내적만으로 충분)"""
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def search_similar_albums(query_vec: List[float], albums: list, top_k: int = 10) -> list:
    """
    검색어와 코사인 유사도가 높은 앨범을 상위 top_k개 반환.
    albums: embedding 필드가 있는 Album ORM 객체 리스트
    반환: (album, score) 튜플 리스트 (유사도 내림차순)
    """
    if query_vec is None:
        return []

    scored = []
    for album in albums:
        if not album.embedding:
            continue
        try:
            score = cosine_similarity(query_vec, album.embedding)
            scored.append((album, score))
        except Exception:
            continue

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]
