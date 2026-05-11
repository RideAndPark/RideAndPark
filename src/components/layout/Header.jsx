import { lazy, memo, Suspense, useEffect, useState } from 'react'
import { MAP_THEMES } from '../../utils/constants'

const StatusPieChart = lazy(() => import('./StatusPieChart'))

function HeaderComponent({ statusCounts, mapTheme, onMapThemeChange }) {
  const [loadChart, setLoadChart] = useState(false)
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)

  useEffect(() => {
    const idleCallback = window.requestIdleCallback
      ? window.requestIdleCallback(() => setLoadChart(true), { timeout: 1500 })
      : window.setTimeout(() => setLoadChart(true), 800)

    return () => {
      if (window.cancelIdleCallback && typeof idleCallback === 'number') {
        window.cancelIdleCallback(idleCallback)
      } else {
        window.clearTimeout(idleCallback)
      }
    }
  }, [])

  const handleThemeChange = (themeId) => {
    onMapThemeChange(themeId)
    setShowThemeDropdown(false)
  }

  return (
    <header className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Ride &amp; Park Live</p>
        <h1>Finde verfuegbare Parkplaetze in Echtzeit.</h1>
        <p className="hero-text">
          Alle Plaetze und deren Status werden live auf der Karte angezeigt und automatisch aktualisiert.
        </p>
      </div>

      <div className="status-strip">
        <div className="status-strip-content">
          {loadChart ? (
            <Suspense fallback={<ChartFallback statusCounts={statusCounts} />}>
              <StatusPieChart statusCounts={statusCounts} />
            </Suspense>
          ) : (
            <ChartFallback statusCounts={statusCounts} />
          )}
        </div>

        <div className="theme-switcher">
          <button
            className="theme-switcher-button"
            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            title="Kartenstil aendern"
            aria-label="Kartenstil aendern"
          >
            ⚙
          </button>

          {showThemeDropdown && (
            <div className="theme-dropdown">
              {Object.entries(MAP_THEMES).map(([themeId, theme]) => (
                <button
                  key={themeId}
                  className={`theme-option ${mapTheme === themeId ? 'is-selected' : ''}`}
                  onClick={() => handleThemeChange(themeId)}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function ChartFallback({ statusCounts }) {
  return (
    <div className="chart-fallback">
      <p>Statistik wird geladen...</p>
      <p>Frei: {statusCounts.open}</p>
      <p>Knapp: {statusCounts.limited}</p>
      <p>Voll: {statusCounts.full}</p>
      <p>Unklar: {statusCounts.unknown}</p>
    </div>
  )
}

export const Header = memo(HeaderComponent)
