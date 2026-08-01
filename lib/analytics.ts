import { unstable_cache } from 'next/cache'

export type TrafficPoint = {
  pageviews: number
  timestamp: string
  visitors: number
}

type VercelProject = {
  id: string
  name: string
}

type VercelTrafficResponse = {
  data: TrafficPoint[]
}

type NpmDownloadsResponse = {
  downloads: number
  end: string
  package: string
  start: string
}

export type ProjectMetric = {
  name: string
  pageviews: number
  series: TrafficPoint[]
  visitors: number
}

export type DashboardData = {
  npm: {
    error: string | null
    packages: NpmDownloadsResponse[]
  }
  period: {
    since: string
    until: string
  }
  traffic: {
    error: string | null
    projects: ProjectMetric[]
  }
  updatedAt: string
}

const vercelProjects: readonly VercelProject[] = [
  { id: 'prj_nSRjqmUpdzUKFM1S5chj4HgOXatj', name: 'maferland.com' },
  { id: 'prj_7DZmkzRbTV0P2x90kn08dGIh7cMB', name: 'quebec.run' },
  { id: 'prj_82RN8gmWtdQJnGldcGNtVRljPLsP', name: 'mise' },
  { id: 'prj_FKIBBDA57Qr2FNQqYKKniP7FnAgG', name: 'keyhole' },
  { id: 'prj_6glEwCmYV1KMgJO25TF3N3bsgmb1', name: 'pinpoint' },
  { id: 'prj_jIhnT8qD2idQGjxdgcsFwJYYDdup', name: 'snip' },
]

const millisecondsPerDay = 24 * 60 * 60 * 1000

const toDate = (date: Date) => date.toISOString().slice(0, 10)

const getPeriod = () => {
  const until = new Date()
  const since = new Date(until.getTime() - 29 * millisecondsPerDay)

  return { since: toDate(since), until: toDate(until) }
}

const getNpmPackages = () =>
  (process.env.ANALYTICS_NPM_PACKAGES ?? '')
    .split(/[\n,]/)
    .map(packageName => packageName.trim())
    .filter(Boolean)

const getVercelTraffic = async (period: DashboardData['period']) => {
  const token = process.env.VERCEL_ANALYTICS_TOKEN
  if (!token) {
    return {
      error: 'Traffic data is not yet connected.',
      projects: [],
    }
  }

  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID ?? 'mafer'
  const requests = vercelProjects.map(async project => {
    const params = new URLSearchParams({
      by: 'day',
      projectId: project.id,
      since: period.since,
      teamId,
      until: period.until,
    })
    const response = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!response.ok) {
      throw new Error(`Vercel returned ${response.status}.`)
    }

    const payload = (await response.json()) as VercelTrafficResponse
    return { name: project.name, series: payload.data }
  })

  try {
    const responses = await Promise.all(requests)
    const projects = responses.map(({ name, series }) => {
      let pageviews = 0
      let visitors = 0

      for (const point of series) {
        pageviews += point.pageviews
        visitors += point.visitors
      }

      return { name, pageviews, series, visitors }
    })

    return { error: null, projects }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to load traffic data.',
      projects: [],
    }
  }
}

const getNpmDownloads = async () => {
  const packageNames = getNpmPackages()
  if (!packageNames.length) {
    return { error: null, packages: [] }
  }

  try {
    const packages = await Promise.all(
      packageNames.map(async packageName => {
        const response = await fetch(
          `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(packageName)}`,
        )
        if (!response.ok) {
          throw new Error(`npm returned ${response.status}.`)
        }

        return (await response.json()) as NpmDownloadsResponse
      }),
    )

    return { error: null, packages }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to load npm downloads.',
      packages: [],
    }
  }
}

const loadDashboardData = async (): Promise<DashboardData> => {
  const period = getPeriod()
  const [traffic, npm] = await Promise.all([
    getVercelTraffic(period),
    getNpmDownloads(),
  ])

  return {
    npm,
    period,
    traffic,
    updatedAt: new Date().toISOString(),
  }
}

export const getDashboardData = unstable_cache(loadDashboardData, ['analytics'], {
  revalidate: 60 * 60,
})
