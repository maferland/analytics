# analytics.maferland.com

A small public ledger for the projects I ship.

It currently pulls aggregate traffic from Vercel and download counts from npm. The dashboard deliberately leaves out the interesting-but-creepy stuff: no paths, referrers, countries, or visitor-level records. Revenue can join later when there is a source worth connecting.

## What it shows

- Visitors and pageviews across selected Vercel projects for the last 30 days
- A daily pageview trend
- Per-project traffic totals
- npm downloads for an explicit package allowlist

## Run it locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The npm section works after setting `ANALYTICS_NPM_PACKAGES`. Vercel traffic also needs a personal access token with access to the tracked projects.

```bash
VERCEL_ANALYTICS_TOKEN=
VERCEL_ANALYTICS_TEAM_ID=mafer
ANALYTICS_NPM_PACKAGES=@scope/package,another-package
```

`VERCEL_ANALYTICS_TOKEN` stays on the server. The page fetches source data once per hour, then serves the cached aggregate result.

## Deploy

The project deploys on Vercel. Set the same environment variables for production, then assign `analytics.maferland.com` to the project. The dashboard is designed to stay public, so only add metrics you are comfortable publishing.

## Sources

- [Vercel Web Analytics API](https://vercel.com/docs/analytics/web-analytics-api)
- [npm downloads API](https://api.npmjs.org/downloads/point/last-month/@vercel/analytics)
