export const getLightColor = (color: string, amount: number = 0.17) => {
    if (!color) return 'rgba(255, 255, 255, 0.1)';
    // Parse RGB values from the string

    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return color;
    // Extract RGB values

    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    // Move `amount` of the way toward white (255,255,255)
    const lighterR = Math.min(255, r + Math.floor((255 - r) * amount));
    const lighterG = Math.min(255, g + Math.floor((255 - g) * amount));
    const lighterB = Math.min(255, b + Math.floor((255 - b) * amount));
    return `rgb(${lighterR}, ${lighterG}, ${lighterB})`;
  };

export default getLightColor;