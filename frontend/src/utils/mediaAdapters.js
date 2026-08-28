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
