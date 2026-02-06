# .sisyphus Directory Structure

This directory contains the Sisyphus task management and workflow system for the openspace project.

## Directory Purposes

### `boulders/`
Active and completed boulder tasks. Stores:
- Boulder state files (in JSON format)
- Task progress tracking
- Work in progress snapshots

### `evidence/`
Artifacts and outputs from completed tasks. Contains:
- Build outputs
- Test results
- Generated reports
- Verification artifacts
- Task deliverables

### `logs/`
System and task execution logs. Records:
- Task execution timestamps
- System operations
- Error logs
- Activity trails
- Historical records

### `plans/`
Task plans and specifications. Holds:
- Boulder plans (task definitions)
- Checkpoint specifications
- Task breakdowns
- Requirements documentation

### `notepads/`
Learning and decision documentation by task. Contains:
- `learnings.md` - patterns and successful approaches
- `issues.md` - problems and gotchas encountered
- `decisions.md` - architectural choices
- `problems.md` - unresolved issues and technical debt

### `drafts/`
Work-in-progress documents and preliminary versions.

### `summaries/`
Completed work summaries and task closure documentation.

### `conversations/`
Session records and conversation logs.

## Files

### `boulder.json`
Current active boulder task configuration. Do not edit directly.

### `KEY_CONVERSATIONS.md`
Historical record of significant conversations and decisions.

## Usage Notes

- This directory is managed by the Sisyphus system
- Do not manually edit core files (boulder.json, plans)
- Append to learning documents rather than overwriting
- Maintain the directory hierarchy as specified
