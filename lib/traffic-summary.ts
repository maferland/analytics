import type { ProjectMetric, TrafficPoint } from './analytics'

export type TrafficWindowDays = 7 | 14 | 30

export type TrafficSummary = {
  pageviews: number
  previous: {
    pageviews: number
    visitors: number
  } | null
  series: TrafficPoint[]
  visitors: number
}

const summarizePoints = (points: TrafficPoint[]) =>
  points.reduce(
    (summary, point) => ({
      pageviews: summary.pageviews + point.pageviews,
      visitors: summary.visitors + point.visitors,
    }),
    { pageviews: 0, visitors: 0 }
  )

export const summarizeTraffic = (
  projects: ProjectMetric[],
  windowDays: TrafficWindowDays = 30
): TrafficSummary => {
  const pointsByDate = new Map<string, TrafficPoint>()

  for (const project of projects) {
    for (const point of project.series) {
      const existing = pointsByDate.get(point.timestamp)
      pointsByDate.set(point.timestamp, {
        pageviews: (existing?.pageviews ?? 0) + point.pageviews,
        timestamp: point.timestamp,
        visitors: (existing?.visitors ?? 0) + point.visitors,
      })
    }
  }

  const series = [...pointsByDate.values()].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp)
  )
  const windowSeries = series.slice(-windowDays)
  const previousSeries = series.slice(-2 * windowDays, -windowDays)

  return {
    ...summarizePoints(windowSeries),
    previous:
      previousSeries.length === windowDays
        ? summarizePoints(previousSeries)
        : null,
    series: windowSeries,
  }
}
