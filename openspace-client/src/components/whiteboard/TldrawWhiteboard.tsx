import { useArtifact } from '../../hooks/useArtifact'

interface TldrawWhiteboardProps {
  filePath: string
  sessionId?: string
}

export function TldrawWhiteboard({ filePath }: TldrawWhiteboardProps) {
  const { loading, error, connected } = useArtifact<string>(filePath, {
    enableSSE: false,
  })

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading diagram...</div>
  }

  if (error) {
    return <div className="flex h-full items-center justify-center text-red-500">Error: {error}</div>
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-black/60">
      Tldraw whiteboard is currently disabled in this branch ({connected ? 'connected' : 'offline'})
    </div>
  )
}
