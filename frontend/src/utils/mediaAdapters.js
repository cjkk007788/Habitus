/**
 * 검색 결과 아이템(백엔드 통합 포맷)을 MediaAlbum + RightSidebar Details가 기대하는 포맷으로 변환.
 *
 * MusicDetails  → item.mbid (아티스트 MBID), item.itemType, item.image_url
 * MovieDetails  → item.id (TMDB 정수 ID), item.mediaMeta.overview, item.mediaMeta.vote_average
 * BookDetails   → item.mediaMeta.overview, mediaMeta.publisher, mediaMeta.pageCount, item.previewUrl
 */
export function toMediaAlbumItem(item) {

  const meta = item.metadata || {};

  // ── 음악: external_id가 곧 MusicBrainz MBID ──────────────
  const mbid = item.external_source === 'musicbrainz' ? item.external_id : null;

  // ── 영화: TMDB ID는 정수여야 함 ───────────────────────────
  const movieId = item.external_source === 'tmdb'
    ? (meta.tmdb_id ?? Number(item.external_id))
    : null;

  // ── 책: Google Books volume ID (문자열) ───────────────────
  const bookId = item.external_source === 'google_books' ? item.external_id : null;

  // TMDB genre mapping
  const TMDB_GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  };

  // ── 장르 수집 (소스별 차이 처리) ─────────────────────────
  const genreList = [];

  if (Array.isArray(meta.tags)) genreList.push(...meta.tags);
  if (Array.isArray(meta.genres)) genreList.push(...meta.genres);
  if (Array.isArray(meta.genre_tags)) genreList.push(...meta.genre_tags);
  if (Array.isArray(meta.categories)) genreList.push(...meta.categories);
  
  if (Array.isArray(meta.genre_ids)) {
    meta.genre_ids.forEach(id => {
      if (TMDB_GENRE_MAP[id]) genreList.push(TMDB_GENRE_MAP[id]);
    });
  }

  const genres = [...new Set(genreList.filter(Boolean))];

  return {
    // ── MediaAlbum 공통 ─────────────────────────────────────
    id: movieId ?? bookId ?? item.external_id,
    mbid,                                   // MusicDetails.fetchArtistDetails 사용
    itemType: item.item_type,               // music_artist | music_track | movie | book
    title: item.title,
    image_url: item.cover_image_url || null,
    coverImages: item.cover_image_url ? [item.cover_image_url] : [],
    bgColor: '#1e3a5f',
    previewUrl: item.preview_url || meta.preview_link || null,

    // ── 장르 (리포트 집계용) ─────────────────────────────────
    genres,
    userMeta: {
      genreTags: genres,
    },

    // ── 아티스트 (리포트 집계용) ───────────────────────────────
    artists: [
      ...(meta.artist && typeof meta.artist === 'string' ? [meta.artist] : []),
      ...(Array.isArray(meta.authors) ? meta.authors : [])
    ].filter(Boolean),

    // ── mediaMeta: 각 Details 컴포넌트가 사용하는 필드 ──────
    mediaMeta: {
      // 공통
      contributors: item.subtitle ? [{ name: item.subtitle }] : [],
      releaseYear: item.release_year ? String(item.release_year) : (meta.release_date?.substring(0, 4) || ''),

      // 음악 트랙용
      trackLinks: {
        apple: meta.apple_music_url || null,
        lastfm: meta.lastfm_url || null,
      },

      // 영화용 (MovieDetails)
      overview: meta.overview || meta.description || '',
      vote_average: meta.vote_average || null,

      // 책용 (BookDetails)
      publisher: meta.publisher || '',
      pageCount: meta.page_count || null,
      previewLink: meta.preview_link || '',
    },

    // ── 원본 보존 (아카이빙 및 디버깅) ──────────────────────
    externalId: item.external_id,
    externalSource: item.external_source,
    rawMetadata: meta,
  };
}
