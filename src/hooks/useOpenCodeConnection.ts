import { useState, useEffect } from 'react'
import { openCodeService } from '../services/OpenCodeClient'

export function useOpenCodeConnection() {
  const [isConnected, setIsConnected] = useState(openCodeService.isConnected)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      setIsChecking(true)
      const connected = await openCodeService.checkConnection()
      setIsConnected(connected)
      setIsChecking(false)
    }

    check()
    
    // Optional: set up an interval to check connection
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  return { isConnected, isChecking }
}
