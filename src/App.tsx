import { ConnectionStatus } from './components/ConnectionStatus'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #eee'
      }}>
        <h1>OpenSpace</h1>
        <ConnectionStatus />
      </header>
      <main style={{ padding: '2rem' }}>
        <p>Welcome to OpenSpace MVP. Subsystems are being implemented.</p>
      </main>
    </div>
  )
}

export default App
