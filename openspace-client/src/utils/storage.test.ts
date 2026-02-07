import { describe, it, expect, beforeEach } from 'vitest'
import { storage } from './storage'
import type { StoredProject } from './storage'

describe('storage utility', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      clear: () => {
        store = {}
      },
    }
  })()

  beforeEach(() => {
    // Replace globalThis localStorage with mock
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.clear()
  })

  describe('getProjects', () => {
    it('should return empty array when no data stored', () => {
      const projects = storage.getProjects()
      expect(projects).toEqual([])
    })

    it('should parse and return stored projects', () => {
      const mockProjects: StoredProject[] = [
        { path: '/path/to/project1', name: 'Project 1', color: 'blue' },
        { path: '/path/to/project2', name: 'Project 2', color: 'green' },
      ]
      localStorage.setItem('openspace.projects', JSON.stringify(mockProjects))

      const projects = storage.getProjects()
      expect(projects).toEqual(mockProjects)
    })

    it('should handle corrupt data gracefully', () => {
      localStorage.setItem('openspace.projects', 'invalid json{{{')

      const projects = storage.getProjects()
      expect(projects).toEqual([])
    })

    it('should handle empty string', () => {
      localStorage.setItem('openspace.projects', '')

      const projects = storage.getProjects()
      expect(projects).toEqual([])
    })
  })

  describe('saveProjects', () => {
    it('should stringify and store projects', () => {
      const mockProjects: StoredProject[] = [
        { path: '/path/to/project', name: 'My Project', color: 'red' },
      ]

      storage.saveProjects(mockProjects)

      const stored = localStorage.getItem('openspace.projects')
      expect(stored).toBe(JSON.stringify(mockProjects))
    })

    it('should overwrite existing projects', () => {
      const initialProjects: StoredProject[] = [
        { path: '/old/path', name: 'Old', color: 'blue' },
      ]
      const newProjects: StoredProject[] = [
        { path: '/new/path', name: 'New', color: 'green' },
      ]

      storage.saveProjects(initialProjects)
      storage.saveProjects(newProjects)

      const projects = storage.getProjects()
      expect(projects).toEqual(newProjects)
    })

    it('should handle empty array', () => {
      storage.saveProjects([])

      const projects = storage.getProjects()
      expect(projects).toEqual([])
    })
  })

  describe('getLastProjectPath', () => {
    it('should return stored path', () => {
      localStorage.setItem('openspace.last_project', '/path/to/last/project')

      const path = storage.getLastProjectPath()
      expect(path).toBe('/path/to/last/project')
    })

    it('should return null when no path stored', () => {
      const path = storage.getLastProjectPath()
      expect(path).toBeNull()
    })
  })

  describe('saveLastProjectPath', () => {
    it('should store path', () => {
      storage.saveLastProjectPath('/path/to/project')

      const path = localStorage.getItem('openspace.last_project')
      expect(path).toBe('/path/to/project')
    })

    it('should overwrite existing path', () => {
      storage.saveLastProjectPath('/old/path')
      storage.saveLastProjectPath('/new/path')

      const path = storage.getLastProjectPath()
      expect(path).toBe('/new/path')
    })
  })

  describe('Integration', () => {
    it('should save and retrieve projects with last project path', () => {
      const projects: StoredProject[] = [
        { path: '/project1', name: 'Project 1', color: 'blue' },
        { path: '/project2', name: 'Project 2', color: 'green' },
      ]

      storage.saveProjects(projects)
      storage.saveLastProjectPath('/project1')

      expect(storage.getProjects()).toEqual(projects)
      expect(storage.getLastProjectPath()).toBe('/project1')
    })

    it('should handle multiple operations in sequence', () => {
      // Save initial state
      storage.saveProjects([
        { path: '/p1', name: 'P1', color: 'red' },
      ])
      storage.saveLastProjectPath('/p1')

      // Update projects
      storage.saveProjects([
        { path: '/p1', name: 'P1', color: 'red' },
        { path: '/p2', name: 'P2', color: 'blue' },
      ])
      storage.saveLastProjectPath('/p2')

      // Verify final state
      expect(storage.getProjects()).toHaveLength(2)
      expect(storage.getLastProjectPath()).toBe('/p2')
    })
  })

  describe('session seen map', () => {
    it('should return empty map when no data stored', () => {
      expect(storage.getSessionSeenMap()).toEqual({})
    })

    it('should store and retrieve seen map', () => {
      const map = { 's1': 100, 's2': 200 }
      storage.saveSessionSeenMap(map)
      expect(storage.getSessionSeenMap()).toEqual(map)
    })

    it('should mark a session as seen', () => {
      storage.markSessionSeen('s1', 12345)
      expect(storage.getSessionSeen('s1')).toBe(12345)
    })

    it('should return null for unknown session', () => {
      expect(storage.getSessionSeen('missing')).toBeNull()
    })
  })
})
