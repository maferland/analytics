'use client'

import { useState } from 'react'
import type { TrafficPoint } from '@/lib/analytics'
import { dateFormatter, formatNumber } from './dashboard-format'

type TrafficChartProps = {
  series: TrafficPoint[]
}

const getNextPointIndex = (
  key: string,
  currentIndex: number,
  pointCount: number
) => {
  if (key === 'ArrowLeft') {
    return Math.max(currentIndex - 1, 0)
  }

  if (key === 'ArrowRight') {
    return Math.min(currentIndex + 1, pointCount - 1)
  }

  if (key === 'Home') {
    return 0
  }

  if (key === 'End') {
    return pointCount - 1
  }

  return null
}

const focusChartPoint = (svg: SVGSVGElement, index: number) => {
  svg.querySelectorAll<SVGCircleElement>('[role="button"]').item(index)?.focus()
}

export function TrafficChart({ series }: TrafficChartProps) {
  const [activePointIndex, setActivePointIndex] = useState(0)

  if (!series.length) {
    return <p className="empty-copy">Select a project to plot its traffic.</p>
  }

  const maximum = Math.max(...series.map((point) => point.pageviews), 1)
  const width = 720
  const height = 180
  const chartPoints = series.map((point, index) => ({
    point,
    x: (index / Math.max(series.length - 1, 1)) * width,
    y: height - (point.pageviews / maximum) * (height - 28) - 14,
  }))
  const activeIndex = Math.min(activePointIndex, chartPoints.length - 1)
  const activePoint = chartPoints[activeIndex]

  return (
    <div className="chart-wrap">
      <div className="chart-summary">
        <div aria-live="polite" className="chart-inspector">
          <span>
            {dateFormatter.format(new Date(activePoint.point.timestamp))}
          </span>
          <strong>{formatNumber(activePoint.point.pageviews)} pageviews</strong>
          <span>{formatNumber(activePoint.point.visitors)} visitors</span>
        </div>
        <span className="chart-peak">Peak · {formatNumber(maximum)} views</span>
      </div>
      <svg
        aria-label="Daily pageviews for the selected period"
        className="chart"
        role="group"
        viewBox={`0 0 ${width} ${height}`}
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - ratio * (height - 28) - 14
          return (
            <line
              className="chart-guide"
              key={ratio}
              x1="0"
              x2={width}
              y1={y}
              y2={y}
            />
          )
        })}
        <polyline
          className="chart-line"
          points={chartPoints.map(({ x, y }) => `${x},${y}`).join(' ')}
        />
        {chartPoints.map(({ point, x, y }, index) => (
          <circle
            aria-label={`${dateFormatter.format(new Date(point.timestamp))}: ${formatNumber(point.pageviews)} pageviews, ${formatNumber(point.visitors)} visitors`}
            className={
              index === activeIndex ? 'chart-point active' : 'chart-point'
            }
            cx={x}
            cy={y}
            key={point.timestamp}
            onClick={() => setActivePointIndex(index)}
            onFocus={() => setActivePointIndex(index)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setActivePointIndex(index)
                return
              }

              const nextIndex = getNextPointIndex(
                event.key,
                index,
                chartPoints.length
              )
              if (nextIndex === null) {
                return
              }

              event.preventDefault()
              setActivePointIndex(nextIndex)
              const chart = event.currentTarget.ownerSVGElement
              if (chart) {
                focusChartPoint(chart, nextIndex)
              }
            }}
            onPointerEnter={() => setActivePointIndex(index)}
            r="7"
            role="button"
            tabIndex={0}
          />
        ))}
      </svg>
      <div className="chart-axis" aria-hidden="true">
        <span>{dateFormatter.format(new Date(series[0].timestamp))}</span>
        <span>{dateFormatter.format(new Date(series.at(-1)!.timestamp))}</span>
      </div>
    </div>
  )
}
