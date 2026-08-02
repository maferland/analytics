import { describe, expect, it } from 'vitest'
import { summarizeTraffic } from './traffic-summary'

describe('summarizeTraffic', () => {
  it('uses the selected window and calculates the preceding window for comparison', () => {
    const series = Array.from({ length: 14 }, (_, index) => ({
      pageviews: index + 1,
      timestamp: `2026-07-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
      visitors: 1,
    }))
    const summary = summarizeTraffic(
      [
        {
          name: 'keyhole',
          pageviews: 105,
          series,
          url: 'https://keyhole.maferland.com',
          visitors: 14,
        },
      ],
      7
    )

    expect(summary.series).toHaveLength(7)
    expect(summary.pageviews).toBe(77)
    expect(summary.visitors).toBe(7)
    expect(summary.previous).toEqual({ pageviews: 28, visitors: 7 })
  })
})
