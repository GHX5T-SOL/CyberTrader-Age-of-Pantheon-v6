# SuperDesign Init - Routes

Generated: 2026-04-26

## Route Map

- `/`: `app/index.tsx`; waits for `useDemoBootstrap`, then routes through `getDemoHref`.
- `/video-intro`: cinematic intro route; configured in `state/demo-routes.ts` as the first intro destination when intro has not been seen.
- `/intro`: text lore intro with skip; marks intro seen and replaces to `/login`.
- `/login`: local handle claim; sets handle and replaces to `/boot`.
- `/handle`: redirects to `/login`.
- `/boot`: boot sequence; completes boot and replaces to `/home`.
- `/home`: active deck dashboard; pushes `/tutorial` if tutorial is incomplete.
- `/tutorial`: modal tutorial; completes tutorial and replaces to `/home`.
- `/terminal`: active S1LKROAD market and trade ticket.
- `/market`: redirects to `/terminal`.
- `/missions`: mission route.
- `/menu/*`: profile, settings, inventory, progression, rank, rewards, notifications, help, legal.

## Phase Routing

`state/demo-routes.ts` maps phase state to routes:

- `intro`: `/video-intro` unless `introSeen`, then `/login`.
- `login`: `/login`.
- `boot`: `/boot`.
- `handle`: `/login`.
- `home`: `/home`.
- `terminal`: `/terminal`.

Protected route recovery sends unauthenticated `home` or `terminal` sessions back to `/login`.
