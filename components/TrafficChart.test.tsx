// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TrafficChart } from './TrafficChart'

const series = [
  {
    pageviews: 10,
    timestamp: '2026-07-01T00:00:00.000Z',
    visitors: 5,
  },
  {
    pageviews: 20,
    timestamp: '2026-07-02T00:00:00.000Z',
    visitors: 10,
  },
  {
    pageviews: 30,
    timestamp: '2026-07-03T00:00:00.000Z',
    visitors: 15,
  },
]

describe('TrafficChart', () => {
  it('updates the inspector for the nearest point across the chart area', async () => {
    const user = userEvent.setup()
    render(<TrafficChart series={series} />)

    const chart = screen.getByRole('group', {
      name: 'Daily pageviews for the selected period',
    })
    Object.defineProperty(chart, 'getBoundingClientRect', {
      value: () => ({ left: 100, width: 300 }),
    })

    await user.pointer([
      { target: chart, coords: { clientX: 390, clientY: 50 } },
    ])

    expect(screen.getByText('30 pageviews')).toBeTruthy()
    expect(screen.getByText('15 visitors')).toBeTruthy()
  })
})
