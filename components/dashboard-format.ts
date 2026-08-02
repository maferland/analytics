export const numberFormatter = new Intl.NumberFormat('en-US')

export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  timeZone: 'UTC',
  timeZoneName: 'short',
  year: 'numeric',
})

export const formatNumber = (value: number) => numberFormatter.format(value)

export const formatDelta = (current: number, previous: number) => {
  if (!previous) {
    return 'New'
  }

  const percentage = Math.round(((current - previous) / previous) * 100)
  return `${percentage > 0 ? '+' : ''}${percentage}%`
}
