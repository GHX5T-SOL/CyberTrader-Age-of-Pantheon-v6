# nyx-p1-005 - AgentOS Contract Chains

Date: 2026-04-29
Owner: Nyx/Codex

## Outcome

AgentOS faction missions now expose deterministic contract-chain stakes instead of only a generic faction bias. Each launch faction has four reputation-linked stages (`neutral`, `trusted`, `favored`, `legend`) with a stage label, Heat posture, route consequence, and success reputation delta.

Player-facing surfaces now show the same contract signal in:

- Incoming and active mission banners.
- Mission contact rows, including locked contacts at reduced intensity.

## Design

SuperDesign project: `CyberTrader v6 AgentOS contract chain`

- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/bd90dfac-fe63-4647-8c8f-a392be88f23d`
- Current-state draft: `8ed852ec-6fb9-4b42-9ff0-790a88fb8706`
- Contract-chain branch: `8132f3d8-d0a0-4323-a99e-d0643137658e`
- Preview URL: `https://p.superdesign.dev/draft/8132f3d8-d0a0-4323-a99e-d0643137658e`

The implemented direction keeps the existing `/missions` hierarchy, terminal mono type, one-pixel panels, and compact mobile layout. The new strip uses only the existing cyan/amber/green/dim token system and avoids real-money, prize, wallet, or investment language.

## Validation

Focused validation added:

- `engine/__tests__/factions.test.ts` verifies every faction has a four-stage contract chain and maps reputation to a public signal.
- `engine/__tests__/mission-generator.test.ts` verifies aligned AgentOS missions carry the contract signal and scaled reputation deltas.

Pending native validation remains unchanged: iOS Simulator, Android Emulator, and final store-owner submission evidence still require the provisioned QA/store environment tracked in Dev Lab.
