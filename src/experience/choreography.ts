/** Piecewise scroll intervals are measured from the page, never its total height. */
export function storyProgress(scrollCenter: number, anchors: readonly number[], values: readonly number[] = anchors.map((_, i) => i)): number {
  if (anchors.length < 2 || scrollCenter <= anchors[0]) return values[0] ?? 0;
  for (let i = 0; i < anchors.length - 1; i++) {
    if (scrollCenter <= anchors[i + 1]) {
      const t = Math.max(0, Math.min(1, (scrollCenter - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i])));
      return values[i] + (values[i + 1] - values[i]) * t;
    }
  }
  return values[values.length - 1];
}
export function integrateDisplacement(x: number, v: number, force: number, dt: number) {
  const velocity = v + (force - 55 * x - 15 * v) * dt;
  return [x + velocity * dt, velocity] as const;
}
