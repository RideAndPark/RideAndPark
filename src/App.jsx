import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Ride & Park</h1>
      </header>

      <main className="app-main">
        <section className="map-section">
          <div className="map-placeholder">
            <p>🗺️ Karte wird hier angezeigt</p>
          </div>
        </section>

        <section className="sidebar-section">
          <h2>Details</h2>
          <div className="placeholder-content">
            <p>Platzhalter für Detailinformationen</p>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>© 2026 Ride & Park - Ein Projekt für Parkplatzmanagement</p>
      </footer>
    </div>
  )
}

export default App
