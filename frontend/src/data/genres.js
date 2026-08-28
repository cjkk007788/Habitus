const rawGenres = [
  "acoustic", "afrobeat", "alt-rock",
  "alternative", "ambient", "anime", "black-metal",
  "bluegrass", "blues", "bossanova", "brazil",
  "breakbeat", "british", "cantopop", "chicago-house",
  "children", "chill", "classical", "club", "comedy",
  "country", "dance", "dancehall", "death-metal", "deep-house",
  "detroit-techno", "disco", "disney", "drum-and-bass", "dub",
  "dubstep", "edm", "electro", "electronic", "emo", "folk",
  "forro", "french", "funk", "garage", "german", "gospel",
  "goth", "grindcore", "groove", "grunge", "guitar", "happy",
  "hard-rock", "hardcore", "hardstyle", "heavy-metal",
  "hip-hop", "holidays", "honky-tonk", "house", "idm",
  "indian", "indie", "indie-pop", "industrial", "iranian",
  "j-dance", "j-idol", "j-pop", "j-rock", "jazz", "k-pop",
  "kids", "latin", "latino", "malay", "mandopop", "metal",
  "metal-misc", "metalcore", "minimal-techno", "movies",
  "mpb", "new-age", "new-release", "opera", "pagode",
  "party", "philippines-opm", "piano", "pop", "pop-film",
  "post-dubstep", "power-pop", "progressive-house",
  "psych-rock", "punk", "punk-rock", "r-n-b", "rainy-day",
  "reggae", "reggaeton", "road-trip", "rock", "rock-n-roll",
  "rockabilly", "romance", "sad", "salsa", "samba",
  "sertanejo", "show-tunes", "singer-songwriter", "ska",
  "sleep", "songwriter", "soul", "soundtracks", "spanish",
  "study", "summer", "swedish", "synth-pop", "tango",
  "techno", "trance", "trip-hop", "turkish", "work-out",
  "world-music"
];

// Special curations for the top genres to make them pop!
const specialCuration = {
  'pop': { emoji: '🎤', color: '#FF1493' },
  'k-pop': { emoji: '✨', color: '#FFB6C1' },
  'hip-hop': { emoji: '🧢', color: '#FF4500' },
  'r-n-b': { emoji: '🌹', color: '#8A2BE2' },
  'jazz': { emoji: '🎷', color: '#DAA520' },
  'classical': { emoji: '🎻', color: '#8B4513' },
  'edm': { emoji: '🎛️', color: '#00FFFF' },
  'rock': { emoji: '🎸', color: '#FF0000' },
  'indie-pop': { emoji: '🌻', color: '#FFD700' },
  'brazil': { emoji: '🌴', color: '#32CD32' },
  'samba': { emoji: '🥁', color: '#008000' },
  'bossanova': { emoji: '🍹', color: '#FF8C00' },
  'acoustic': { emoji: '🪵', color: '#DEB887' },
  'afrobeat': { emoji: '🌍', color: '#228B22' },
  'alt-rock': { emoji: '🛹', color: '#4682B4' },
  'ambient': { emoji: '☁️', color: '#B0C4DE' },
  'blues': { emoji: '🕶️', color: '#0000CD' },
  'chill': { emoji: '🍵', color: '#66CDAA' },
  'country': { emoji: '🤠', color: '#D2691E' },
  'dance': { emoji: '💃', color: '#FF00FF' },
  'disco': { emoji: '🪩', color: '#9370DB' },
  'dubstep': { emoji: '🤖', color: '#483D8B' },
  'electro': { emoji: '⚡', color: '#00FA9A' },
  'folk': { emoji: '🏕️', color: '#556B2F' },
  'french': { emoji: '🥐', color: '#4169E1' },
  'funk': { emoji: '🕺', color: '#FF69B4' },
  'gospel': { emoji: '🙌', color: '#FFDAB9' },
  'grunge': { emoji: '🖤', color: '#2F4F4F' },
  'house': { emoji: '🏠', color: '#1E90FF' },
  'j-pop': { emoji: '🌸', color: '#FF6347' },
  'latin': { emoji: '🌶️', color: '#DC143C' },
  'metal': { emoji: '🤘', color: '#696969' },
  'new-age': { emoji: '🔮', color: '#9932CC' },
  'party': { emoji: '🎉', color: '#FFA500' },
  'punk': { emoji: '🧷', color: '#800080' },
  'reggae': { emoji: '🦁', color: '#008000' },
  'sad': { emoji: '💧', color: '#4682B4' },
  'salsa': { emoji: '💃', color: '#FF4500' },
  'soul': { emoji: '🎙️', color: '#800000' },
  'synth-pop': { emoji: '🎹', color: '#BA55D3' },
  'techno': { emoji: '🕶️', color: '#000080' },
  'anime': { emoji: '🎌', color: '#FF69B4' },
  'comedy': { emoji: '😂', color: '#FFD700' },
  'disney': { emoji: '🏰', color: '#1E90FF' },
  'holidays': { emoji: '🎄', color: '#228B22' },
  'movies': { emoji: '🍿', color: '#DC143C' },
  'piano': { emoji: '🎹', color: '#000000' },
  'sleep': { emoji: '😴', color: '#483D8B' },
  'study': { emoji: '📚', color: '#A0522D' },
  'work-out': { emoji: '💪', color: '#FF4500' },
  'world-music': { emoji: '🌎', color: '#2E8B57' }
};

// Beautiful fallback colors to cycle through
const fallbackColors = [
  '#E05263', '#F2994A', '#27AE60', '#2D9CDB', '#9B51E0',
  '#F2C94C', '#EB5757', '#6FCF97', '#56CCF2', '#BB6BD9',
  '#333333', '#4F4F4F', '#828282', '#BDBDBD', '#E0E0E0'
];

export const musicGenres = rawGenres.map((genreId, index) => {
  // Format the name nicely (e.g. "alt-rock" -> "Alt Rock")
  const formattedName = genreId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Get curated data or assign random fallback
  const curated = specialCuration[genreId];
  const color = curated?.color || fallbackColors[index % fallbackColors.length];
  const emoji = curated?.emoji || '🎵';

  return {
    id: genreId,
    name: formattedName,
    emoji: emoji,
    color: color
  };
});
