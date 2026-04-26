# zara-p1-004 - Mobile Asset Optimization Queue

Date: 2026-04-26
Owner: Zara
Run: 20260426T182226Z-zara

## Scope

Implement and apply the `zara-p1-004` compression queue for oversized commodity and Eidolon PNG assets, as called out in `palette-p0-001-asset-audit.md`. Verify that the Expo web bundle uses the optimized images.

No source (original) assets were deleted or modified. Optimized copies land in `assets/optimized/`. Source provenance and store-submission sign-off remain pending (Palette, Cipher, Zoro — unchanged from palette-p0-001 findings).

## Problem

Before this pass the active commodity icon images in the Expo bundle were being sourced from `assets/commodities/*.png` at 1254×1254 pixels. These images are rendered as 28-pixel tiles in `CommodityRow` (28px @1x, 84px @3x on dense screens). Keeping 2 MB source files for 28-pixel render targets bloated every Expo web export and will inflate native IPA/APK bundles.

| Asset set | Source dim | Source size each | Render size |
|-----------|-----------|------------------|-------------|
| 10 commodity icons | 1254×1254 | 1.5 MB – 2.3 MB | 28px @1x (84px @3x) |
| Eidolon shard core | 1086×1448 | 1.43 MB | 224px hero / 144px compact @1x |

Total active image weight before: **~21.1 MB**

## Solution

### Script: `scripts/optimize-assets.mjs`

New script with two modes:
- **report** (`npm run optimize:assets`): dry-run audit — prints current vs. target sizes, estimates savings, no file writes.
- **apply** (`npm run optimize:assets:apply`): generates optimized copies in `assets/optimized/` using macOS `sips -Z`.

Target size logic:
- Commodity icons → **256×256** (covers @3x at 84px with headroom for any full-bleed detail view)
- Eidolon shard core → **512px max dimension** (covers @3x hero at 224px)

### Optimized copies: `assets/optimized/`

| File | Source dim | Source | Optimized dim | Optimized | Saving |
|------|-----------|--------|---------------|-----------|--------|
| commodities/aether_tabs.png | 1254×1254 | 2001 KB | 256×256 | 108 KB | 95% |
| commodities/blacklight_serum.png | 1254×1254 | 1543 KB | 256×256 | 86 KB | 94% |
| commodities/fractal_dust.png | 1254×1254 | 2195 KB | 256×256 | 124 KB | 94% |
| commodities/helix_mud.png | 1254×1254 | 2267 KB | 256×256 | 119 KB | 95% |
| commodities/matrix_salt.png | 1254×1254 | 2300 KB | 256×256 | 115 KB | 95% |
| commodities/neon_glass.png | 1254×1254 | 1989 KB | 256×256 | 111 KB | 94% |
| commodities/oracle_resin.png | 1254×1254 | 1934 KB | 256×256 | 103 KB | 95% |
| commodities/plutonion_gas.png | 1254×1254 | 1795 KB | 256×256 | 98 KB | 95% |
| commodities/synapse_silk.png | 1254×1254 | 2135 KB | 256×256 | 114 KB | 95% |
| commodities/void_bloom.png | 1254×1254 | 2051 KB | 256×256 | 115 KB | 94% |
| ui/eidolon_shard_core.png | 1086×1448 | 1429 KB | 384×512 | 258 KB | 82% |

**Total image saving: 21.6 MB → 1.35 MB (94% reduction)**

### Source reference updates

`components/commodity-row.tsx` — `COMMODITY_ICON_MAP` updated to `assets/optimized/commodities/*`
  (this is the map the active `/home` and `/terminal` routes use via the fallback path)

`assets/commodity-art.ts` — `commodityArt` updated to `assets/optimized/commodities/*`
  (used by `components/trade-ticket.tsx` and legacy `screens/first-playable/market-screen.tsx`)

`components/signal-core.tsx` — updated to `assets/optimized/ui/eidolon_shard_core.png`
  (currently used only in legacy `screens/first-playable/hydration-screen.tsx`; will automatically use the optimized image when the screen is active in any build)

## Verified Expo Bundle Impact

Before (from previous builds):
```
assets/commodities/aether_tabs.bdf1613f...png   2.00 MB
assets/commodities/blacklight_serum.192738...png 1.54 MB
... (10 images × avg 2.0 MB)
```

After (clean rebuild confirming new bundle paths):
```
assets/optimized/commodities/aether_tabs.d152...png     111 kB
assets/optimized/commodities/blacklight_serum.70e1...png  88 kB
assets/optimized/commodities/fractal_dust.efc1...png    126 kB
assets/optimized/commodities/helix_mud.73b7...png       122 kB
assets/optimized/commodities/matrix_salt.4f8b...png     118 kB
assets/optimized/commodities/neon_glass.9f69...png      113 kB
assets/optimized/commodities/oracle_resin.71f6...png    105 kB
assets/optimized/commodities/plutonion_gas.c86c...png   100 kB
assets/optimized/commodities/synapse_silk.a614...png    116 kB
assets/optimized/commodities/void_bloom.6625...png      118 kB
```

## Out-of-Scope Items (documented for follow-up)

**`assets/media/intro-cinematic.mp4` (21 MB):**
Landscape 1080p at ~1.5 Mbps. A portrait-first store preview should rely on live app capture not this file. Re-encoding needs audio-rights clearance (cipher-p0-002 prerequisite). Recommendation when cleared: H.264 CRF 28 at 1080p → ~5–8 MB. No change made this pass.

**`assets/media/silkroad-dashboard-reference.jpg` (260 KB):**
Not imported by the active routed app (legacy `screens/first-playable` only). Candidate for removal after Palette review. Not modified this pass.

**Remotion `cinematics/` copies:**
The Remotion composition copies (`cinematics/public/eidolon_shard_core.png`, `void_bloom.png`, `blacklight_serum.png`) are excluded from the Expo build via `tsconfig.json`. Their optimization is a separate Remotion-scoped pass.

## Remaining Provenance Gate

Provenance sign-off (Palette → Zoro) is still required before any of these images appear in final store screenshots or the App Store preview. This optimization does not change or resolve the provenance question — it only improves bundle efficiency. The source originals in `assets/commodities/` and `assets/ui/` remain in the repo.

## Checks Run

```text
npm run safety:autonomous   → ok, 15 files, 5 rules clean
npm run typecheck           → pass (no errors)
npm test -- --runInBand     → 73/73 tests, 23 suites
npm run build:web           → Expo web export pass, optimized PNGs confirmed in bundle
```
