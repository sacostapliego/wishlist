/**
 * A top-to-bottom fade from `color` into `to` that has no visible seam.
 *
 * A plain two-stop gradient changes at a constant rate, so the eye catches a
 * hard line where it begins and ends, and sRGB blending muddies the colour on
 * the way down. This eases in and out (smoothstep) across many stops and mixes
 * in oklab, which keeps the hue clean as it darkens.
 */
export const getFadeGradient = (
  color: string,
  to: string = '#141414',
  start: number = 30,
  steps: number = 10
) => {
  const stops = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const eased = t * t * (3 - 2 * t)
    const position = start + (100 - start) * t
    const colorShare = Math.round((1 - eased) * 100)
    return `color-mix(in oklab, ${color} ${colorShare}%, ${to}) ${position.toFixed(1)}%`
  })
  return `linear-gradient(to bottom, ${color} 0%, ${stops.join(', ')})`
}

export default getFadeGradient
