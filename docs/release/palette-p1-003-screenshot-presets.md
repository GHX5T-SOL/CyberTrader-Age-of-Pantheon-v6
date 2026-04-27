# palette-p1-003 Screenshot-safe Visual State Presets

## Goal
Create a set of UI state presets that can be used to generate store‑ready screenshots without displaying debugging or raw technical UI elements.

### Tasks
1. Identify screens required for Apple/Google store submissions (Home, Terminal, Market, Profile, Settings).
2. Add a utility `scripts/generate-screenshot-presets.mjs` that:
   - Launches the Expo web export in a headless browser.
   - Navigates to each target route.
   - Applies a deterministic game state (e.g., first profitable trade completed, some energy/heat values, a few positions).
   - Takes a PNG screenshot saved under `assets/screenshots/`.
3. Ensure the captured UI respects the visual guidelines from `vex-p0-001` (HUD readability, touch‑target size) and does not contain any development‑only badges or debug panels.
4. Document the process in this markdown file and link it from the task map.

### Status
- **In progress** – skeleton script added, pending integration with Axiom QA capture route verification.
