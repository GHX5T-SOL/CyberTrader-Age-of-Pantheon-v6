/**
 * Mulberry32 — 32-bit seeded PRNG. Deterministic across platforms.
 *
 * Used as the single source of "randomness" for:
 *   - market tick price deltas
 *   - news generation
 *   - event roll resolution
 *
 * Given the same seed, output is identical everywhere. Never import
 * `Math.random` into the engine.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fast, stable 32-bit string hash (xfnv1a). Used to derive per-stream seeds
 * from composite keys like `${playerId}:${tick}:${ticker}`.
 */
export function xfnv1a(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Derive a seeded stream from a composite key. */
export function seededStream(key: string): () => number {
  return mulberry32(xfnv1a(key));
}
