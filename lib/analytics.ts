import { unstable_cache } from 'next/cache'

export type TrafficPoint = {
  pageviews: number
  timestamp: string
  visitors: number
}

type VercelProject = {
  id: string
  name: string
  url: string
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

type GitHubReleaseResponse = {
  assets: Array<{ download_count: number }>
}

type ReleaseRepository = {
  name: string
  url: string
}

export type ProjectMetric = {
  name: string
  pageviews: number
  series: TrafficPoint[]
  url: string
  visitors: number
}

export type ReleaseDownloadMetric = {
  downloads: number
  repository: string
  url: string
}

export type DashboardData = {
  npm: {
    error: string | null
    packages: NpmDownloadsResponse[]
  }
  releases: {
    error: string | null
    repositories: ReleaseDownloadMetric[]
  }
  period: {
    since: string
    until: string
  }
  traffic: {
    error: string | null
    projects: ProjectMetric[]
    warning: string | null
  }
  updatedAt: string
}

const vercelProjects: readonly VercelProject[] = [
  {
    id: 'prj_nSRjqmUpdzUKFM1S5chj4HgOXatj',
    name: 'maferland.com',
    url: 'https://www.maferland.com',
  },
  {
    id: 'prj_7DZmkzRbTV0P2x90kn08dGIh7cMB',
    name: 'quebec.run',
    url: 'https://www.quebec.run',
  },
  {
    id: 'prj_82RN8gmWtdQJnGldcGNtVRljPLsP',
    name: 'mise',
    url: 'https://mise.maferland.com',
  },
  {
    id: 'prj_FKIBBDA57Qr2FNQqYKKniP7FnAgG',
    name: 'keyhole',
    url: 'https://keyhole.maferland.com',
  },
  {
    id: 'prj_6glEwCmYV1KMgJO25TF3N3bsgmb1',
    name: 'pinpoint',
    url: 'https://pinpoint.maferland.com',
  },
  {
    id: 'prj_jIhnT8qD2idQGjxdgcsFwJYYDdup',
    name: 'snip',
    url: 'https://snip.maferland.com',
  },
]

const releaseRepositories: readonly ReleaseRepository[] = [
  {
    name: 'termrocket',
    url: 'https://github.com/maferland/termrocket',
  },
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
    .map((packageName) => packageName.trim())
    .filter(Boolean)

const getVercelTraffic = async (period: DashboardData['period']) => {
  const token = process.env.VERCEL_ANALYTICS_TOKEN
  if (!token) {
    return {
      error: 'Traffic data is not yet connected.',
      projects: [],
      warning: null,
    }
  }

  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID ?? 'mafer'
  const requests = vercelProjects.map(async (project) => {
    const params = new URLSearchParams({
      by: 'day',
      projectId: project.id,
      since: period.since,
      teamId,
      until: period.until,
    })
    const response = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!response.ok) {
      throw new Error(`Vercel returned ${response.status}.`)
    }

    const payload = (await response.json()) as VercelTrafficResponse
    return { name: project.name, series: payload.data, url: project.url }
  })

  try {
    const responses = await Promise.allSettled(requests)
    const unavailableProjects = responses.flatMap((response, index) =>
      response.status === 'rejected' ? [vercelProjects[index].name] : []
    )
    const projects = responses.flatMap((response) => {
      if (response.status === 'rejected') {
        return []
      }

      let pageviews = 0
      let visitors = 0

      for (const point of response.value.series) {
        pageviews += point.pageviews
        visitors += point.visitors
      }

      return [
        {
          name: response.value.name,
          pageviews,
          series: response.value.series,
          url: response.value.url,
          visitors,
        },
      ]
    })

    if (!projects.length) {
      return {
        error: 'Traffic data is temporarily unavailable.',
        projects: [],
        warning: null,
      }
    }

    return {
      error: null,
      projects,
      warning: unavailableProjects.length
        ? `Traffic is unavailable for ${unavailableProjects.join(', ')}.`
        : null,
    }
  } catch {
    return {
      error: 'Traffic data is temporarily unavailable.',
      projects: [],
      warning: null,
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
      packageNames.map(async (packageName) => {
        const response = await fetch(
          `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(packageName)}`
        )
        if (!response.ok) {
          throw new Error(`npm returned ${response.status}.`)
        }

        return (await response.json()) as NpmDownloadsResponse
      })
    )

    return { error: null, packages }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to load npm downloads.',
      packages: [],
    }
  }
}

export const sumReleaseDownloads = (
  releases: readonly GitHubReleaseResponse[]
) =>
  releases.reduce(
    (total, release) =>
      total +
      release.assets.reduce((assetTotal, asset) => {
        return assetTotal + asset.download_count
      }, 0),
    0
  )

const getReleaseDownloads = async () => {
  if (!releaseRepositories.length) {
    return { error: null, repositories: [] }
  }

  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    'User-Agent': 'maferland-analytics-dashboard',
    'X-GitHub-Api-Version': '2026-03-10',
  })
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const repositories = await Promise.all(
      releaseRepositories.map(async (repository) => {
        const response = await fetch(
          `https://api.github.com/repos/maferland/${repository.name}/releases?per_page=100`,
          { headers }
        )
        if (!response.ok) {
          throw new Error(`GitHub returned ${response.status}.`)
        }

        return {
          downloads: sumReleaseDownloads(
            (await response.json()) as GitHubReleaseResponse[]
          ),
          repository: repository.name,
          url: repository.url,
        }
      })
    )

    return { error: null, repositories }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to load release downloads.',
      repositories: [],
    }
  }
}

const loadDashboardData = async (
  period: DashboardData['period']
): Promise<DashboardData> => {
  const [traffic, npm, releases] = await Promise.all([
    getVercelTraffic(period),
    getNpmDownloads(),
    getReleaseDownloads(),
  ])

  return {
    npm,
    period,
    releases,
    traffic,
    updatedAt: new Date().toISOString(),
  }
}

const getCachedDashboardData = unstable_cache(
  loadDashboardData,
  ['analytics-v5'],
  {
    revalidate: 5 * 60,
  }
)

export const getDashboardData = () => getCachedDashboardData(getPeriod())
