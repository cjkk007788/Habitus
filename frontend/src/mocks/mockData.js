export const generateMockItems = () => [
  {
    id: "11111111-1111-1111-1111-111111111111",
    itemType: "music",
    title: "Hype Boy",
    coverImages: ["https://i.scdn.co/image/ab67616d0000b2739d28fd01859073a3ae6ea209"],
    rating: 5,
    isFavorite: true,
    status: "completed",
    review: "A truly masterpiece.",
    impression: "I want to listen to it again.",
    date: "2026-06-20",
    revisit: true,
    discovery: "self",
    viewCount: 15,
    isDeleted: false,
    trailerUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&mute=1",
    mediaMeta: {
      originalOrder: 2,
      releaseYear: 2022,
      duration: "2:59",
      language: "Korean",
      contributors: [{ role: "Artist", name: "NewJeans" }],
      genre: "K-pop"
    },
    userMeta: {
      tags: ["Summer", "Exciting"],
      genreTags: ["Dance"],
      mood: "excited",
      context: ["Commute", "Summer Vacation"]
    }
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    itemType: "music",
    title: "Ditto",
    coverImages: ["https://i.scdn.co/image/ab67616d0000b273d70036292d54f29e8b68ec01"],
    rating: 4,
    isFavorite: true,
    status: "completed",
    review: "Perfect mood for winter.",
    impression: "Cozy.",
    date: "2026-01-15",
    revisit: true,
    discovery: "friend",
    viewCount: 20,
    isDeleted: false,
    trailerUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&mute=1",
    mediaMeta: {
      originalOrder: 1,
      releaseYear: 2022,
      duration: "3:05",
      language: "Korean",
      contributors: [{ role: "Artist", name: "NewJeans" }],
      genre: "K-pop"
    },
    userMeta: {
      tags: ["Winter", "Sentimental"],
      genreTags: ["R&B"],
      mood: "calm",
      context: ["Snowy Day", "Night"]
    }
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    itemType: "movie",
    title: "Call Me By Your Name",
    coverImages: [
      "https://image.tmdb.org/t/p/w500/m1NtvHHL0T5G0F1Jk1n5qgZ3GZ0.jpg",
      "https://image.tmdb.org/t/p/w500/zSpXoZEDWwWvE0n03a11QzN3q6x.jpg"
    ],
    rating: 5,
    isFavorite: true,
    status: "completed",
    review: "A beautiful movie where you can feel the Italian summer.",
    impression: "Leaves a lingering impression.",
    date: "2025-08-10",
    revisit: true,
    discovery: "algorithm",
    viewCount: 8,
    isDeleted: false,
    trailerUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&mute=1",
    mediaMeta: {
      releaseYear: 2017,
      duration: "2h 12m",
      language: "English",
      contributors: [{ role: "Director", name: "Luca Guadagnino" }, { role: "Actor", name: "Timothée Chalamet" }],
      genre: "Romance"
    },
    userMeta: {
      tags: ["Italy", "Summer", "First Love"],
      genreTags: ["Drama"],
      mood: "nostalgic",
      context: ["Summer Night", "Alone"]
    }
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    itemType: "music",
    title: "Blinding Lights",
    coverImages: ["https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png"],
    rating: 5,
    isFavorite: true,
    status: "completed",
    review: "The best synthwave track.",
    impression: "Great for night driving.",
    date: "2026-06-25",
    revisit: true,
    discovery: "algorithm",
    viewCount: 50,
    isDeleted: false,
    trailerUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&mute=1",
    mediaMeta: {
      originalOrder: 9,
      releaseYear: 2019,
      duration: "3:20",
      language: "English",
      contributors: [{ role: "Artist", name: "The Weeknd" }],
      genre: "Synthwave"
    },
    userMeta: {
      tags: ["Night", "Drive", "Synthwave"],
      genreTags: ["Pop", "Synth-pop"],
      mood: "energetic",
      context: ["Night Driving", "Workout"]
    }
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    itemType: "music",
    title: "Save Your Tears",
    coverImages: ["https://upload.wikimedia.org/wikipedia/en/c/c1/The_Weeknd_-_Save_Your_Tears.png"],
    rating: 4.5,
    isFavorite: true,
    status: "completed",
    review: "Sad lyrics contrasting with the melody.",
    impression: "Keeps making me listen.",
    date: "2026-06-26",
    revisit: true,
    discovery: "radio",
    viewCount: 30,
    isDeleted: false,
    trailerUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&mute=1",
    mediaMeta: {
      originalOrder: 11,
      releaseYear: 2020,
      duration: "3:35",
      language: "English",
      contributors: [{ role: "Artist", name: "The Weeknd" }],
      genre: "Pop"
    },
    userMeta: {
      tags: ["Pop", "Breakup"],
      genreTags: ["Pop", "Synth-pop"],
      mood: "melancholic",
      context: ["Rainy Day", "Night"]
    }
  }
];

export const generateMockAlbums = () => [
  {
    id: "album_1",
    userId: "user_777",
    albumTitle: "NewJeans Best",
    category: "music",
    tags: ["K-pop", "Trendy", "Summer"],
    isPublic: true,
    coverImage: "https://i.scdn.co/image/ab67616d0000b2739d28fd01859073a3ae6ea209",
    description: "Collection of NewJeans title tracks",
    itemIds: ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"],
    createdAt: "2026-06-20T10:00:00Z",
    updatedAt: "2026-06-23T15:30:00Z",
    isDeleted: false
  },
  {
    id: "album_2",
    userId: "user_777",
    albumTitle: "Summer Mood",
    category: "fusion",
    tags: ["Summer", "Vacation"],
    isPublic: true,
    coverImage: "https://image.tmdb.org/t/p/w500/m1NtvHHL0T5G0F1Jk1n5qgZ3GZ0.jpg",
    description: "Music and movies perfect for summer",
    itemIds: ["11111111-1111-1111-1111-111111111111", "33333333-3333-3333-3333-333333333333"],
    createdAt: "2026-06-21T10:00:00Z",
    updatedAt: "2026-06-21T10:00:00Z",
    isDeleted: false
  },
  {
    id: "album_3",
    userId: "user_777",
    albumTitle: "After Hours",
    category: "music",
    tags: ["Masterpiece", "Synthwave", "Pop"],
    isPublic: true,
    coverImage: "https://upload.wikimedia.org/wikipedia/en/c/c1/The_Weeknd_-_After_Hours.png",
    description: "The Weeknd's 4th studio album",
    itemIds: ["44444444-4444-4444-4444-444444444444", "55555555-5555-5555-5555-555555555555"],
    createdAt: "2026-06-25T20:00:00Z",
    updatedAt: "2026-06-26T22:30:00Z",
    isDeleted: false
  }
];

export const generateMockMixes = () => [
  {
    id: "mix_1",
    userId: "user_777",
    mixTitle: "2026 Summer Collection",
    coverImage: "https://image.tmdb.org/t/p/w500/m1NtvHHL0T5G0F1Jk1n5qgZ3GZ0.jpg",
    description: "Collection of summer content",
    albumIds: ["album_1", "album_2"],
    createdAt: "2026-06-22T10:00:00Z",
    updatedAt: "2026-06-22T10:00:00Z",
    isDeleted: false
  },
  {
    id: "mix_2",
    userId: "user_777",
    mixTitle: "Night Drive Vibes",
    coverImage: "https://upload.wikimedia.org/wikipedia/en/c/c1/The_Weeknd_-_After_Hours.png",
    description: "Collection of music for night driving",
    albumIds: ["album_3"],
    createdAt: "2026-06-26T23:00:00Z",
    updatedAt: "2026-06-27T01:00:00Z",
    isDeleted: false
  }
];
