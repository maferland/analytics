'use client'

import { useState } from 'react'
import type { DashboardData, TrafficPoint } from '@/lib/analytics'
import { summarizeTraffic } from '@/lib/traffic-summary'

const numberFormatter = new Intl.NumberFormat('en-US')
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  timeZone: 'UTC',
  timeZoneName: 'short',
  year: 'numeric',
})

const formatNumber = (value: number) => numberFormatter.format(value)

function TrafficChart({ series }: { series: TrafficPoint[] }) {
  if (!series.length) {
    return <p className="empty-copy">Select a project to plot its traffic.</p>
  }

  const maximum = Math.max(...series.map(point => point.pageviews), 1)
  const width = 720
  const height = 180
  const points = series
    .map((point, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * width
      const y = height - (point.pageviews / maximum) * (height - 16) - 8
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="chart-wrap">
      <svg
        aria-label="Daily pageviews over the last 30 days"
        className="chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line className="chart-guide" x1="0" x2={width} y1="172" y2="172" />
        <polyline className="chart-line" points={points} />
      </svg>
      <div className="chart-axis" aria-hidden="true">
        <span>{dateFormatter.format(new Date(series[0].timestamp))}</span>
        <span>{dateFormatter.format(new Date(series.at(-1)!.timestamp))}</span>
      </div>
    </div>
  )
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const [selectedProjectNames, setSelectedProjectNames] = useState(() =>
    data.traffic.projects.map(project => project.name),
  )
  const selectedProjects = data.traffic.projects.filter(project =>
    selectedProjectNames.includes(project.name),
  )
  const traffic = summarizeTraffic(selectedProjects)
  const trafficConnected = data.traffic.projects.length > 0
  const trafficIsPartial = Boolean(data.traffic.error || data.traffic.warning)
  const npmDownloads = data.npm.packages.reduce(
    (sum, packageMetric) => sum + packageMetric.downloads,
    0,
  )

  const toggleProject = (projectName: string) => {
    setSelectedProjectNames(selectedNames =>
      selectedNames.includes(projectName)
        ? selectedNames.filter(name => name !== projectName)
        : [...selectedNames, projectName],
    )
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-grid" aria-hidden="true" />
      <div className="dashboard-content">
        <header className="masthead">
          <a className="wordmark" href="https://www.maferland.com">
            maferland.com
          </a>
          <p className="status">
            <span
              className={trafficIsPartial ? 'status-dot muted' : 'status-dot'}
            />
            {trafficIsPartial ? 'Partial data' : 'Live aggregate data'}
          </p>
        </header>

        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Independent project ledger</p>
          <h1 id="page-title">What the work reaches.</h1>
          <p className="lede">
            Public, aggregate metrics from selected projects. No visitor-level
            data, routes, referrers, or revenue are shown here.
          </p>
        </section>

        <section className="panel filter-panel" aria-labelledby="filter-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Filter</p>
              <h2 id="filter-title">Projects in view</h2>
            </div>
            <span>
              {selectedProjects.length} of {data.traffic.projects.length}
            </span>
          </div>
          {data.traffic.projects.length ? (
            <fieldset className="project-filter">
              <legend className="sr-only">Select Vercel projects</legend>
              <div className="filter-actions">
                <button
                  onClick={() =>
                    setSelectedProjectNames(
                      data.traffic.projects.map(project => project.name),
                    )
                  }
                  type="button"
                >
                  All projects
                </button>
                <button onClick={() => setSelectedProjectNames([])} type="button">
                  Clear
                </button>
              </div>
              <div className="filter-options">
                {data.traffic.projects.map(project => (
                  <label className="filter-option" key={project.name}>
                    <input
                      checked={selectedProjectNames.includes(project.name)}
                      onChange={() => toggleProject(project.name)}
                      type="checkbox"
                    />
                    <span>{project.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="empty-copy">Filters appear once traffic connects.</p>
          )}
        </section>

        <section className="metrics" aria-label="Last 30 days" aria-live="polite">
          <article aria-label="Selected visitors" className="metric-card">
            <p>Visitors</p>
            <strong>{trafficConnected ? formatNumber(traffic.visitors) : '—'}</strong>
            <span>Selected Vercel projects · 30 days</span>
          </article>
          <article aria-label="Selected pageviews" className="metric-card">
            <p>Pageviews</p>
            <strong>{trafficConnected ? formatNumber(traffic.pageviews) : '—'}</strong>
            <span>Selected Vercel projects · 30 days</span>
          </article>
          <article aria-label="npm downloads" className="metric-card">
            <p>npm downloads</p>
            <strong>{data.npm.packages.length ? formatNumber(npmDownloads) : '—'}</strong>
            <span>
              {data.npm.packages.length
                ? 'Configured packages · last month'
                : 'No packages connected'}
            </span>
          </article>
        </section>

        <section className="panel trend-panel" aria-labelledby="traffic-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Traffic</p>
              <h2 id="traffic-title">Daily pageviews</h2>
            </div>
            <p>
              {dateFormatter.format(new Date(data.period.since))} to{' '}
              {dateFormatter.format(new Date(data.period.until))}
            </p>
          </div>
          {data.traffic.error ? (
            <p className="connection-note">{data.traffic.error}</p>
          ) : (
            <>
              {data.traffic.warning ? (
                <p className="connection-note">{data.traffic.warning}</p>
              ) : null}
              <TrafficChart series={traffic.series} />
            </>
          )}
        </section>

        <div className="detail-grid">
          <section className="panel" aria-labelledby="projects-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Projects</p>
                <h2 id="projects-title">Traffic by app</h2>
              </div>
              <span>{selectedProjects.length} in view</span>
            </div>
            {selectedProjects.length ? (
              <div className="data-table" role="table">
                <div className="table-row table-heading" role="row">
                  <span role="columnheader">Project</span>
                  <span role="columnheader">Visitors</span>
                  <span role="columnheader">Views</span>
                </div>
                {selectedProjects.map(project => (
                  <div className="table-row" key={project.name} role="row">
                    <span role="cell">{project.name}</span>
                    <span role="cell">{formatNumber(project.visitors)}</span>
                    <span role="cell">{formatNumber(project.pageviews)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">Select a project to see its totals.</p>
            )}
          </section>

          <section className="panel" aria-labelledby="npm-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Distribution</p>
                <h2 id="npm-title">npm packages</h2>
              </div>
              <span>{data.npm.packages.length} connected</span>
            </div>
            {data.npm.packages.length ? (
              <div className="npm-list">
                {data.npm.packages.map(packageMetric => (
                  <div className="npm-row" key={packageMetric.package}>
                    <code>{packageMetric.package}</code>
                    <strong>{formatNumber(packageMetric.downloads)}</strong>
                    <span>
                      {dateFormatter.format(new Date(packageMetric.start))} to{' '}
                      {dateFormatter.format(new Date(packageMetric.end))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">Package totals appear after packages are selected.</p>
            )}
          </section>
        </div>

        <footer>
          <span>Sources: Vercel Web Analytics · npm downloads</span>
          <time dateTime={data.updatedAt}>
            Updated {timestampFormatter.format(new Date(data.updatedAt))}
          </time>
        </footer>
      </div>
    </main>
  )
}
