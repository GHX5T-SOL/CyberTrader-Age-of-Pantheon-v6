# nyx-p1-003 - AgentOS Faction Choice Design

Status: complete
Owner: Nyx

## Scope

This pass defines the Phase 2 AgentOS faction-choice foundation without surfacing the final selection controls. It unblocks `nyx-p1-004` by making the gate, faction stakes, public contracts, mission hooks, persistence shape, authority action, and one-free-switch rule deterministic and testable.

SuperDesign context:

- Project: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/841b8d96-38bd-4372-a22b-f6452ec3d55e`
- Reproduction draft: `b84f6a45-ca2c-4c3c-9e3f-613aa2dbb317`
- AgentOS readiness branch: `https://p.superdesign.dev/draft/7ec5931e-1283-4235-9256-c1537d024b91`

## AgentOS Gate

AgentOS becomes available when all three requirements pass:

- Rank 5 or higher.
- One profitable sell completed.
- Heat at 70 or lower.

The gate is implemented in `engine/factions.ts` as `getAgentOsFactionGate`, returning serializable checklist rows for UI and tests. `getAgentOsGateProgress` returns a compact completion percentage for surfaced readiness rails. The `/menu/progression` and `/missions` routes now render those requirements directly so players can see why AgentOS is locked or ready.

## Launch Factions

The four launch factions are:

- Free Splinters: safer recovery contracts and lower-risk delivery pressure.
- Blackwake: courier upside with sharper timing and route risk.
- Null Crown: contraband-leaning contracts with stricter Heat discipline.
- Archivists: intel and hold missions that favor patient route planning.

Each faction has deterministic mission bias, Heat posture, and reward modifier metadata. The data is visible in `/menu/progression` as a rank-5 preview and is now activated by the follow-up `nyx-p1-004` selection loop. `/missions` also maps existing NPC faction labels into launch AgentOS factions so contact rows show whether a contact contributes to Blackwake, Null Crown, or Archivists standing.

## Runtime Foundation

The store and LocalAuthority expose the faction binding path:

- `FactionChoice` can be persisted with the rest of the local demo session.
- `chooseFaction` validates the AgentOS gate before binding a faction.
- Faction-bound missions bias NPC pools, mission types, and reward multipliers deterministically.

The final player-facing selection/reselection UI is documented in `docs/release/nyx-p1-004-agentos-faction-selection.md`.

## Switch Rule

The first faction selection gets one free allegiance switch before PantheonOS-level authority. After that switch is used, future allegiance changes are blocked until a later PantheonOS system explicitly permits them. The rule is implemented by `getFactionSwitchRule`.

## Validation

- `engine/__tests__/factions.test.ts` covers faction definitions, AgentOS gate requirements/progress, NPC faction mapping, the one-free-switch rule, OS tier mapping, and serializable standing output.
- Player-facing copy remains local-mode and store-safe: no real-money, investment, prize, cash-out, staking, or wallet-signing claims.

## Next

`nyx-p1-004` now exposes the faction-selection loop. Next Nyx work should build faction-specific contract chains and route-map objectives on top of the bound allegiance.
