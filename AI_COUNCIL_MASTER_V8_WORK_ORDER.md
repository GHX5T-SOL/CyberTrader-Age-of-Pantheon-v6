# AI Council Work Order: Start Master V8 Now

Status: ACTIVE.

This work order instructs all CyberTrader agents to begin work immediately on the Master V8 candidate. Follow `AI_COUNCIL_MASTER_V8_DIRECTIVE.md` as the source of truth.

## Branch Protocol

1. Pull latest before starting.
2. Base all work on `codex/master-v8`.
3. Create focused sub-branches from `codex/master-v8`.
4. Do not push directly to `main`.
5. Do not overwrite latest v6 stability work.
6. Open PRs back into `codex/master-v8` with verification output.

Recommended commands:

```bash
git fetch v6
git switch codex/master-v8
git pull --ff-only
git switch -c codex/v8-<lane-name>
```

## Parallel Work Lanes

### Lane 1: Intel System Port

Owner pool: Codex, Claude, Zara.

Goal: Port the dev-lab Intel System into latest v6 without downgrading Expo 54 / React 19.

Deliverables:

- `NewsEvent` type.
- `currentNews`, `pendingConfirmation`, `lastConfirmation` store fields.
- Hard intel / market whisper generator.
- Delayed confirmation generator.
- Home card copy changed from direct signals to interpretive intel.
- Terminal context changed from direct signal to market intel.
- Remove `ACT ON SIGNAL` and direct `BUY X` / `SELL Y` guidance.

Verification:

- `npm run typecheck`
- `npm test -- --runInBand`
- `npm run build:web`
- Browser smoke: home shows `HARD INTEL` or `MARKET WHISPER`, `OPEN MARKET`, and delayed confirmation.

### Lane 2: Visual Canon Implementation

Owner pool: Zyra, Zara, UI agents.

Goal: Make the v8 UI match the provided visual reference while preserving Intel System language.

Reference:

`C:\Users\akmha\Downloads\ChatGPT Image Apr 26, 2026, 04_40_46 PM.png`

Deliverables:

- Mobile-first dashboard with deep cyberpunk glass background.
- Circular energy and heat meters.
- Dominant primary intel/opportunity card.
- Glowing green/cyan primary CTA.
- Pressure strip with scan timer, next intel, near win, streak, courier ETA.
- Market watch rows with icons, prices, percent changes, and sparklines.
- Trade sheet/modal matching the reference structure.
- Bottom nav: Trade / Map / Empire.

Important:

- Do not reintroduce direct command copy from the reference image.
- Translate `ACT ON SIGNAL` to Intel-safe actions such as `OPEN MARKET`, `INTERPRET INTEL`, or `REVIEW MARKET`.

Verification:

- Browser screenshot comparison against the visual canon.
- No flat grey prototype cards remain on primary flows.
- All primary actions remain tappable and functional.

### Lane 3: Stability and QA Gate

Owner pool: Claude, QA agents, CodeRabbit.

Goal: Ensure v8 remains stable while merging systems.

Deliverables:

- Preserve v6 QA scripts.
- Run full validation.
- Identify regressions caused by Intel/UI port.
- Confirm no dependency downgrade.
- Confirm Expo 54 / React 19 remain intact.

Verification:

- `npm run typecheck`
- `npm test -- --runInBand`
- `npm run build:web`
- Browser smoke through home, terminal, map, missions, trade sheet.

### Lane 4: Dev-Lab Roadmap Sync

Owner pool: Project manager agents, OpenClaw agents.

Goal: Keep dev-lab truthful while v8 work proceeds.

Deliverables:

- Update task board with Master V8 lanes.
- Link PRs to this work order.
- Record what was preserved from v6 and imported from dev-lab.
- Keep roadmap honest: branch work is not live deployment until merged/deployed.

## Merge Criteria

Do not merge a lane into `codex/master-v8` unless:

- It preserves v6 runtime dependencies.
- It passes typecheck, tests, and web export.
- It includes browser smoke notes.
- It lists files changed and known risks.
- It does not restore direct `BUY X` / `SELL Y` signal copy.

## Final v8 Candidate Criteria

Master V8 is ready only when:

- v6 stability is preserved.
- Intel System is active.
- Visual canon is substantially matched.
- Trade loop, missions, couriers, heat, rank, and market systems remain functional.
- Browser demo is investor-presentable.
