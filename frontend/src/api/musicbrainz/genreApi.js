const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const fetchAllGenres = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/genres/music`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching MusicBrainz genres from backend:", error);
    return [];
  }
};

export const fetchArtistsByGenre = async (genreName, page = 1, limit = 10) => {
  try {
    const encodedGenre = encodeURIComponent(genreName);
    const response = await fetch(`${BACKEND_URL}/genres/music/${encodedGenre}/items?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching artists for genre ${genreName}:`, error);
    return [];
  }
};

/**
 * Fetch detailed artist info by MBID.
 * Calls backend /search/details which queries MusicBrainz + Last.fm in parallel and caches in DB.
 * Includes console.log to inspect raw field names before mapping to sidebar.
 */
export const fetchArtistDetails = async (mbid, artistName = '') => {
  try {
    const params = new URLSearchParams({
      mbid,
      category: 'music_artist',
      artist: artistName
    });
    const response = await fetch(`${BACKEND_URL}/search/details?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // 🔍 Inspect raw fields — check console to see what's available before mapping
    console.log('[fetchArtistDetails] raw response:', data);
    console.log('  ↳ musicbrainz fields:', Object.keys(data?.data?.musicbrainz || {}));
    console.log('  ↳ lastfm fields:', Object.keys(data?.data?.lastfm || {}));
    console.log('  ↳ lastfm.artist fields:', Object.keys(data?.data?.lastfm?.artist || {}));

    return data;
  } catch (error) {
    console.error(`[fetchArtistDetails] failed for mbid ${mbid}:`, error);
    return null;
  }
};
