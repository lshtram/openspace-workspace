# Plan-002 Archived Learnings & Decisions

**Status**: BLOCKED - Archived for reference  
**Date Archived**: 2026-02-05  
**Plan**: plan-002-create-documentation-command

---

## LEARNINGS

# OpenCode Slash Command / Skill Definition Documentation Research

**Date**: 2026-02-04
**Task**: Research official documentation or examples for OpenCode slash command / skill definitions

---

## Key Findings

### 1. Skill Definition Format

Skills are defined using **YAML frontmatter** followed by **markdown content**:

```yaml
---
name: skill-name
description: Brief description of when to invoke this skill
---

# SKILL TITLE

> **Identity**: [Role description]
> **Goal**: [Primary objective]

## Usage

[Detailed instructions]
```

**Evidence**:
- `/Users/Shared/dev/openspace/.opencode/skills/document-session/SKILL.md`
- `/Users/Shared/dev/openspace/.agent/skills/research-mastery/SKILL.md`
- `/Users/Shared/dev/openspace/.agent/skills/playwright/SKILL.md`

### 2. Skill Directory Structure

Skills are organized in directories under:
- `.opencode/skills/` (OpenCode-specific skills)
- `.agent/skills/` (Project-level skills)

**Structure**:
```
skill-name/
├── SKILL.md (required - main definition)
├── [reference]/ (optional - detailed documentation)
├── scripts/ (optional - Node.js utilities)
└── templates/ (optional - reusable templates)
```

**Evidence**: 
- `/Users/Shared/dev/openspace/.opencode/skills/document-session/`
- `/Users/Shared/dev/openspace/.agent/skills/` contains multiple skill directories

### 3. Naming Conventions

- **Skills**: Use **gerund form** (verb + -ing)
  - Examples: `document-session`, `research-mastery`, `handoff`
- **Supporting Files**: Use **intention-revealing names**
  - Examples: `reference/aws-deployment-patterns.md`

**Evidence**: 
- `/Users/Shared/dev/dream-news/.agent/skills/skill-builder/SKILL.md` documents naming conventions

### 4. Plugin System

OpenCode uses a plugin system based on `@opencode-ai/plugin` package:

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const VoiceAssistant: Plugin = async ({ client }) => {
  console.log("Voice Assistant plugin loaded")
  
  return {
    // hooks will be added in Task 2
  }
}
```

**Evidence**: `/Users/Shared/dev/.opencode/plugin/voice-assistant.ts`
**Package Version**: `@opencode-ai/plugin@1.1.48`

### 5. Official Documentation References

The `skill-builder` skill references official docs:

- **Agent Skills Overview**: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md
- **Best Practices**: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices.md

**Evidence**: `/Users/Shared/dev/dream-news/.agent/skills/skill-builder/SKILL.md`

### 6. Content Guidelines

Based on existing skill examples:

- Keep `SKILL.md` **under 500 lines**
- Use **progressive disclosure** - move detailed guidance to `./reference/` files
- Include **context & constraints** section
- Document **algorithm/steps** clearly
- Provide **output format templates**

**Evidence**: Multiple skills follow this pattern (handoff, research-mastery, playwright)

### 7. Slash Command Integration

Based on available slash commands in the system:

**Builtin Commands** (Scope: builtin):
- `/playwright`: Browser automation via Playwright MCP
- `/frontend-ui-ux`: Designer-turned-developer UI/UX
- `/git-master`: Git operations
- `/dev-browser`: Browser automation
- `/sequential-thinking`: Structured reasoning

**Skills** (loaded from .opencode or .agent):
- `/document`: Generate end-to-end session documentation

**Evidence**: Slashcommand tool outputs show these commands with their `scope` attribute

### 8. Skill Best Practices

From skill-builder documentation:

1. **Trigger Description**: Focus on **WHEN** to invoke, not WHAT it does
2. **Supporting Files**: Use for detailed patterns, workflows, templates
3. **Node.js Scripts**: Use for complex logic in `./scripts/`
4. **Intent-Revealing Names**: Make file names self-documenting

**Evidence**: `/Users/Shared/dev/dream-news/.agent/skills/skill-builder/SKILL.md`

---

## Implementation Recommendations for /document Command

1. **Location**: Create in `.opencode/skills/document-session/` (already exists as example)
2. **Format**: Follow YAML frontmatter + markdown convention
3. **Name**: `document-session` (matches existing pattern)
4. **Description**: Should be concise and trigger-focused

### Example Frontmatter Format

```yaml
---
name: document-session
description: Generate end-to-end session documentation. Usage: /document [topic]
---
```

---

## Notes

- No separate "slash command" registration file found - skills appear to be auto-discovered from `.opencode/skills/` and `.agent/skills/` directories
- The `name` field in frontmatter is used as the command identifier (e.g., `name: document-session` → `/document`)
- Description field shows up in command listing and helps users understand when to invoke
- Scope can be `builtin` (for core commands) or omitted (for custom skills)

---

## References

- Example Skill: `/Users/Shared/dev/openspace/.opencode/skills/document-session/SKILL.md`
- Skill Builder: `/Users/Shared/dev/dream-news/.agent/skills/skill-builder/SKILL.md`
- Plugin Example: `/Users/Shared/dev/.opencode/plugin/voice-assistant.ts`
- Official Docs: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/

## Task Completion: Creating opencode.json for /document Command

**Date**: 2026-02-05

### Implementation Summary

Successfully created `/Users/Shared/dev/openspace/opencode.json` with the following structure:

**File Contents**:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "document": {
      "description": "Generate end-to-end session documentation. Usage: /document [topic]",
      "agent": "build",
      "template": "[5-phase workflow template]"
    }
  }
}
```

### Key Design Decisions

1. **Command Registration via opencode.json**
   - NOT via skill auto-discovery (YAML frontmatter + markdown)
   - Used explicit JSON configuration at repo root
   - Pattern follows `/Users/Shared/dev/fermata/opencode.json` structure

2. **Template Workflow**
   - Instructs to load `document-session` skill
   - References `.agent/workflows/document.md` for full workflow
   - Supports `$ARGUMENTS` for topic override
   - Explicitly documents idempotency guarantees (merge, not replace)

3. **Agent Assignment**
   - Used `"agent": "build"` (consistent with other commands in fermata pattern)
   - Enables access to build-phase capabilities

### Verification Checklist

✓ opencode.json created at repo root: `/Users/Shared/dev/openspace/opencode.json`
✓ Valid JSON (passes jq validation)
✓ Contains `$schema`: https://opencode.ai/config.json
✓ Contains `command.document` with all required fields:
  - description: specifies usage `/document [topic]`
  - agent: set to "build"
  - template: 5-phase workflow with skill loading, document.md reference, $ARGUMENTS support, idempotency docs
✓ No other files modified
✓ Findings recorded in this notepad

### Distinction: opencode.json vs. SKILL.md

- **opencode.json**: Registers slash commands (`/command-name`) that trigger workflows
- **SKILL.md**: Defines reusable skills (YAML frontmatter + markdown) referenced by commands
- **Usage**: `/document` invokes command from opencode.json → loads document-session skill → executes .agent/workflows/document.md

## Plan-002 Template Updates (2026-02-05)

**Date**: 2026-02-05

### Changes Made to opencode.json

Updated opencode.json template to align with plan-002 naming conventions:

1. **Naming Convention Updates**:
   - Changed `REQ-[MODULE]` → `REQ-[PREFIX]` throughout
   - Updated Phase 5 step 12: "module prefix" → "prefix"
   - Updated Phase 5 step 14: `REQ-[PREFIX]-001-through-NNN.md` (replaces old sequential numbering)

2. **Idempotency Documentation**:
   - Added explicit step 16 in Phase 5: "Update existing session files in place (idempotent)"
   - Aligns with existing Idempotency section in template

3. **Step Renumbering**:
   - Phase 6: steps 16-18 (was 16-18, now clearly numbered)
   - Phase 7: steps 19-21 (was 19-21, renumbered accordingly)

4. **Output Files Section**:
   - Updated example files to use `REQ-[PREFIX]` pattern
   - Maintains parallel naming in both "Output Files (ONLY)" and main workflow

5. **No Trailing Ellipsis**:
   - Confirmed template ends cleanly with final Idempotency section
   - Removed any trailing `...` that was previously present

### Verification
✓ All changes applied to template field in opencode.json
✓ No structural changes to JSON or other properties
✓ File remains valid JSON
✓ Ready for plan-002 implementation

## Step 5: Testing /document Command Execution

**Date**: 2026-02-05
**Status**: BLOCKER IDENTIFIED

### Test Results

**Invocation**: slashcommand(command='document')
**Expected**: Load workflow from opencode.json and execute 6-phase pipeline
**Actual**: "Command or skill '/document' not found"

### Critical Discovery: opencode.json is NOT for slash command registration

**Evidence**:
1. /Users/Shared/dev/fermata/opencode.json defines 9 commands
2. NONE of those commands are recognized by slashcommand tool
3. slashcommand tool ONLY shows 12 builtin commands
4. Working directory changes do NOT enable project commands

**Conclusion**: opencode.json is NOT functional for chat-based slash command invocation.

### Root Cause: Architecture Misunderstanding

Steps 1-4 created infrastructure that cannot be invoked via slashcommand tool.
opencode.json is not the registration mechanism for slash commands.

### Verified Facts

✓ opencode.json exists and is valid JSON
✓ SKILL.md exists with YAML frontmatter
✓ Workflow file exists with 6-phase structure
✗ /document command is NOT available for invocation
✗ Project-level commands in opencode.json are NOT loaded

---

## Step 5 Investigation: Slash Command Discovery Mechanism

**Date**: 2026-02-05
**Status**: DISCOVERY COMPLETE

### Investigation Summary

Successfully identified how slash commands are registered and discovered in OpenCode.

### Key Discovery: Command Discovery via REST API

**Evidence from SDK Analysis**:

1. **Command List Endpoint**: OpenCode SDK exposes a `Command` class with a `list()` method:
   ```javascript
   // File: /Users/Shared/dev/.opencode/node_modules/@opencode-ai/sdk/dist/gen/sdk.gen.js
   class Command extends _HeyApiClient {
       /**
        * List all commands
        */
       list(options) {
           return (options?.client ?? this._client).get({
               url: "/command",
               ...options,
           });
       }
   }
   ```

2. **Commands are discovered server-side**: The `/command` endpoint returns all registered commands, indicating commands are managed by the OpenCode server, not loaded from local files at runtime.

### Two Different Command/ Skill Mechanisms Identified

**1. Slash Commands (opencode.json)**:
- **Purpose**: Register chat-based slash commands (`/command`)
- **Format**: JSON configuration at repo root
- **Schema**: `https://opencode.ai/config.json`
- **Structure**:
  ```json
  {
    "$schema": "https://opencode.ai/config.json",
    "command": {
      "command-name": {
        "description": "...",
        "agent": "build",
        "template": "..."
      }
    }
  }
  ```
- **Location**: Repo root or global config
- **Discovery**: Server loads and serves via `/command` endpoint

**2. Agent Skills (SKILL.md)**:
- **Purpose**: Define reusable agent behaviors
- **Format**: YAML frontmatter + markdown
- **Locations**:
  - Project: `.opencode/skills/<name>/SKILL.md`
  - Global: `~/.config/opencode/skills/<name>/SKILL.md`
  - Claude-compatible: `.claude/skills/<name>/SKILL.md`
  - Agent-compatible: `.agents/skills/<name>/SKILL.md`
- **Frontmatter Format**:
  ```yaml
  ---
  name: skill-name
  description: Brief description
  ---
  ```
- **Discovery**: Auto-discovered by walking directory structure

### Why opencode.json Commands Are Not Loading

**Root Cause Identified**:

1. **Configuration vs. Runtime**: The `opencode.json` defines commands, but they must be:
   - Registered with the OpenCode server
   - The server serves them via `/command` endpoint
   - The slashcommand tool queries this endpoint for available commands

2. **Server-Side Command Registry**: Commands are not loaded locally by the slashcommand tool. They must be registered with the OpenCode server process.

3. **Missing Server Registration**: The slashcommand tool reports "Command or skill '/document' not found" because:
   - The OpenCode server doesn't know about the `document` command
   - opencode.json may need to be in a location the server monitors
   - Or there may be a registration step required

### Evidence Files

**SDK Implementation**:
- `/Users/Shared/dev/.opencode/node_modules/@opencode-ai/sdk/dist/gen/sdk.gen.js` (lines 441-451)
- `/Users/Shared/dev/.opencode/node_modules/@opencode-ai/sdk/dist/gen/client/client.gen.js`
- `/Users/Shared/dev/.opencode/node_modules/@opencode-ai/plugin/dist/index.d.ts`

**Command Definition Files**:
- `/Users/Shared/dev/openspace/opencode.json` - Created command definition
- `/Users/Shared/dev/openspace/.opencode/skills/document-session/SKILL.md` - Skill definition
- `/Users/Shared/dev/fermata/opencode.json` - Reference pattern (9 commands, none load)

**Documentation References**:
- OpenCode Skills Plugin: https://github.com/zenobi-us/opencode-skillful
- Official Skills Docs: https://opencode.ai/docs/skills/
- Extending OpenCode: https://deepwiki.com/tencent-source/opencode/8.1-extending-opencode

### Verification Tests Conducted

1. **SDK Analysis**: Confirmed Command.list() exists and hits `/command`
2. **File Existence**: opencode.json is valid and at repo root
3. **Tool Output**: slashcommand tool only shows builtin commands (scope: builtin)
4. **Project Commands**: None of fermata's 9 commands load either

### Implication for Plan-002

**The infrastructure created (opencode.json, SKILL.md, workflow) is structurally correct but requires**:

1. **Server Registration**: Commands must be registered with OpenCode server
2. **Configuration Path**: May need to be in global config, not project root
3. **Build Step**: May require `opencode` CLI to register commands
4. **Alternative**: Use SKILL.md-based approach which auto-discovers

### Recommendation

**Switch to SKILL.md-based approach**:
- Skills auto-discover from directory structure
- No server registration required
- Consistent with how builtin skills work
- Can be loaded via `skill({ name: "document-session" })` tool

---

## ISSUES

## Issue: slashcommand tool does NOT load opencode.json commands

**Date**: 2026-02-05
**Severity**: BLOCKER
**Status**: ROOT CAUSE IDENTIFIED

### Problem Statement

The `/document` command defined in `/Users/Shared/dev/openspace/opencode.json` is NOT recognized by the `slashcommand` tool, despite the file being:
- Valid JSON
- Containing proper command structure (description, agent, template)
- Located at repo root
- Following the pattern from `/Users/Shared/dev/fermata/opencode.json`

### Reproduction Steps

1. Created `opencode.json` at `/Users/Shared/dev/openspace/opencode.json`
2. Defined `command.document` with all required fields
3. Invoked `slashcommand(command='document')`
4. **Result**: "Command or skill '/document' not found"

### Evidence

**Test 1**: Attempted `/document` from `/Users/Shared/dev` working directory
- **Result**: NOT FOUND

**Test 2**: Attempted `/document` from `/Users/Shared/dev/openspace` working directory (via workdir parameter)
- **Result**: NOT FOUND

**Test 3**: Tested `/new-feature` from `/Users/Shared/dev/fermata` (which has 9 commands defined in opencode.json)
- **Result**: NOT FOUND (same behavior)

**Test 4**: Listed all available commands via slashcommand tool
- **Result**: ONLY builtin commands shown (12 total)
  - `/init-deep`, `/ralph-loop`, `/ulw-loop`, `/cancel-ralph`, `/refactor`, `/start-work`, `/stop-continuation`
  - `/playwright`, `/frontend-ui-ux`, `/git-master`, `/dev-browser`, `/sequential-thinking`
- **NONE of the 9 fermata commands** (`/new-feature`, `/start-task`, `/ship`, `/verify`, etc.) are recognized
- **NONE of the openspace commands** (`/document`) are recognized

### Root Cause

**The `slashcommand` tool does NOT load commands from project-level `opencode.json` files.**

It ONLY loads:
1. **Builtin commands** (system-level, scope: "builtin")
2. **Skills from `.opencode/skills/` or `.agent/skills/` directories** (with SKILL.md files)

### Impact

- Steps 1-4 of plan-002 created infrastructure that **cannot be invoked via slashcommand tool**
- The `/document` command workflow is complete but inaccessible
- The `opencode.json` pattern observed in fermata is **non-functional** for slash command invocation

### Hypothesis: Alternative Invocation Mechanisms

Possible alternatives (not yet tested):
1. **opencode.json may be for IDE integration** (e.g., VSCode OpenCode extension) rather than chat-based agents
2. **Skills must be registered via SKILL.md** in `.opencode/skills/document-session/` directory
3. **Skills are auto-discovered from directory structure**, not from opencode.json command definitions
4. **opencode.json may require a build step** (e.g., `bun run build` to register commands) - blocked by Bun not installed

### Next Steps Required

1. **Test SKILL.md-based registration**: Move command definition from opencode.json to SKILL.md frontmatter
2. **Test skill auto-discovery**: Verify if `.opencode/skills/document-session/SKILL.md` is recognized without opencode.json
3. **Research OpenCode documentation**: Find official docs on slash command registration
4. **Check if Bun installation unblocks**: May need build step to register commands

### Related Files

- `/Users/Shared/dev/openspace/opencode.json` - Created in Step 1
- `/Users/Shared/dev/openspace/.opencode/skills/document-session/SKILL.md` - Created in Step 1
- `/Users/Shared/dev/openspace/.agent/workflows/document.md` - Created in Step 2
- `/Users/Shared/dev/fermata/opencode.json` - Reference pattern (also non-functional)

### Learnings

- **opencode.json is NOT for slash command registration in chat agents**
- **slashcommand tool only loads builtin + skill directory structures**
- **Step 5 test reveals fundamental architecture misunderstanding in Steps 1-4**

---

## Resolution: Slash Command Discovery Mechanism Identified

**Date**: 2026-02-05
**Status**: ROOT CAUSE CONFIRMED - SOLUTION PATH CLEAR

### Original Blocker

**Step 5**: Testing `/document` command execution
- **Symptom**: "Command or skill '/document' not found"
- **Impact**: Plan-002 infrastructure inaccessible via slashcommand tool

### Root Cause Analysis Complete

**Confirmed**: opencode.json commands require server-side registration
**Evidence**: SDK exposes Command.list() at `/command` endpoint

### Solution Paths Identified

**Path 1: Server Registration (Recommended for Commands)**
- Commands in opencode.json must be registered with OpenCode server
- Server serves them via `/command` REST endpoint
- May require: `opencode` CLI registration or global config placement

**Path 2: SKILL.md Auto-Discovery (Recommended for Skills)**
- Skills auto-discover from `.opencode/skills/` directories
- No server registration needed
- Can be loaded via `skill({ name: "document-session" })` tool
- This is how builtin skills work

### Recommended Approach for Plan-002

**Switch to SKILL.md-based command invocation**:

1. **Keep existing SKILL.md**: `/Users/Shared/dev/openspace/.opencode/skills/document-session/SKILL.md`
   - Already has proper YAML frontmatter with name and description
   - Already has complete skill definition

2. **Document alternative invocation**:
   - Use `skill({ name: "document-session" })` instead of `/document`
   - Document this in workflow instructions

3. **Update documentation**:
   - Note that `/document` requires server configuration
   - Provide skill-based workaround for immediate use

### Blocking Issue Status

**RESOLVED** - Discovery mechanism identified
- No code changes required
- Documentation update needed
- Alternative invocation path available

### Files Affected

**No changes required to existing files**:
- `/Users/Shared/dev/openspace/opencode.json` - Valid command definition (server-side)
- `/Users/Shared/dev/openspace/.opencode/skills/document-session/SKILL.md` - Valid skill definition
- `/Users/Shared/dev/openspace/.agent/workflows/document.md` - Valid workflow

**Documentation updates only**:
- Update plan-002 to note slash command registration requirements
- Provide skill-based invocation instructions
- Document server configuration requirements

### Next Actions

1. Update plan-002 documentation to reflect discovery mechanism
2. Provide skill-based invocation instructions for immediate use
3. Document server configuration for slash command registration
4. Test skill-based approach: `skill({ name: "document-session" })`


---

## Step 5: Test Execution Results (2026-02-05)

**Task**: Test `/document` command functionality
**Date**: 2026-02-05  
**Status**: BLOCKER CONFIRMED - COMMAND NOT INVOCABLE

### Test Execution

#### Test 1: Slash Command Invocation
```
slashcommand(command='document', user_message='test topic')
```

**Result**: 
```
Command or skill "/document" not found
```

**Analysis**: 
- opencode.json commands require server-side registration
- Not available in chat agent execution context
- Only builtin commands + globally-registered skills shown

#### Test 2: Skill-Based Invocation
```
skill(name='document-session')
```

**Result**:
```
Error: Skill "document-session" not found
```

**Analysis**:
- Project-level `.opencode/skills/document-session/SKILL.md` exists and is well-formed
- Auto-discovery DOES NOT work for project-level skills
- Only globally-installed skills are discoverable

#### Test 3: File Verification
- ✓ `/Users/Shared/dev/openspace/opencode.json` exists (well-formed JSON)
- ✓ `/Users/Shared/dev/openspace/.opencode/skills/document-session/SKILL.md` exists (valid YAML + markdown)
- ✓ `/Users/Shared/dev/openspace/.agent/workflows/document.md` exists (complete workflow)

### Conclusion

**Plan-002 artifact status**: INFRASTRUCTURE COMPLETE BUT INACCESSIBLE

Files created in Steps 1-4:
- ✓ opencode.json (valid, but requires server registration)
- ✓ SKILL.md (valid, but not auto-discovered)
- ✓ Workflow definition (complete, but unreachable)

**Issue**: The `/document` command **cannot be invoked** from chat agent context without:
1. Server-side registration via OpenCode SDK
2. Bun build pipeline (blocked - Bun not installed)
3. Global skill registration (not currently set up)

### Recommended Resolution Path

**Option A**: Provide direct workflow invocation instructions
- Document manual workflow execution steps
- Users can invoke workflow via documented agent prompts

**Option B**: Create wrapper command in builtin context  
- Requires Bun installation and build pipeline
- Not viable in current environment

**Option C**: Switch to alternative architecture
- Register command via global OpenCode config
- Requires system-level changes (out of scope for plan-002)

---

## DECISIONS

## Boulder.json Session Tracking (2026-02-05)

**Date**: 2026-02-05
**Task**: Update `.sisyphus/boulder.json` to track active session

### Changes Made

1. **Created `.sisyphus/boulder.json`** with following structure:
   ```json
   {
     "active_plan": "plan-002-create-documentation-command",
     "plan_name": "plan-002-create-documentation-command",
     "session_ids": ["ses_3d383cb53ffeCraVLyFkSSPJ8E"]
   }
   ```

2. **Preserved fields**:
   - `active_plan`: Set to active plan name (unchanged from context)
   - `plan_name`: Set to active plan name (unchanged from context)

3. **Appended session id**:
   - Added current session id `ses_3d383cb53ffeCraVLyFkSSPJ8E` to `session_ids` array
   - JSON remains valid and properly formatted

### Verification

✓ JSON valid (jq validation passed)
✓ Session id appended to array (not inserted, not reordered)
✓ Existing keys and values preserved
✓ File created at correct location: `.sisyphus/boulder.json`

---

## Decision: Boulder.json Session ID Tracking (2026-02-05)

**Rationale**: Documented the update to `boulder.json` to include session id `ses_3d383cb53ffeCraVLyFkSSPJ8E` for audit and traceability purposes. This ensures the active session is persisted in the boulder.json configuration file for future reference and plan continuity.

**Decision**: Added session id to `boulder.json` `session_ids` array to maintain complete history of sessions associated with this plan.

- Updated boulder.json to include session id ses_3d383cb53ffeCraVLyFkSSPJ8E for plan continuity.
