export const getLightColor = (color: string) => {
    if (!color) return 'rgba(255, 255, 255, 0.1)';
    // Parse RGB values from the string

    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return color;
    // Extract RGB values

    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    // Make lighter by moving 40% toward white (255,255,255)
    const lighterR = Math.min(255, r + Math.floor((255 - r) * 0.17));
    const lighterG = Math.min(255, g + Math.floor((255 - g) * 0.17));
    const lighterB = Math.min(255, b + Math.floor((255 - b) * 0.17));
    return `rgb(${lighterR}, ${lighterG}, ${lighterB})`;
  };

export default getLightColor;