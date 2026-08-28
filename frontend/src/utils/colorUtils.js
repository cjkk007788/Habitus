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
  
  // Second hue is adjacent or complementary for a premium look (+40 to +120 degrees)
  const secondHue = (baseHue + 40 + (hash % 80)) % 360;
  
  // High saturation (70-90%) and balanced lightness (40-60%) for vibrant dark mode look
  const color1 = `hsl(${baseHue}, 80%, 50%)`;
  const color2 = `hsl(${secondHue}, 85%, 45%)`;
  
  // Determine gradient angle (45, 90, 135, or 180 degrees)
  const angleOptions = [45, 90, 135, 180];
  const angle = angleOptions[hash % angleOptions.length];
  
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}
