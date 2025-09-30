export const getPriorityColor = (baseColor: string, priority?: string | number) => {
  if (!baseColor) return 'rgba(255, 255, 255, 0.1)';
  
  // Parse RGB values from the string
  const rgbMatch = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) return baseColor;
  
  // Extract RGB values
  const r = parseInt(rgbMatch[1], 10);
  const g = parseInt(rgbMatch[2], 10);
  const b = parseInt(rgbMatch[3], 10);
  
  // Convert priority to number (0-4 scale)
  let priorityNum = 2; // default to medium (2)
  if (priority !== undefined && priority !== null) {
    const parsed = parseInt(priority.toString(), 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
      priorityNum = parsed;
    }
  }
  
  let adjustedR, adjustedG, adjustedB;
  
  if (priorityNum <= 1) {
    // Low priority (0-1): Make significantly brighter by moving toward white
    const brightenFactor = priorityNum === 0 ? 0.3 : 0.1; // 30% for priority 0, 10% for priority 1
    adjustedR = Math.min(255, r + Math.floor((255 - r) * brightenFactor));
    adjustedG = Math.min(255, g + Math.floor((255 - g) * brightenFactor));
    adjustedB = Math.min(255, b + Math.floor((255 - b) * brightenFactor));
  } else if (priorityNum === 2) {
    // Medium priority (2): Keep original color
    adjustedR = r;
    adjustedG = g;
    adjustedB = b;
  } else {
    // High priority (3-4): Make darker by moving toward black
    const darkenFactor = priorityNum === 4 ? 0.3 : 0.1; // 20% for priority 4, 10% for priority 3
    adjustedR = Math.max(0, r - Math.floor(r * darkenFactor));
    adjustedG = Math.max(0, g - Math.floor(g * darkenFactor));
    adjustedB = Math.max(0, b - Math.floor(b * darkenFactor));
  }
  
  return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
};

export default getPriorityColor;