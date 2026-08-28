import asyncio
import os
from dotenv import load_dotenv

# .env 파일에서 API 키를 불러옵니다.
load_dotenv()

from app.services import musicbrainz, lastfm, discogs, lyrics

async def run_tests():
    print("🚀 외부 API 연동 테스트를 시작합니다...\n")

    # 1. MusicBrainz 테스트
    print("=== 1. MusicBrainz API 테스트 ===")
    print("검색어: 'Radiohead'")
    try:
        mb_result = await musicbrainz.search_artist("Radiohead")
        if mb_result and "artists" in mb_result and len(mb_result["artists"]) > 0:
            artist = mb_result["artists"][0]
            print(f"✅ 성공! 아티스트 발견: {artist.get('name')} (MBID: {artist.get('id')})")
        else:
            print("❌ 실패 또는 검색 결과 없음")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

    # 2. Last.fm 테스트
    print("\n=== 2. Last.fm API 테스트 ===")
    print("대상: 'Radiohead'")
    try:
        lf_result = await lastfm.get_artist_info("Radiohead")
        if lf_result and "artist" in lf_result:
            tags = [t["name"] for t in lf_result["artist"].get("tags", {}).get("tag", [])]
            print(f"✅ 성공! 상위 태그 정보: {tags[:3]}")
        else:
            print("❌ 실패 (API Key가 없거나 틀렸을 수 있습니다)")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

    # 3. Discogs 테스트
    print("\n=== 3. Discogs API 테스트 ===")
    print("검색어: 'OK Computer'")
    try:
        dc_result = await discogs.search_release("OK Computer")
        if dc_result and "results" in dc_result and len(dc_result["results"]) > 0:
            release = dc_result["results"][0]
            print(f"✅ 성공! 앨범 발견: {release.get('title')} (발매년도: {release.get('year')})")
        else:
            print("❌ 실패 (Discogs API Key가 없거나 틀렸을 수 있습니다)")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

    # 4. lyrics.ovh 테스트
    print("\n=== 4. lyrics.ovh API 테스트 ===")
    print("검색: 'Coldplay - Yellow'")
    try:
        ly_result = await lyrics.get_lyrics("Coldplay", "Yellow")
        if ly_result:
            first_line = ly_result.split('\n')[0]
            print(f"✅ 성공! 가사 추출됨. 첫 줄: '{first_line}...'")
        else:
            print("❌ 실패 또는 가사 데이터가 없음")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        
    print("\n🎉 모든 테스트가 종료되었습니다.")

if __name__ == "__main__":
    asyncio.run(run_tests())
