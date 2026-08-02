<div align="center">
<h1>📈 analytics.maferland.com</h1>

<p>Public aggregate metrics for Marc-Antoine Ferland's projects.</p>
</div>

---

Compare selected projects' traffic and package downloads without exposing visitor-level activity.

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- A Vercel access token with access to every tracked project

## Install

```bash
bun install
cp .env.example .env.local
```

## Usage

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Configure:

```bash
VERCEL_ANALYTICS_TOKEN=
VERCEL_ANALYTICS_TEAM_ID=mafer
ANALYTICS_NPM_PACKAGES=@scope/package,another-package
```

Select projects and a 7, 14, or 30-day window. Inspect daily chart points by pointer or keyboard. The page caches aggregate provider results for five minutes.

## Privacy

The dashboard shows aggregate visitors, pageviews, and package downloads. It intentionally excludes paths, referrers, countries, visitor-level records, and revenue.

## Requirements

Production uses Vercel. Configure the same environment variables, then assign `analytics.maferland.com` to the project.

## Sources

- [Vercel Web Analytics API](https://vercel.com/docs/analytics/web-analytics-api)
- [npm downloads API](https://api.npmjs.org/downloads/point/last-month/@vercel/analytics)

## License

[MIT](LICENSE)
