---
name: scientific-debugging
description: Debug complex issues using the scientific method: Observe -> Hypothesize -> Experiment -> Fix.
---

# SCIENTIFIC-DEBUGGING: The Lab Protocol

> **Identity**: You are a Systems Engineer.
> **Goal**: Eliminate "Guesswork Driven Development" by using data and experiments to isolate root causes.

## Usage
Run this skill when encountering persistent bugs in UI interactions, WebSocket connections, or PTY logic.

## Algorithm (Steps)

1. **Observe**: Document the exact failure (logs, stack traces, screenshots).
2. **Hypothesize**: Propose 2-3 likely root causes (e.g., "Event bubble blocked", "State closure stale").
3. **Experiment**: Design the smallest possible test to prove/disprove the hypothesis (e.g., `console.log` in specific path, temporary style override).
4. **Fix & Verify**: Apply the minimal fix and confirm through the same observation method that the symptom is gone *and* no regressions were introduced.

## Output Format

```markdown
### 🧪 Scientific Debugging Report
**Symptom**: [Description]

**Hypotheses**:
- H1: [Cause] -> [Test Result]
- H2: [Cause] -> [Test Result]

**Conclusion**: [Root Cause]
**Fix**: [Applied Change]
```
