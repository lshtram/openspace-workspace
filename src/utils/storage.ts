export type StoredProject = {
  path: string
  name: string
  color: string
}

const PROJECTS_KEY = "openspace.projects"
const LAST_PROJECT_KEY = "openspace.last_project"

export const storage = {
  getProjects: (): StoredProject[] => {
    try {
      const data = localStorage.getItem(PROJECTS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },
  saveProjects: (projects: StoredProject[]) => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  },
  getLastProjectPath: (): string | null => {
    return localStorage.getItem(LAST_PROJECT_KEY)
  },
  saveLastProjectPath: (path: string) => {
    localStorage.setItem(LAST_PROJECT_KEY, path)
  }
}
