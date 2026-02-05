import React from 'react'
import { useOpenCodeConnection } from '../hooks/useOpenCodeConnection'

export const ConnectionStatus: React.FC = () => {
  const { isConnected, isChecking } = useOpenCodeConnection()

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '4px',
        backgroundColor: isConnected ? '#e6fffa' : '#fff5f5',
        color: isConnected ? '#2c7a7b' : '#c53030',
        fontSize: '14px',
        fontWeight: 'bold',
        border: `1px solid ${isConnected ? '#b2f5ea' : '#feb2b2'}`,
      }}
    >
      <div 
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#38a169' : '#e53e3e',
          marginRight: '8px',
        }}
      />
      {isChecking ? 'Checking connection...' : isConnected ? 'OpenCode Connected' : 'OpenCode Disconnected'}
    </div>
  )
}
