import { ConnectionStatus } from './components/ConnectionStatus'
import { AgentConsole } from './components/AgentConsole'
import { Terminal } from './components/Terminal'
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e', color: 'white' }}>
          <div style={{ flex: 1, padding: '1rem', borderBottom: '1px solid #333' }}>
            <p style={{ opacity: 0.5 }}>Main Canvas - Modalities will appear here.</p>
          </div>
          <div style={{ height: '300px' }}>
            <Terminal />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
