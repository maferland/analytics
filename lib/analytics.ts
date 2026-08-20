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

export type RepoDownloads = {
  downloads: number
  name: string
  url: string
}

type GithubRepository = {
  releases: {
    nodes: { releaseAssets: { nodes: { downloadCount: number }[] } }[]
  }
} | null

type GithubReleasesResponse = {
  data?: Record<string, GithubRepository> | null
  errors?: { message: string }[]
}

export type ProjectMetric = {
  name: string
  pageviews: number
  series: TrafficPoint[]
  url: string
  visitors: number
}

export type DashboardData = {
  github: {
    error: string | null
    repos: RepoDownloads[]
    warning: string | null
  }
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
  {
    id: 'prj_LDPAdeK5Pp8z0FyHuQD3oH8qe3tL',
    name: 'burn',
    url: 'https://burn.maferland.com',
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

const getGithubRepos = () =>
  (process.env.ANALYTICS_GITHUB_REPOS ?? '')
    .split(/[\n,]/)
    .map((repo) => repo.trim())
    .filter(Boolean)

const releaseFieldsFragment = `
  releases(first: 100) {
    nodes {
      releaseAssets(first: 20) {
        nodes { downloadCount }
      }
    }
  }
`

// Aliased repository fields batch N repos into one request; a bad repo nulls only its own alias.
const buildGithubReleasesQuery = (repoNames: readonly string[]) => {
  const variableDefs = repoNames
    .map((_, index) => `$owner${index}: String!, $name${index}: String!`)
    .join(', ')
  const fields = repoNames
    .map(
      (_, index) =>
        `repo${index}: repository(owner: $owner${index}, name: $name${index}) { ${releaseFieldsFragment} }`
    )
    .join('\n')

  return `query (${variableDefs}) { ${fields} }`
}

const sumDownloads = (repository: GithubRepository) =>
  (repository?.releases.nodes ?? []).reduce(
    (total, release) =>
      total +
      release.releaseAssets.nodes.reduce(
        (assetTotal, asset) => assetTotal + asset.downloadCount,
        0
      ),
    0
  )

const getGithubDownloads = async () => {
  const repoNames = getGithubRepos()
  if (!repoNames.length) {
    return { error: null, repos: [], warning: null }
  }

  const token = process.env.GITHUB_DOWNLOADS_TOKEN
  if (!token) {
    return {
      error: 'GitHub downloads are not yet connected.',
      repos: [],
      warning: null,
    }
  }

  const variables = repoNames.reduce<Record<string, string>>(
    (acc, repoName, index) => {
      const [owner, name] = repoName.split('/')
      acc[`owner${index}`] = owner
      acc[`name${index}`] = name
      return acc
    },
    {}
  )

  try {
    const response = await fetch('https://api.github.com/graphql', {
      body: JSON.stringify({
        query: buildGithubReleasesQuery(repoNames),
        variables,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}.`)
    }

    const payload = (await response.json()) as GithubReleasesResponse
    if (!payload.data) {
      throw new Error(payload.errors?.[0]?.message ?? 'Unknown response.')
    }

    const unavailableRepos: string[] = []
    const repos = repoNames.flatMap((repoName, index) => {
      const repository = payload.data?.[`repo${index}`] ?? null
      if (!repository) {
        unavailableRepos.push(repoName)
        return []
      }

      return [
        {
          downloads: sumDownloads(repository),
          name: repoName,
          url: `https://github.com/${repoName}`,
        },
      ]
    })

    if (!repos.length) {
      return {
        error: 'GitHub downloads are temporarily unavailable.',
        repos: [],
        warning: null,
      }
    }

    return {
      error: null,
      repos,
      warning: unavailableRepos.length
        ? `Downloads are unavailable for ${unavailableRepos.join(', ')}.`
        : null,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to load GitHub downloads.',
      repos: [],
      warning: null,
    }
  }
}

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

const loadDashboardData = async (
  period: DashboardData['period']
): Promise<DashboardData> => {
  const [traffic, npm, github] = await Promise.all([
    getVercelTraffic(period),
    getNpmDownloads(),
    getGithubDownloads(),
  ])

  return {
    github,
    npm,
    period,
    traffic,
    updatedAt: new Date().toISOString(),
  }
}

const getCachedDashboardData = unstable_cache(
  loadDashboardData,
  ['analytics-v6'],
  {
    revalidate: 5 * 60,
  }
)

export const getDashboardData = () => getCachedDashboardData(getPeriod())
