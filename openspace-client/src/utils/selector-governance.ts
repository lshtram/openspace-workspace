import type { Agent } from "../lib/opencode/v2/gen/types.gen"
import type { ModelOption } from "../types/opencode"

const MODEL_VISIBILITY_KEY = "openspace.model_visibility"
const INTERNAL_AGENT_NAMES = new Set(["compaction", "summary", "title"])

type ModelVisibilityMap = Record<string, boolean>

function readModelVisibilityMap(): ModelVisibilityMap {
  try {
    const raw = window.localStorage.getItem(MODEL_VISIBILITY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const normalized: ModelVisibilityMap = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") {
        normalized[key] = value
      }
    }
    return normalized
  } catch {
    return {}
  }
}

function writeModelVisibilityMap(map: ModelVisibilityMap) {
  window.localStorage.setItem(MODEL_VISIBILITY_KEY, JSON.stringify(map))
}

export function isTopLevelAgent(agent: Agent): boolean {
  const normalizedName = agent.name.toLowerCase()
  if (agent.hidden) return false
  if (agent.mode === "subagent") return false
  if (INTERNAL_AGENT_NAMES.has(normalizedName)) return false
  return true
}

export function filterTopLevelAgents(agents: Agent[]): Agent[] {
  return agents.filter(isTopLevelAgent)
}

export function getModelEnabledState(modelId: string): boolean {
  const visibility = readModelVisibilityMap()
  return visibility[modelId] ?? true
}

export function setModelEnabledState(modelId: string, enabled: boolean) {
  const visibility = readModelVisibilityMap()
  visibility[modelId] = enabled
  writeModelVisibilityMap(visibility)
}

export function applyModelVisibility(models: ModelOption[]): ModelOption[] {
  return models.map((model) => ({
    ...model,
    enabled: getModelEnabledState(model.id),
  }))
}

export function filterEnabledModels(models: ModelOption[]): ModelOption[] {
  return models.filter((model) => model.enabled !== false)
}
