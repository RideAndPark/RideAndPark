import { lazy, memo, Suspense, useEffect, useState } from 'react'

const StatusPieChart = lazy(() => import('./StatusPieChart'))

function HeaderComponent({ statusCounts }) {
  const [loadChart, setLoadChart] = useState(false)

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

  return (
    <header className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Ride &amp; Park Live</p>
        <h1>Finde verfügbare Parkplätze in Echtzeit</h1>
        <p className="hero-text">
          Alle Plätze und deren Status werden live auf der Karte angezeigt und automatisch aktualisiert.
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
