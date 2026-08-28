import genreImagesData from '../data/genreImagesData.json';

/**
 * MOCK API DATA: Genre Images
 * 
 * This file uses the harvested real Spotify album covers.
 * It randomly selects one of the 10 images associated with the genre.
 */

export const getGenreImage = (genreId) => {
  const images = genreImagesData[genreId];
  if (images && images.length > 0) {
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }
  // Fallback if no images exist for this genre
  return `https://picsum.photos/seed/${genreId}/400/400`;
};

export const genreImagesMock = genreImagesData;

// 3. A mock API fetch function simulating a network request
export const fetchGenreImagesAPI = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(genreImagesMock);
    }, 500); // Simulate 500ms network delay
  });
};
