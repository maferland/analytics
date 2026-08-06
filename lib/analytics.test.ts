import { describe, expect, it } from 'vitest'
import { sumReleaseDownloads } from './analytics'

describe('sumReleaseDownloads', () => {
  it('adds every published release asset download count', () => {
    expect(
      sumReleaseDownloads([
        { assets: [{ download_count: 4 }, { download_count: 8 }] },
        { assets: [{ download_count: 2 }] },
      ])
    ).toBe(14)
  })
})
