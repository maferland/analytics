// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { DashboardClient } from './DashboardClient'

const dashboardData = {
  github: {
    error: null,
    repos: [
      {
        downloads: 58,
        name: 'maferland/burn',
        url: 'https://github.com/maferland/burn',
      },
    ],
    warning: null,
  },
  npm: {
    error: null,
    packages: [
      {
        downloads: 400,
        end: '2026-07-30',
        package: '@maferland/keyhole',
        start: '2026-07-01',
      },
    ],
  },
  period: { since: '2026-07-01', until: '2026-07-30' },
  traffic: {
    error: null,
    warning: null,
    projects: [
      {
        name: 'maferland.com',
        pageviews: 1250,
        series: [
          {
            pageviews: 500,
            timestamp: '2026-07-01T00:00:00.000Z',
            visitors: 400,
          },
          {
            pageviews: 750,
            timestamp: '2026-07-02T00:00:00.000Z',
            visitors: 500,
          },
        ],
        url: 'https://www.maferland.com',
        visitors: 900,
      },
      {
        name: 'pinpoint',
        pageviews: 800,
        series: [
          {
            pageviews: 300,
            timestamp: '2026-07-01T00:00:00.000Z',
            visitors: 250,
          },
          {
            pageviews: 500,
            timestamp: '2026-07-02T00:00:00.000Z',
            visitors: 400,
          },
        ],
        url: 'https://pinpoint.maferland.com',
        visitors: 650,
      },
    ],
  },
  updatedAt: '2026-07-30T12:00:00.000Z',
}

afterEach(cleanup)

describe('DashboardClient', () => {
  it('recalculates the traffic cards, chart, and table for selected projects', async () => {
    const user = userEvent.setup()
    render(<DashboardClient data={dashboardData} />)

    const projectTable = screen.getByRole('region', {
      name: 'Traffic by app',
    })

    expect(screen.getByText('2,050')).toBeTruthy()
    expect(screen.getByText('1,550')).toBeTruthy()
    expect(
      within(projectTable).getByRole('cell', { name: 'maferland.com' })
    ).toBeTruthy()
    expect(
      within(projectTable).getByRole('cell', { name: 'pinpoint' })
    ).toBeTruthy()

    expect(
      within(within(projectTable).getByRole('cell', { name: 'maferland.com' }))
        .getByRole('link')
        .getAttribute('href')
    ).toBe('https://www.maferland.com')
    expect(
      screen
        .getByRole('link', { name: '@maferland/keyhole' })
        .getAttribute('href')
    ).toBe('https://www.npmjs.com/package/@maferland/keyhole')
    const initialChartPoints = screen
      .getByRole('group', { name: 'Daily pageviews for the selected period' })
      .querySelector('polyline')
      ?.getAttribute('points')

    await user.click(screen.getByRole('checkbox', { name: 'pinpoint' }))

    expect(
      screen.getByRole('article', { name: 'Selected pageviews' }).textContent
    ).toContain('1,250')
    expect(
      screen.getByRole('article', { name: 'Selected visitors' }).textContent
    ).toContain('900')
    expect(
      within(projectTable).getByRole('cell', { name: 'maferland.com' })
    ).toBeTruthy()
    expect(
      within(projectTable).queryByRole('cell', { name: 'pinpoint' })
    ).toBeNull()
    expect(
      screen
        .getByRole('group', { name: 'Daily pageviews for the selected period' })
        .querySelector('polyline')
        ?.getAttribute('points')
    ).not.toBe(initialChartPoints)
    await user.click(screen.getByRole('button', { name: '7 days' }))

    expect(
      screen
        .getByRole('button', { name: '7 days' })
        .getAttribute('aria-pressed')
    ).toBe('true')
  })

  it('shows each selected app for the active chart day', async () => {
    const user = userEvent.setup()
    render(<DashboardClient data={dashboardData} />)

    const dailyBreakdown = screen.getByRole('region', {
      name: 'Daily app breakdown',
    })

    expect(dailyBreakdown.textContent).toContain('Jul 1')
    expect(dailyBreakdown.textContent).toContain('400')
    expect(dailyBreakdown.textContent).toContain('500')
    expect(dailyBreakdown.textContent).toContain('250')
    expect(dailyBreakdown.textContent).toContain('300')

    await user.click(
      screen.getByRole('button', {
        name: 'Jul 2: 1,250 pageviews, 900 visitors',
      })
    )

    expect(dailyBreakdown.textContent).toContain('Jul 2')
    expect(dailyBreakdown.textContent).toContain('750')
    expect(dailyBreakdown.textContent).toContain('400')
  })
})
