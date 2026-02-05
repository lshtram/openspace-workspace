import React, { useEffect, useRef } from 'react'
import { XtermAdapter } from '../adapters/XtermAdapter'

export const Terminal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<XtermAdapter | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const adapter = new XtermAdapter()
    adapterRef.current = adapter
    adapter.initialize(containerRef.current)

    return () => {
      adapter.dispose()
      adapterRef.current = null
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#1e1e1e',
        padding: '4px'
      }} 
    />
  )
}
