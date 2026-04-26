# reel-p0-001 - App Store Preview Storyboard And Capture Plan

Date: 2026-04-26
Owner: Reel

## Scope

This note completes `reel-p0-001` from the Dev Lab App Store readiness task map: a 30-second store preview beat sheet, named capture routes, and a Zoro approval checklist for the CyberTrader v6 first-session trailer.

Runtime code, game tuning, and assets were not changed in this pass. The plan uses the current routed v6 first-session path and the Zoro-approved Gate A creative direction from `docs/release/zoro-p0-001-first-journey-creative-pass.md`.

## Verified Store Constraints

The constraints below were checked against official store documentation on 2026-04-26:

- Apple App Store previews must be 15 to 30 seconds, up to 500 MB, portrait or landscape for iOS, max 30 fps, and use accepted App Preview resolutions such as 886 x 1920 portrait for current 19.5:9 iPhone displays. Source: [Apple App Preview specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/).
- Google Play preview video is supplied as a YouTube URL, should be public or unlisted, embeddable, not age-restricted, and ads should be disabled. Google recommends showing real app/game experience early, keeping at least 80% representative of actual gameplay, avoiding device-hand footage, supporting portrait or landscape, and keeping the first 30 seconds tight because autoplay may use only that portion. Source: [Google Play preview assets guidance](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

This plan targets a portrait-first 30-second master that can be cut down or reformatted after Cipher confirms the final 2026 store-submission checklist.

## SuperDesign Reference

- Project: https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/a3ec6036-9a47-4ba9-8c4f-78b16cae8c30
- Source identity branch: https://p.superdesign.dev/draft/f966902c-c838-4e03-841e-44e0ccd0f4ae
- Trailer capture board: https://p.superdesign.dev/draft/e900723e-1c80-4265-8221-b9c9fe7d15b2

## Capture Route Map

| Beat | Route or source | Capture state |
| --- | --- | --- |
| Illegal shard hook | `app/video-intro.tsx` or `app/intro.tsx` | Intro seen from fresh install, no wallet copy visible later. |
| Local handle claim | `app/login.tsx` | Handle field populated with a safe staged handle, Local demo/no wallet note visible. |
| Boot handoff | `app/boot.tsx` | AG3NT_0S boot log, static/white flash cut point. |
| Deck opens | `app/home.tsx` | Energy, Heat, 0BOL, first-session cue, location banner, and S1LKROAD command visible. |
| Starter market | `app/terminal.tsx` | `VBLM` selected, chart visible, BUY tab active, quantity safe for starter balance. |
| Market tick pressure | `app/terminal.tsx` | Manual tick action or visible price movement, Heat/Energy telemetry still readable. |
| Profit close | `app/terminal.tsx` plus positions/feedback | SELL state or post-trade feedback shows realized profit without raw debug text. |
| Broader promise | `app/home.tsx`, `app/missions.tsx`, `app/menu/profile.tsx` | Brief cuts of missions, rank/progression, and local cyberdeck identity. |

## 30-Second Beat Sheet

| Time | Visual | Copy/audio intent | Capture notes |
| --- | --- | --- | --- |
| 0:00-0:03 | Pantheon/Eidolon intro text or cinematic frame | Establish the player as an illegal shard, not a generic trader. | Keep pre-rendered/cinematic footage under 20% of final runtime. |
| 0:03-0:06 | Login handle and local demo disclosure | Show no-wallet first launch safety. | Avoid claims about real tokens, investing, or cash value. |
| 0:06-0:09 | Boot log and AG3NT_0S handoff | Make the cyberdeck ritual feel tactile. | Use the flash/static point as a hard transition into gameplay. |
| 0:09-0:13 | Home deck with Energy, Heat, 0BOL, first cue | Show the live objective: enter S1LKROAD and acquire starter signal. | Capture small-phone-safe UI; no tutorial modal should block the objective. |
| 0:13-0:18 | Terminal with `VBLM`, chart, BUY ticket | Demonstrate actual gameplay before the halfway mark. | Show selected ticker, cost, Heat delta, Energy cost, and command button. |
| 0:18-0:22 | Market tick or price movement | Show pressure and agency, not passive waiting. | Prefer the manual tick control introduced by `nyx-p0-001`. |
| 0:22-0:26 | SELL/profit feedback, ledger/position update | Close the first profitable loop visibly. | Profit must be fictional `0BOL`; no real-money implication. |
| 0:26-0:30 | Missions/rank/home signal montage | Hint at progression after the first loop. | End on `CYBERTRADER: AGE OF PANTHEON`, not a download CTA. |

## Capture Rules

- Use real app UI for at least 80% of the final cut.
- Keep the first real gameplay action inside the first 10 seconds.
- Use portrait capture as the primary direction because v6 is portrait-first.
- Do not use fingers, device frames, store badges, awards, ranking claims, price claims, testimonials, or install CTAs.
- Keep copy readable when muted; captions must be diegetic and short.
- Keep LocalAuthority/no-wallet copy visible, but do not over-explain technical architecture.
- Avoid showing unfinished store assets, placeholder icons, raw stack traces, debug overlays, secrets, URLs with keys, or Supabase project values.
- Do not show on-chain actions, wallet connection, real-money language, or investment-return language.

## Staged Data Needs

Before capture, create or script a deterministic state with:

- Handle: `GHOST_X` or another approved non-personal staged handle.
- Starting route: fresh intro through first terminal run.
- Selected ticker: `VBLM`.
- Starter position: either empty before buy or one lot after the first buy, depending on the beat.
- Heat: low enough to avoid a raid before first profit, but high enough to make risk visible by the end montage.
- Energy: readable and nonzero through the full buy/wait/sell path.
- 0BOL: fictional balance only; no currency symbol other than `0BOL`.
- Missions/rank/profile: no placeholder names, no debug flags, no unapproved faction assets.

## Zoro Approval Checklist

Zoro should approve `zoro-p0-002` only when:

- The preview opens with the Eidolon/Pantheon hook and reaches real trading quickly.
- The first 10 seconds include actual app UI, not only title/cinematic material.
- The local/no-wallet launch posture is visible and store-safe.
- The first profitable `VBLM` loop is understandable with the audio muted.
- Energy, Heat, 0BOL, selected ticker, and profit feedback are legible on a phone.
- The montage feels like a cyberdeck game, not a financial dashboard or generic productivity app.
- No copy promises real value, yield, investment returns, or live wallet functionality.
- Palette has cleared visible commodity/UI assets for ownership, resolution, and screenshot safety.
- Axiom has no open Gate A blocker against the captured route.

## Follow-Ups

- `palette-p0-001`: audit visible commodity and UI assets before final capture.
- `palette-p1-003`: create screenshot-safe visual state presets for terminal, market, missions, inventory, and profile.
- `axiom-p0-001`: run Web/iOS/Android smoke on the exact capture route.
- `cipher-p0-001` and `cipher-p0-002`: confirm current store metadata, policy, privacy, simulated trading, and age-rating language.
- `zoro-p0-002`: approve the final screenshot and preview direction after Palette and Axiom evidence land.

## Validation

- SuperDesign trailer capture board generated on 2026-04-26.
- Official Apple and Google preview documentation checked on 2026-04-26.
- Documentation-only pass; no runtime code, tests, or assets changed.
