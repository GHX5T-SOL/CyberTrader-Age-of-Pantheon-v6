import { mulberry32, xfnv1a, seededStream } from '../prng';

describe('prng determinism', () => {
  it('mulberry32 produces identical sequences for identical seeds', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('mulberry32 diverges on different seeds', () => {
    const a = mulberry32(42);
    const b = mulberry32(43);
    // First ten outputs should differ (extremely high probability)
    const outsA = Array.from({ length: 10 }, () => a());
    const outsB = Array.from({ length: 10 }, () => b());
    expect(outsA).not.toEqual(outsB);
  });

  it('xfnv1a is stable across runs', () => {
    expect(xfnv1a('cybertrader')).toBe(xfnv1a('cybertrader'));
    expect(xfnv1a('ghost')).not.toBe(xfnv1a('zoro'));
  });

  it('seededStream reproduces from composite key', () => {
    const key = 'player-1:tick-42:FDST';
    const a = seededStream(key);
    const b = seededStream(key);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });
});
