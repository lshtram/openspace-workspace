# Draft: Background Agent Monitoring System

## User's Core Requirement
Background agents (launched with `run_in_background=true`) currently provide no visibility into their progress or health. If an agent encounters trouble, we only discover it when actively polling with `background_output`.

## Problem Statement
- **No progress visibility**: Can't see what background agents are doing
- **Silent failures**: Agent might be stuck, erroring, or struggling without any indication
- **No health monitoring**: Can't distinguish "working hard" from "stuck in infinite loop"
- **Poor UX**: User has no feedback while waiting for background tasks

## Desired State
A system where we can see:
- Health status of each background task (running, struggling, stuck, completed)
- Progress indicators (what step they're on, how far along)
- Real-time updates as agents work
- Early warnings when something goes wrong

## Questions to Clarify

### 1. Progress Reporting Mechanism
**How should agents report progress?**
- Option A: Agents explicitly call a `report_progress()` function during execution
- Option B: System automatically detects progress signals (tool calls, thinking updates)
- Option C: Hybrid - automatic detection + optional explicit reporting

### 2. Health Monitoring Strategy
**How do we detect if an agent is "struggling" vs "working hard"?**
- Time-based: If no activity for X seconds, flag as potentially stuck
- Error-based: Track tool failures, repeated retries
- Agent self-reporting: Agents explicitly signal "I'm having trouble with Y"

### 3. Display/Notification Method
**How should progress be communicated to the user?**
- Option A: Real-time updates printed to console (as background tasks run)
- Option B: Dashboard/status view (query anytime with a command)
- Option C: Proactive notifications only when issues detected
- Option D: All of the above

### 4. Integration with Existing Systems
**Should this integrate with the universal profiling system (`.agents/`)?**
- Yes - leverage existing delegation logging infrastructure
- No - separate system for real-time monitoring
- Hybrid - profiling for historical analysis, monitoring for real-time

## Decisions Made

### Progress Reporting
✅ **Automatic detection** - System watches status.json files, tool calls, agent activity. Zero code changes needed for agents.

### Health Detection
✅ **Error pattern detection** - Track tool failures, repeated retries, timeout patterns
✅ **Threshold**: Flag after 3+ tool failures in sequence (sensitive detection)

### Display Method
✅ **Real-time console updates** with periodic polling
✅ **Polling frequency**: 3-5 minute intervals (minimal overhead, good for long-running tasks)
✅ **Display format**: Progress + current step (e.g., "Task A: 2/5 steps complete, currently analyzing code")
✅ **Parallel tasks**: Grouped by task (all Task A updates together)

### Integration Strategy
✅ **Unified system** - Integrate with `.agents/` profiling infrastructure
- Real-time monitoring feeds into profiling data
- Leverage existing delegation tracking
- Single source of truth for agent performance

## Technical Approach (from explore findings)

### Current Infrastructure to Leverage
1. **File-based status tracking**: `status.json` in worktrees (created, running, completed, failed, timeout)
2. **Git worktrees**: Isolated execution environments at `/path/to/.worktrees/*/`
3. **Task ID system**: `bg_{hex}` format for correlation
4. **Existing tools**: `background_output(task_id="...")` for result retrieval

### Monitoring Components to Build
1. **Status Poller** (`monitor_background_tasks.ts`):
   - Polls every 3-5 minutes
   - Reads status.json from each active worktree
   - Tracks tool usage patterns from agent logs
   - Detects error patterns (3+ failures = alert)

2. **Progress Tracker** (integrated with `.agents/logs/`):
   - Correlates with delegation_requests.jsonl / delegation_results.jsonl
   - Calculates progress based on tool activity
   - Estimates "steps complete" from profiling data

3. **Display Module**:
   - Outputs to console grouped by task
   - Format: `[HH:MM] Task A (bg_abc123): 2/5 steps, analyzing codebase | ✓ Healthy`
   - Alert format: `[HH:MM] Task B (bg_def456): ⚠ Struggling - 3 tool failures detected`

4. **Integration with Universal Profiling**:
   - Background task events logged to `.agents/logs/background_monitoring.jsonl`
   - Feed into weekly review automation
   - Track background task success rates, common failure patterns

## Scope Boundaries

### INCLUDE
- Automatic status detection from worktree status.json
- Periodic polling (3-5 min intervals)
- Error pattern detection (3+ failures)
- Console output grouped by task
- Integration with `.agents/` profiling system
- Health indicators (healthy, struggling, stuck, completed, failed)

## CRITICAL GAPS IDENTIFIED (Metis Review)

### Infrastructure Reality Check
Metis discovered that **my assumptions were wrong**:
- ❌ `.agents/logs/` directory **doesn't exist yet** (from universal profiling plan, not yet implemented)
- ❌ status.json schema is **too simple** (only has: status enum + timestamps, NO progress/failures data)
- ❌ Found **TWO different background task systems** (worktree-manager vs OpenCode's background_output tool)

### CRITICAL QUESTIONS NEEDED

**BLOCKER 1: Which Background Task System?**
- **Option A**: OpenCode's `delegate_task(run_in_background=true)` with task IDs like `bg_abc123`
- **Option B**: worktree-manager.js system in dream-news project
- **Current context**: We're in `/Users/Shared/dev/openspace` (openspace project, not dream-news)

**BLOCKER 2: Where Does Progress/Failure Data Come From?**
Current status.json only has: `{status: "running", timestamp, updatedAt}`
But we want to display: "2/5 steps, 3 failures"

- **Option A**: Enrich status.json schema first (agents write progress data)
- **Option B**: Parse agent logs/output for progress signals (read-only monitoring)
- **Option C**: Start simple - just show status + time elapsed (defer progress tracking to v2)

**BLOCKER 3: Interface Type?**
- **Option A**: CLI one-shot (`bun run monitor`, runs once and exits) - simplest
- **Option B**: Long-running daemon with setInterval polling - needs process management
- **Option C**: TUI (like htop) with live updating display - most complex

### EXCLUDE
- Real-time streaming (too much overhead, periodic is sufficient)
- TUI dashboard (console output is enough for MVP)
- Manual progress checkpoints in agents (automatic detection only)
- Sub-task progress within agents (track at agent level, not internal steps)
- Historical playback (use profiling system for that)
