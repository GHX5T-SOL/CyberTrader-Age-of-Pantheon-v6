# nyx-p1-002 Tuned Strategy Guidance

**Task:** nyx-p1-002  
**Owner:** Nyx  
**Date:** 2026-04-28

## Summary

Applied the completed Oracle beta tuning to player-facing guidance so the first-session path and post-profit upgrade lanes now match the simulation evidence.

## Shipped Changes

- Default first-trade quantity is now VBLM x15, matching `oracle-p0-006` cautious-grinder tuning.
- `engine/strategy-guidance.ts` maps tickers into starter, safe-cycle, momentum, contraband, and wildcard lanes.
- Home and terminal first-session cues now use live strategy hints, including VBLM starter correction, post-profit upgrade guidance, and Heat stop-line copy.
- NPC mission contacts and Help copy now expose concise tuned strategy hints.
- The first-session cue and metric chips received a SuperDesign-backed cyberdeck treatment with in-world route framing and metric rails.
- The commodity row icon map now includes GLCH/Glitch Echo so responsive QA no longer sees missing web image resources.

## SuperDesign

- Project: `CyberTrader v6 Vex cyberdeck polish`
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/66d40635-f827-4af8-af2b-d7cc7112526b`
- Baseline draft: `d0db7f31-3ede-4772-aba3-4fe7dbd55ce2`
- Preview URL: `https://p.superdesign.dev/draft/d0db7f31-3ede-4772-aba3-4fe7dbd55ce2`

The follow-up branch iteration timed out through the SuperDesign CLI, so implementation stayed conservative and used the existing design system plus the generated baseline reproduction.

## Validation

- `npm test -- --runInBand components/__tests__/first-session-cue.test.ts engine/__tests__/strategy-guidance.test.ts engine/__tests__/demo-market.test.ts`
- `npm test -- --runInBand engine/__tests__/strategy-guidance.test.ts components/__tests__/first-session-cue.test.ts authority/__tests__/first-session-loop.test.ts`
- `npm run typecheck`
- `npm run ship:check` - passed safety scan, typecheck, 155/155 Jest tests in 33 suites, and Expo web export.
- `npm run qa:smoke` - passed the intro/login/buy/sell/inventory/settings Chromium route.
- `npm run build:web -- --clear` - rebuilt Expo web export from an empty bundler cache.
