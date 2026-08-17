'use client'

import { useState } from 'react'
import { DashboardControls } from './DashboardControls'
import { TrafficChart } from './TrafficChart'
import { TrafficMetrics } from './TrafficMetrics'
import {
  dateFormatter,
  formatDelta,
  formatNumber,
  timestampFormatter,
} from './dashboard-format'
import type { DashboardData, TrafficPoint } from '@/lib/analytics'
import { summarizeTraffic, type TrafficWindowDays } from '@/lib/traffic-summary'

export function DashboardClient({ data }: { data: DashboardData }) {
  const [selectedProjectNames, setSelectedProjectNames] = useState(() =>
    data.traffic.projects.map((project) => project.name)
  )
  const [windowDays, setWindowDays] = useState<TrafficWindowDays>(30)
  const [activeTrafficTimestamp, setActiveTrafficTimestamp] = useState<
    string | null
  >(null)
  const selectedProjects = data.traffic.projects.filter((project) =>
    selectedProjectNames.includes(project.name)
  )
  const traffic = summarizeTraffic(selectedProjects, windowDays)
  const projectTraffic = selectedProjects.map((project) => ({
    project,
    traffic: summarizeTraffic([project], windowDays),
  }))
  const activeTrafficPoint =
    traffic.series.find(
      (point) => point.timestamp === activeTrafficTimestamp
    ) ??
    traffic.series[0] ??
    null
  const dailyProjectTraffic = activeTrafficPoint
    ? selectedProjects.map((project) => ({
        point: project.series.find(
          (point) => point.timestamp === activeTrafficPoint.timestamp
        ),
        project,
      }))
    : []
  const selectedProject = projectTraffic.length === 1 ? projectTraffic[0] : null
  const busiestDay =
    selectedProject?.traffic.series.reduce<TrafficPoint | null>(
      (busiest, point) =>
        !busiest || point.pageviews > busiest.pageviews ? point : busiest,
      null
    )
  const trafficConnected = data.traffic.projects.length > 0
  const trafficIsPartial = Boolean(data.traffic.error || data.traffic.warning)
  const npmDownloads = data.npm.packages.reduce(
    (sum, packageMetric) => sum + packageMetric.downloads,
    0
  )
  const githubDownloads = data.github.repos.reduce(
    (sum, repo) => sum + repo.downloads,
    0
  )

  const toggleProject = (projectName: string) => {
    setSelectedProjectNames((selectedNames) =>
      selectedNames.includes(projectName)
        ? selectedNames.filter((name) => name !== projectName)
        : [...selectedNames, projectName]
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

        <DashboardControls
          hasPreviousPeriod={Boolean(traffic.previous)}
          onSelectedProjectNamesChange={setSelectedProjectNames}
          onToggleProject={toggleProject}
          onWindowDaysChange={setWindowDays}
          projects={data.traffic.projects}
          selectedProjectNames={selectedProjectNames}
          windowDays={windowDays}
        />

        <TrafficMetrics
          githubDownloads={githubDownloads}
          npmDownloads={npmDownloads}
          packageCount={data.npm.packages.length}
          repoCount={data.github.repos.length}
          traffic={traffic}
          trafficConnected={trafficConnected}
          windowDays={windowDays}
        />

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
              <TrafficChart
                onActivePointChange={(point) =>
                  setActiveTrafficTimestamp(point.timestamp)
                }
                series={traffic.series}
              />
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
                    <span role="cell">
                      <a href={project.url}>{project.name}</a>
                    </span>
                    <span role="cell">
                      {formatNumber(projectSummary.visitors)}
                    </span>
                    <span role="cell">
                      {formatNumber(projectSummary.pageviews)}
                    </span>
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
                {data.npm.packages.map((packageMetric) => (
                  <div className="npm-row" key={packageMetric.package}>
                    <a
                      href={`https://www.npmjs.com/package/${packageMetric.package}`}
                    >
                      <code>{packageMetric.package}</code>
                    </a>
                    <strong>{formatNumber(packageMetric.downloads)}</strong>
                    <span>
                      {dateFormatter.format(new Date(packageMetric.start))} to{' '}
                      {dateFormatter.format(new Date(packageMetric.end))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">
                Package totals appear after packages are selected.
              </p>
            )}
          </section>

          <section className="panel" aria-labelledby="github-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Distribution</p>
                <h2 id="github-title">GitHub downloads</h2>
              </div>
              <span>{data.github.repos.length} connected</span>
            </div>
            {data.github.error ? (
              <p className="connection-note">{data.github.error}</p>
            ) : data.github.repos.length ? (
              <div className="npm-list">
                {data.github.repos.map((repo) => (
                  <div className="npm-row" key={repo.name}>
                    <a href={repo.url}>
                      <code>{repo.name}</code>
                    </a>
                    <strong>{formatNumber(repo.downloads)}</strong>
                    <span>all releases</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">
                Repo totals appear after repos are selected.
              </p>
            )}
          </section>

          {activeTrafficPoint ? (
            <section
              className="panel daily-project-detail"
              aria-labelledby="daily-project-detail-title"
            >
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Selected day</p>
                  <h2 id="daily-project-detail-title">Daily app breakdown</h2>
                </div>
                <span>
                  {dateFormatter.format(new Date(activeTrafficPoint.timestamp))}
                </span>
              </div>
              <div className="data-table" role="table">
                <div className="table-row table-heading" role="row">
                  <span role="columnheader">Project</span>
                  <span role="columnheader">Visitors</span>
                  <span role="columnheader">Views</span>
                </div>
                {dailyProjectTraffic.map(({ point, project }) => (
                  <div className="table-row" key={project.name} role="row">
                    <span role="cell">
                      <a href={project.url}>{project.name}</a>
                    </span>
                    <span role="cell">
                      {formatNumber(point?.visitors ?? 0)}
                    </span>
                    <span role="cell">
                      {formatNumber(point?.pageviews ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {selectedProject ? (
            <section
              className="panel project-detail"
              aria-labelledby="project-detail-title"
            >
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">App detail</p>
                  <h2 id="project-detail-title">
                    {selectedProject.project.name}
                  </h2>
                </div>
                <span>{windowDays} days</span>
              </div>
              <div className="detail-metrics">
                <div>
                  <span>Views / visitor</span>
                  <strong>
                    {selectedProject.traffic.visitors
                      ? (
                          selectedProject.traffic.pageviews /
                          selectedProject.traffic.visitors
                        ).toFixed(2)
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
                          selectedProject.traffic.previous.pageviews
                        )
                      : 'No prior period'}
                  </strong>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <footer>
          <span>
            Sources: Vercel Web Analytics · npm downloads · GitHub downloads
          </span>
          <time dateTime={data.updatedAt}>
            Updated {timestampFormatter.format(new Date(data.updatedAt))}
          </time>
        </footer>
      </div>
    </main>
  )
}
