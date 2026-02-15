import React, { useEffect, useRef, useMemo } from 'react'
import Reveal from 'reveal.js'
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/black.css'
import { useArtifact } from '../hooks/useArtifact'
import { usePlayback } from '../hooks/usePlayback'
import { useLinkResolver } from '../hooks/useLinkResolver'
import ReactMarkdown from 'react-markdown'
import { parseSlides } from '../utils/presentation'

// Re-export parseSlides for tests
export { parseSlides }

export interface PresentationFrameProps {
  filePath: string
  onOpenFile?: (path: string) => void
}

const PresentationFrame: React.FC<PresentationFrameProps> = ({ filePath }) => {
  const deckRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revealRef = useRef<any>(null)
  const { resolveLink } = useLinkResolver()

  const {
    data: markdown,
    loading,
    error,
  } = useArtifact<string>(filePath, {
    parse: (content) => content,
    serialize: (content) => content,
  })

  const slides = useMemo(() => (markdown ? parseSlides(markdown) : []), [markdown])
  const playback = usePlayback(slides.length)

  useEffect(() => {
    if (deckRef.current && !revealRef.current && slides.length > 0) {
      // Cast options to any to allow controls property which reveal.js supports
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      revealRef.current = new Reveal(deckRef.current, {
        embedded: true,
        keyboardCondition: 'focused',
        controls: false,
        progress: true,
        hash: false,
        respondToHashChanges: false,
      } as any)
      revealRef.current.initialize()
    }

    return () => {
      // reveal.js 5.x has a destroy method
      if (revealRef.current) {
        try {
          revealRef.current.destroy()
        } catch (e) {
          console.warn('Failed to destroy reveal.js instance', e)
        }
        revealRef.current = null
      }
    }
  }, [slides.length]) // Re-init if slide count changes

  useEffect(() => {
    if (revealRef.current && playback.currentSlide !== revealRef.current.getIndices().h) {
      revealRef.current.slide(playback.currentSlide)
    }
  }, [playback.currentSlide])

  if (loading) {
    return <div className="p-4">Loading presentation...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      <div className="flex-grow relative">
        <div className="reveal" ref={deckRef} style={{ height: '100%', width: '100%' }}>
          <div className="slides">
            {slides.map((slideContent, index) => (
              <section key={`${index}-${slides.length}`}>
                <div className="markdown-body h-full flex flex-col justify-center items-center text-center p-8">
                  <ReactMarkdown
                    components={{
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      a: ({ node, ...props }) => {
                        const href = props.href

                        if (href && (href.startsWith('openspace://') || !href.startsWith('http'))) {
                          return (
                            <a
                              {...props}
                              className="text-blue-400 hover:underline cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                if (href.startsWith('openspace://')) {
                                  resolveLink(href)
                                } else {
                                  // Legacy/Relative path support
                                  window.location.hash = href
                                }
                              }}
                            />
                          )
                        }
                        return (
                          <a
                            {...props}
                            className="text-blue-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        )
                      },
                    }}
                  >
                    {slideContent}
                  </ReactMarkdown>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-900 border-t border-gray-800">
        <div className="text-sm text-gray-400">
          Slide {playback.currentSlide + 1} of {playback.totalSlides}
        </div>
        <button
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
          type="button"
          onClick={playback.previous}
        >
          Previous
        </button>
        <button
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
          type="button"
          onClick={playback.next}
        >
          Next
        </button>
        <button
          className={`px-3 py-1 rounded text-sm transition-colors ${playback.isPlaying ? 'bg-red-900 hover:bg-red-800' : 'bg-blue-900 hover:bg-blue-800'}`}
          type="button"
          onClick={() =>
            playback.isPlaying ? playback.stopPlayback() : playback.startPlayback(3000)
          }
        >
          {playback.isPlaying ? 'Stop' : 'Play'}
        </button>
        <button
          className="ml-auto px-3 py-1 bg-green-900 hover:bg-green-800 rounded text-sm transition-colors"
          type="button"
          onClick={() =>
            window.open(
              `${window.location.origin}${window.location.pathname}?file=${filePath}&print-pdf`,
              '_blank'
            )
          }
        >
          Export PDF
        </button>
      </div>
    </div>
  )
}

export default PresentationFrame
