import type { ProjectMetric } from '@/lib/analytics'
import type { TrafficWindowDays } from '@/lib/traffic-summary'

type DashboardControlsProps = {
  projects: ProjectMetric[]
  selectedProjectNames: string[]
  onSelectedProjectNamesChange: (projectNames: string[]) => void
  onToggleProject: (projectName: string) => void
  windowDays: TrafficWindowDays
  onWindowDaysChange: (days: TrafficWindowDays) => void
  hasPreviousPeriod: boolean
}

export function DashboardControls({
  projects,
  selectedProjectNames,
  onSelectedProjectNamesChange,
  onToggleProject,
  windowDays,
  onWindowDaysChange,
  hasPreviousPeriod,
}: DashboardControlsProps) {
  return (
    <div className="control-deck">
      <section
        className="control-section filter-panel"
        aria-labelledby="filter-title"
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Filter</p>
            <h2 id="filter-title">Projects in view</h2>
          </div>
          <span>
            {selectedProjectNames.length} of {projects.length}
          </span>
        </div>
        {projects.length ? (
          <fieldset className="project-filter">
            <legend className="sr-only">Select Vercel projects</legend>
            <div className="filter-actions">
              <button
                onClick={() =>
                  onSelectedProjectNamesChange(
                    projects.map((project) => project.name)
                  )
                }
                type="button"
              >
                All projects
              </button>
              <button
                onClick={() => onSelectedProjectNamesChange([])}
                type="button"
              >
                Clear
              </button>
            </div>
            <div className="filter-options">
              {projects.map((project) => (
                <label className="filter-option" key={project.name}>
                  <input
                    checked={selectedProjectNames.includes(project.name)}
                    onChange={() => onToggleProject(project.name)}
                    type="checkbox"
                  />
                  <span>{project.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="empty-copy">Filters appear once traffic connects.</p>
        )}
      </section>

      <section
        className="control-section range-panel"
        aria-labelledby="range-title"
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Window</p>
            <h2 id="range-title">Traffic period</h2>
          </div>
          <span>{windowDays} days</span>
        </div>
        <div
          aria-label="Select traffic period"
          className="range-controls"
          role="group"
        >
          {([7, 14, 30] as const).map((days) => (
            <button
              aria-pressed={windowDays === days}
              className={windowDays === days ? 'selected' : undefined}
              key={days}
              onClick={() => onWindowDaysChange(days)}
              type="button"
            >
              {days} days
            </button>
          ))}
        </div>
        <p className="range-note">
          {hasPreviousPeriod
            ? `Changes compare this window with the preceding ${windowDays} days.`
            : 'A matching prior period is not available for this window.'}
        </p>
      </section>
    </div>
  )
}
