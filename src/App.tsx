import { ConnectionStatus } from './components/ConnectionStatus'
import { AgentConsole } from './components/AgentConsole'
import './App.css'

function App() {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.5rem 1rem',
        borderBottom: '1px solid #333',
        backgroundColor: '#252526',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '1.2rem', margin: 0 }}>OpenSpace</h1>
        <ConnectionStatus />
      </header>
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '400px', borderRight: '1px solid #333', height: '100%' }}>
          <AgentConsole />
        </div>
        <div style={{ flex: 1, padding: '2rem', backgroundColor: '#1e1e1e', color: 'white' }}>
          <p>Main Canvas - Other modalities will appear here.</p>
        </div>
      </main>
    </div>
  )
}

export default App
