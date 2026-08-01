import type { ProjectMetric, TrafficPoint } from './analytics'

export type TrafficSummary = {
  pageviews: number
  series: TrafficPoint[]
  visitors: number
}

export const summarizeTraffic = (projects: ProjectMetric[]): TrafficSummary => {
  const pointsByDate = new Map<string, TrafficPoint>()
  let pageviews = 0
  let visitors = 0

  for (const project of projects) {
    pageviews += project.pageviews
    visitors += project.visitors

    for (const point of project.series) {
      const existing = pointsByDate.get(point.timestamp)
      pointsByDate.set(point.timestamp, {
        pageviews: (existing?.pageviews ?? 0) + point.pageviews,
        timestamp: point.timestamp,
        visitors: (existing?.visitors ?? 0) + point.visitors,
      })
    }
  }

  return {
    pageviews,
    series: [...pointsByDate.values()].sort((left, right) =>
      left.timestamp.localeCompare(right.timestamp),
    ),
    visitors,
  }
}
