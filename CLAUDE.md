# Analytics dashboard

## Commands

```bash
bun install
bun run dev
bun run lint
bun run format:check
bun run test
bun run typecheck
bun run build
```

## Constraints

- Keep the dashboard public and aggregate-only. Never expose visitor-level data, routes, referrers, countries, or secrets.
- Fetch provider data only on the server. `VERCEL_ANALYTICS_TOKEN` must never reach client code.
- Keep the dashboard dependency-light; use native SVG for charts unless a library materially reduces complexity.
- Preserve keyboard-accessible project, range, and chart controls.
