'use client'

import { useState } from 'react'
import type { DashboardData, TrafficPoint } from '@/lib/analytics'
import { summarizeTraffic, type TrafficWindowDays } from '@/lib/traffic-summary'

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

const formatDelta = (current: number, previous: number) => {
  if (!previous) {
    return 'New'
  }

  const percentage = Math.round(((current - previous) / previous) * 100)
  return `${percentage > 0 ? '+' : ''}${percentage}%`
}

function TrafficChart({ series }: { series: TrafficPoint[] }) {
  const [activePointIndex, setActivePointIndex] = useState(0)

  if (!series.length) {
    return <p className="empty-copy">Select a project to plot its traffic.</p>
  }

  const maximum = Math.max(...series.map(point => point.pageviews), 1)
  const width = 720
  const height = 180
  const chartPoints = series.map((point, index) => ({
    point,
    x: (index / Math.max(series.length - 1, 1)) * width,
    y: height - (point.pageviews / maximum) * (height - 16) - 8,
  }))
  const activePoint = chartPoints[Math.min(activePointIndex, chartPoints.length - 1)]

  return (
    <div className="chart-wrap">
      <div className="chart-inspector" aria-live="polite">
        <span>{dateFormatter.format(new Date(activePoint.point.timestamp))}</span>
        <strong>{formatNumber(activePoint.point.pageviews)} pageviews</strong>
        <span>{formatNumber(activePoint.point.visitors)} visitors</span>
      </div>
      <svg
        aria-label="Daily pageviews for the selected period"
        className="chart"
        role="group"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line className="chart-guide" x1="0" x2={width} y1="172" y2="172" />
        <polyline
          className="chart-line"
          points={chartPoints.map(({ x, y }) => `${x},${y}`).join(' ')}
        />
        {chartPoints.map(({ point, x, y }, index) => (
          <circle
            aria-label={`${dateFormatter.format(new Date(point.timestamp))}: ${formatNumber(point.pageviews)} pageviews, ${formatNumber(point.visitors)} visitors`}
            className={index === activePointIndex ? 'chart-point active' : 'chart-point'}
            cx={x}
            cy={y}
            key={point.timestamp}
            onClick={() => setActivePointIndex(index)}
            onFocus={() => setActivePointIndex(index)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                setActivePointIndex(index)
              }
            }}
            onPointerEnter={() => setActivePointIndex(index)}
            r="7"
            role="button"
            tabIndex={0}
          />
        ))}
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
  const [windowDays, setWindowDays] = useState<TrafficWindowDays>(30)
  const selectedProjects = data.traffic.projects.filter(project =>
    selectedProjectNames.includes(project.name),
  )
  const traffic = summarizeTraffic(selectedProjects, windowDays)
  const projectTraffic = selectedProjects.map(project => ({
    project,
    traffic: summarizeTraffic([project], windowDays),
  }))
  const selectedProject = projectTraffic.length === 1 ? projectTraffic[0] : null
  const busiestDay = selectedProject?.traffic.series.reduce<TrafficPoint | null>(
    (busiest, point) =>
      !busiest || point.pageviews > busiest.pageviews ? point : busiest,
    null,
  )
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

        <section className="panel range-panel" aria-labelledby="range-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Window</p>
              <h2 id="range-title">Traffic period</h2>
            </div>
            <span>{windowDays} days</span>
          </div>
          <div aria-label="Select traffic period" className="range-controls" role="group">
            {([7, 14, 30] as const).map(days => (
              <button
                aria-pressed={windowDays === days}
                className={windowDays === days ? 'selected' : undefined}
                key={days}
                onClick={() => setWindowDays(days)}
                type="button"
              >
                {days} days
              </button>
            ))}
          </div>
          <p className="range-note">
            {traffic.previous
              ? `Changes compare this window with the preceding ${windowDays} days.`
              : 'A matching prior period is not available for this window.'}
          </p>
        </section>

        <section
          className="metrics"
          aria-label={`Last ${windowDays} days`}
          aria-live="polite"
        >
          <article aria-label="Selected visitors" className="metric-card">
            <p>Visitors</p>
            <strong>{trafficConnected ? formatNumber(traffic.visitors) : '—'}</strong>
            <span>Selected Vercel projects · {windowDays} days</span>
            <span className="metric-change">
              {traffic.previous
                ? `${formatDelta(traffic.visitors, traffic.previous.visitors)} vs prior ${windowDays}d`
                : 'No prior period'}
            </span>
          </article>
          <article aria-label="Selected pageviews" className="metric-card">
            <p>Pageviews</p>
            <strong>{trafficConnected ? formatNumber(traffic.pageviews) : '—'}</strong>
            <span>Selected Vercel projects · {windowDays} days</span>
            <span className="metric-change">
              {traffic.previous
                ? `${formatDelta(traffic.pageviews, traffic.previous.pageviews)} vs prior ${windowDays}d`
                : 'No prior period'}
            </span>
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
              {traffic.series.length
                ? `${dateFormatter.format(new Date(traffic.series[0].timestamp))} to ${dateFormatter.format(new Date(traffic.series.at(-1)!.timestamp))}`
                : 'No projects selected'}
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
              <span>
                {selectedProjects.length} in view · {windowDays} days
              </span>
            </div>
            {selectedProjects.length ? (
              <div className="data-table" role="table">
                <div className="table-row table-heading" role="row">
                  <span role="columnheader">Project</span>
                  <span role="columnheader">Visitors</span>
                  <span role="columnheader">Views</span>
                </div>
                {projectTraffic.map(({ project, traffic: projectSummary }) => (
                  <div className="table-row" key={project.name} role="row">
                    <span role="cell">{project.name}</span>
                    <span role="cell">{formatNumber(projectSummary.visitors)}</span>
                    <span role="cell">{formatNumber(projectSummary.pageviews)}</span>
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

          {selectedProject ? (
            <section className="panel project-detail" aria-labelledby="project-detail-title">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">App detail</p>
                  <h2 id="project-detail-title">{selectedProject.project.name}</h2>
                </div>
                <span>{windowDays} days</span>
              </div>
              <div className="detail-metrics">
                <div>
                  <span>Views / visitor</span>
                  <strong>
                    {selectedProject.traffic.visitors
                      ? (selectedProject.traffic.pageviews / selectedProject.traffic.visitors).toFixed(2)
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>Strongest day</span>
                  <strong>
                    {busiestDay
                      ? `${dateFormatter.format(new Date(busiestDay.timestamp))} · ${formatNumber(busiestDay.pageviews)}`
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>Pageview change</span>
                  <strong>
                    {selectedProject.traffic.previous
                      ? formatDelta(
                          selectedProject.traffic.pageviews,
                          selectedProject.traffic.previous.pageviews,
                        )
                      : 'No prior period'}
                  </strong>
                </div>
              </div>
            </section>
          ) : null}
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
