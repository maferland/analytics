import type { TrafficSummary, TrafficWindowDays } from '@/lib/traffic-summary'
import { formatDelta, formatNumber } from './dashboard-format'

type TrafficMetricsProps = {
  githubDownloads: number
  npmDownloads: number
  packageCount: number
  repoCount: number
  traffic: TrafficSummary
  trafficConnected: boolean
  windowDays: TrafficWindowDays
}

export function TrafficMetrics({
  githubDownloads,
  npmDownloads,
  packageCount,
  repoCount,
  traffic,
  trafficConnected,
  windowDays,
}: TrafficMetricsProps) {
  return (
    <section
      className="metrics"
      aria-label={`Last ${windowDays} days`}
      aria-live="polite"
    >
      <article aria-label="Selected visitors" className="metric-card">
        <p>Visitors</p>
        <strong>
          {trafficConnected ? formatNumber(traffic.visitors) : '—'}
        </strong>
        <span>Selected Vercel projects · {windowDays} days</span>
        <span className="metric-change">
          {traffic.previous
            ? `${formatDelta(traffic.visitors, traffic.previous.visitors)} vs prior ${windowDays}d`
            : 'No prior period'}
        </span>
      </article>
      <article aria-label="Selected pageviews" className="metric-card">
        <p>Pageviews</p>
        <strong>
          {trafficConnected ? formatNumber(traffic.pageviews) : '—'}
        </strong>
        <span>Selected Vercel projects · {windowDays} days</span>
        <span className="metric-change">
          {traffic.previous
            ? `${formatDelta(traffic.pageviews, traffic.previous.pageviews)} vs prior ${windowDays}d`
            : 'No prior period'}
        </span>
      </article>
      <article
        aria-label="npm downloads"
        className="metric-card metric-card-package"
      >
        <p>npm downloads</p>
        <strong>{packageCount ? formatNumber(npmDownloads) : '—'}</strong>
        <span>
          {packageCount
            ? 'Configured packages · last month'
            : 'No packages connected'}
        </span>
      </article>
      <article
        aria-label="GitHub downloads"
        className="metric-card metric-card-package"
      >
        <p>GitHub downloads</p>
        <strong>{repoCount ? formatNumber(githubDownloads) : '—'}</strong>
        <span>
          {repoCount ? 'Configured repos · all time' : 'No repos connected'}
        </span>
      </article>
    </section>
  )
}
