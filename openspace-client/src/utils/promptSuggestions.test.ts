import { describe, it, expect } from "vitest"
import { getFilteredSuggestions, getSuggestionContext } from "./promptSuggestions"

describe("promptSuggestions utils", () => {
  const fileSuggestions = ["src/index.ts", "src/components/App.tsx", "docs/README.md"]

  describe("getFilteredSuggestions", () => {
    it("should return all suggestions when query is empty", () => {
      const result = getFilteredSuggestions("", fileSuggestions)
      expect(result).toHaveLength(3)
    })

    it("should filter suggestions by substring", () => {
      const result = getFilteredSuggestions("App", fileSuggestions)
      expect(result).toContain("src/components/App.tsx")
      expect(result).not.toContain("src/index.ts")
    })

    it("should handle projectRootName prefixing", () => {
      const result = getFilteredSuggestions("project/src", fileSuggestions, "project")
      expect(result).toContain("src/index.ts")
    })

    it("should rank exact matches higher (implicit in scoring logic)", () => {
      const suggestions = ["app.ts", "apple.ts", "application.ts"]
      const result = getFilteredSuggestions("app", suggestions)
      expect(result[0]).toBe("app.ts")
    })
  })

  describe("getSuggestionContext", () => {
    it("should detect @mention mode", () => {
      const value = "Hello @"
      const context = getSuggestionContext(value, value.length, fileSuggestions)
      expect(context?.mode).toBe("mention")
      expect(context?.query).toBe("")
    })

    it("should detect /open mode", () => {
      const value = "/open src"
      const context = getSuggestionContext(value, value.length, fileSuggestions)
      expect(context?.mode).toBe("open")
      expect(context?.query).toBe("src")
    })

    it("should return null when no trigger is present", () => {
      const value = "Hello world"
      const context = getSuggestionContext(value, value.length, fileSuggestions)
      expect(context).toBeNull()
    })

    it("should calculate correct replaceStart for @mention", () => {
      const value = "Check @index"
      const context = getSuggestionContext(value, value.length, fileSuggestions)
      expect(context?.replaceStart).toBe(6) // index of '@'
    })
    
    it("should calculate correct replaceStart for /open", () => {
      const value = "/open index"
      const context = getSuggestionContext(value, value.length, fileSuggestions)
      expect(context?.replaceStart).toBe(0) // index of '/open'
    })
  })
})
