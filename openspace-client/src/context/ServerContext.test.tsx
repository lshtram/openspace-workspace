import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ServerProvider, useServer } from './ServerContext'

function Harness({ removeUrl }: { removeUrl: string }) {
  const { activeUrl, defaultUrl, servers, removeServer } = useServer()

  return (
    <div>
      <div data-testid="active">{activeUrl}</div>
      <div data-testid="default">{defaultUrl ?? ''}</div>
      <div data-testid="servers">{servers.join(',')}</div>
      <button type="button" data-testid="remove" onClick={() => removeServer(removeUrl)}>
        remove
      </button>
    </div>
  )
}

describe('ServerContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes active server and falls back to default', () => {
    localStorage.setItem('openspace.servers', JSON.stringify(['http://a', 'http://b']))
    localStorage.setItem('openspace.default_server', 'http://b')
    localStorage.setItem('openspace.active_server', 'http://a')

    render(
      <ServerProvider>
        <Harness removeUrl="http://a" />
      </ServerProvider>,
    )

    expect(screen.getByTestId('active')).toHaveTextContent('http://a')

    fireEvent.click(screen.getByTestId('remove'))

    expect(screen.getByTestId('active')).toHaveTextContent('http://b')
    expect(screen.getByTestId('default')).toHaveTextContent('http://b')
    expect(screen.getByTestId('servers')).toHaveTextContent('http://b')
  })

  it('removes active server and falls back to next server when no default', () => {
    localStorage.setItem('openspace.servers', JSON.stringify(['http://a', 'http://b']))
    localStorage.removeItem('openspace.default_server')
    localStorage.setItem('openspace.active_server', 'http://a')

    render(
      <ServerProvider>
        <Harness removeUrl="http://a" />
      </ServerProvider>,
    )

    fireEvent.click(screen.getByTestId('remove'))

    expect(screen.getByTestId('active')).toHaveTextContent('http://b')
    expect(screen.getByTestId('servers')).toHaveTextContent('http://b')
  })
})
