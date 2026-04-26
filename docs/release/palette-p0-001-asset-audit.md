# palette-p0-001 - Store Asset Audit

Date: 2026-04-26
Owner: Palette

## Scope

This note completes `palette-p0-001` from the Dev Lab App Store readiness task map: audit the current CyberTrader v6 commodity, UI, cinematic, and capture-support assets for store-ready resolution, ownership/source evidence, and screenshot safety.

No runtime code or binary assets were changed in this pass. The audit uses the current routed Expo app plus the SuperDesign design-system context in `.superdesign/design-system.md`.

## Verified Inventory Method

Local checks used:

- `find assets -type f -maxdepth 3 -print`
- `file assets/**`
- `du -h assets/**`
- `sips -g pixelWidth -g pixelHeight assets/commodities/*.png assets/ui/eidolon_shard_core.png assets/media/silkroad-dashboard-reference.jpg`
- `git log --format='%h %ad %an %s' --date=short -- assets`
- `rg "assets/|\\.png|\\.jpg|\\.mp4|commodity-art"`
- A read-only Node MP4 atom parser for `assets/media/intro-cinematic.mp4`

## Asset Register

| Asset set | Current files | Runtime use | Resolution and weight | Source / ownership note | Store disposition |
| --- | --- | --- | --- | --- | --- |
| Commodity icons | `assets/commodities/*.png` for `FDST`, `PGAS`, `NGLS`, `HXMD`, `VBLM`, `ORRS`, `SNPS`, `MTRX`, `AETH`, `BLCK` | Active routed market rows in `components/commodity-row.tsx`, trade ticket art via `assets/commodity-art.ts`, legacy first-playable market screen | All 10 are `1254 x 1254`; each is about `1.5M` to `2.3M` | Committed by `GHX5T-SOL` in generic `update` commits on 2026-04-23 and 2026-04-24; no prompt, source file, purchase license, or creator attestation exists in repo | Resolution is adequate for in-app screenshots and preview staging. Final store screenshots need explicit provenance sign-off or replacement before Zoro approval. |
| Eidolon shard core | `assets/ui/eidolon_shard_core.png`; duplicate `cinematics/public/eidolon_shard_core.png` | Active `components/signal-core.tsx`; Remotion teaser still/video material | `1086 x 1448`, about `1.4M` | Committed by `GHX5T-SOL` in generic `update` commit `8993544` on 2026-04-23; no source/license metadata exists in repo | Strong identity asset and high enough resolution. Approved for internal staging, but final store use needs provenance sign-off. |
| Intro cinematic | `assets/media/intro-cinematic.mp4` | Active `/video-intro`; legacy boot screen | `1920 x 1080`, `15.042s`, about `21M` | Committed by `GHX5T-SOL` in generic `update` commit `a51a09e` on 2026-04-24; no source project, license, or music/audio rights note exists in repo | May support the preview hook only after source and audio rights are cleared. Because the file is landscape, portrait store preview should rely mostly on real app capture. |
| Legacy S1LKROAD reference | `assets/media/silkroad-dashboard-reference.jpg` | Legacy `screens/first-playable/*` only; not imported by active routed app | `1254 x 1254`, about `260K` | Committed by `GHX5T-SOL` in generic `update` commit `a51a09e` on 2026-04-24; no source/license metadata exists in repo | Not approved for final store screenshots unless it is intentionally reintroduced and source rights are documented. |
| Remotion public assets | `cinematics/public/eidolon_shard_core.png`, `void_bloom.png`, `blacklight_serum.png` | Standalone Remotion teaser composition | `eidolon`: `1086 x 1448`; `void_bloom`: `1024 x 1024`; `blacklight_serum`: `1254 x 1254`; combined about `3.9M` | Derived from the same repo asset set; no separate source metadata exists | Adequate for internal teaser rendering. Final external trailer use inherits the same provenance requirements as the source images. |
| App icon and splash imagery | No explicit `expo.icon`, `expo.splash.image`, or `android.adaptiveIcon.foregroundImage` in `app.json` | Store listing and native launch identity | Missing image paths in current config | No icon/splash source package exists in repo | Store-candidate asset gap. `palette-p1-002` should create a 512 px Play icon source, iOS icon source, adaptive foreground, and splash image with provenance notes. |
| Responsive QA captures | `docs/release/vex-p0-002-responsive-captures/*.jpg` | Evidence for web viewport QA, not source art | Eight JPEG captures, total about `616K` | Generated locally from the exported v6 app during `vex-p0-002` | Useful QA evidence. They are not final App Store screenshots because native device captures and source-cleared assets are still required. |

## Resolution Findings

- No current commodity or identity image is low resolution for in-app rendering; every active image is at least `1024 x 1024` or taller than the phone viewport.
- Commodity icons are visually safe for cropped market rows because the active UI renders them as small square thumbnails.
- Current PNG weights are high for mobile runtime use. This does not block store screenshots, but it should feed `zara-p1-004` asset optimization before native build-size review.
- The active intro cinematic is within Apple preview duration bounds, but it is landscape and should not dominate a portrait-first app preview.
- Store icon, adaptive icon foreground, and splash source art are missing from the app config and remain a Gate C asset gap.

## Ownership Findings

The repo currently proves only that the assets were committed by `GHX5T-SOL`; it does not prove creator, model/tool, source prompt, license, purchase, work-made-for-hire status, or audio rights. For store submission, Palette should attach one ownership note per externally visible asset with:

- Creator or generation tool.
- Original source file or project reference.
- Date created or acquired.
- License or internal ownership basis.
- Modification chain if a generated or licensed source was edited.
- Store-use scope: app UI, screenshots, preview video, trailer, icon, or marketing page.

Until those notes exist, use the current assets for internal QA, SuperDesign boards, and capture planning only. Final App Store / Play Store screenshots and preview video should not be approved as submission-ready.

## Store-Capture Rules

Zoro and Reel can continue staging the App Store preview with these rules:

- Prefer live routed app UI from `/home`, `/terminal`, `/missions`, and menu surfaces.
- Commodity icons and the Eidolon shard can appear in capture plans, but final export needs Palette provenance sign-off.
- Do not use `assets/media/silkroad-dashboard-reference.jpg` in final store screenshots.
- Do not use the intro cinematic as more than a short hook unless its source and audio rights are documented.
- Do not show placeholder icon/splash material; create the store icon and splash package before final capture.

## Follow-Ups

- `palette-p1-002`: create missing icon, adaptive icon foreground, splash, faction, OS tier, badge, and notification assets with provenance notes.
- `palette-p1-003`: create screenshot-safe visual state presets after Axiom confirms the exact QA capture route.
- `zara-p1-004`: build a compression queue for oversized commodity and cinematic assets, then verify Expo output.
- `zoro-p0-002`: approve screenshot and preview direction only after Palette provenance notes and Axiom route evidence exist.

## Validation

- SuperDesign context read before the audit: `.superdesign/design-system.md`, `.superdesign/init/components.md`, and `.superdesign/init/theme.md`.
- Local file metadata, dimensions, imports, and git history checked on 2026-04-26.
- `npm install` completed after the latest pull; it restored local dependencies and reported the known Expo toolchain audit advisories.
- Documentation and planning pass only; no runtime code or binary asset was changed.
