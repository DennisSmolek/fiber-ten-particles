import { IcosahedronGeometry, TorusKnotGeometry, type BufferGeometry } from 'three/webgpu';
export function seededRandom(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function insideMark(x: number, y: number) {
  return (x >= 280 && x <= 520 && ((y >= 560 && y <= 800) || (y >= 280 && y <= 520))) || (x >= 0 && x <= 240 && y >= 280 && y <= 520) || (x >= 280 && x <= 800 && y >= 0 && y <= 240) || (x >= 560 && x <= 800 && y >= 240 && y <= 520);
}
function sortSpatial(points: number[][]) {
  // Coarse bins preserve neighborhoods; deterministic fine ordering keeps particle identity.
  return points.sort((a, b) => {
    const key = (p: number[]) => Math.floor((p[0] + 5) * 3) * 1024 + Math.floor((p[1] + 5) * 3) * 32 + Math.floor((p[2] + 5) * 3);
    return key(a) - key(b) || a[0] - b[0];
  });
}
function sampleMesh(geometry: BufferGeometry, count: number, random: () => number) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const p = g.getAttribute('position');
  const cumulative: number[] = [];
  let area = 0;
  for (let i = 0; i < p.count; i += 3) {
    const ax = p.getX(i + 1) - p.getX(i), ay = p.getY(i + 1) - p.getY(i), az = p.getZ(i + 1) - p.getZ(i);
    const bx = p.getX(i + 2) - p.getX(i), by = p.getY(i + 2) - p.getY(i), bz = p.getZ(i + 2) - p.getZ(i);
    area += Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx) / 2;
    cumulative.push(area);
  }
  const points: number[][] = [];
  for (let n = 0; n < count; n++) {
    const target = random() * area;
    let lo = 0, hi = cumulative.length - 1;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (cumulative[mid] < target) lo = mid + 1; else hi = mid; }
    const i = lo * 3, r = Math.sqrt(random()), s = random();
    const a = 1 - r, b = r * (1 - s), c = r * s;
    points.push([p.getX(i) * a + p.getX(i + 1) * b + p.getX(i + 2) * c, p.getY(i) * a + p.getY(i + 1) * b + p.getY(i + 2) * c, p.getZ(i) * a + p.getZ(i + 1) * b + p.getZ(i + 2) * c]);
  }
  if (g !== geometry) g.dispose();
  geometry.dispose();
  return sortSpatial(points);
}
export function createShapeData(count: number) {
  const random = seededRandom(104729);
  const logo: number[][] = [];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0;
    do { x = random() * 800; y = random() * 800; } while (!insideMark(x, y));
    logo.push([(x - 400) / 800 * 5.4, (400 - y) / 800 * 5.4, (random() - .5) * .45]);
  }
  sortSpatial(logo);
  const knot = sampleMesh(new TorusKnotGeometry(1.65, .48, 256, 24, 2, 3), count, random);
  const sphere = sampleMesh(new IcosahedronGeometry(2.4, 1), count, random);
  // Shared permutation distributes all quality prefixes across the silhouettes.
  const ids = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  const pack = (points: number[][]) => new Float32Array(ids.flatMap(i => points[i]));
  return { logo: pack(logo), knot: pack(knot), sphere: pack(sphere) };
}
