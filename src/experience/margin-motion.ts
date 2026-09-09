/** Scroll moves orbit centers; animation time only moves particles around those centers. */
export function edgeScrollTravel(scrollCenter: number, anchors: readonly number[], phase: number, viewportHeight: number) {
  const start = phase < 2 ? anchors[1] : anchors[5];
  const end = phase < 2 ? anchors[2] : anchors[6];
  return Math.max(0, Math.min(scrollCenter, end) - start) / Math.max(1, viewportHeight) * 10;
}
