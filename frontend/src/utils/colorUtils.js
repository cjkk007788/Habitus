/**
 * Generates a deterministic hash from a string.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates a premium, aesthetic CSS gradient based on a string (e.g., genre name).
 * It ensures vibrant, modern colors by restricting saturation and lightness.
 * 
 * @param {string} seed - The string to base the colors on
 * @returns {string} - A valid CSS linear-gradient string
 */
export function generateGradient(seed) {
  const hash = hashString(seed.toLowerCase());
  
  // Base hue based on the hash (0-360)
  const baseHue = hash % 360;
  
  // Vintage pastel / muted tone (Solid color)
  // Saturation: 35-45% (subtle), Lightness: 60-70% (pastel but readable)
  const saturation = 35 + (hash % 10); 
  const lightness = 60 + (hash % 10);
  
  // Return a solid pastel color instead of a gradient
  return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
}
