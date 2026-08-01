// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DashboardClient } from './DashboardClient'

const dashboardData = {
  npm: { error: null, packages: [] },
  period: { since: '2026-07-01', until: '2026-07-30' },
  traffic: {
    error: null,
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
        visitors: 650,
      },
    ],
  },
  updatedAt: '2026-07-30T12:00:00.000Z',
}

describe('DashboardClient', () => {
  it('recalculates the traffic cards, chart, and table for selected projects', async () => {
    const user = userEvent.setup()
    render(<DashboardClient data={dashboardData} />)

    expect(screen.getByText('2,050')).toBeTruthy()
    expect(screen.getByText('1,550')).toBeTruthy()
    expect(screen.getByRole('cell', { name: 'maferland.com' })).toBeTruthy()
    expect(screen.getByRole('cell', { name: 'pinpoint' })).toBeTruthy()
    const initialChartPoints = screen
      .getByRole('img', { name: 'Daily pageviews over the last 30 days' })
      .querySelector('polyline')
      ?.getAttribute('points')

    await user.click(screen.getByRole('checkbox', { name: 'pinpoint' }))

    expect(
      screen.getByRole('article', { name: 'Selected pageviews' }).textContent,
    ).toContain('1,250')
    expect(
      screen.getByRole('article', { name: 'Selected visitors' }).textContent,
    ).toContain('900')
    expect(screen.getByRole('cell', { name: 'maferland.com' })).toBeTruthy()
    expect(screen.queryByRole('cell', { name: 'pinpoint' })).toBeNull()
    expect(
      screen
        .getByRole('img', { name: 'Daily pageviews over the last 30 days' })
        .querySelector('polyline')
        ?.getAttribute('points'),
    ).not.toBe(initialChartPoints)
  })
})
