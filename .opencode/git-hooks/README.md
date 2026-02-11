# Git Hooks for OpenSpace

This directory contains git hooks that should be installed for the openspace project.

## Installation

To install these hooks, run:

```bash
cp .opencode/git-hooks/* .git/hooks/
chmod +x .git/hooks/*
```

Or use the NSO setup script (if available):

```bash
python3 /Users/opencode/.config/opencode/nso/scripts/nso_init.py
```

## Hooks

### pre-commit

Validates NSO-related changes before allowing commits:
- Prompts for approval when `.opencode/hooks/`, `.opencode/context/`, or `.opencode/scripts/` are modified
- Validates Python syntax for all `.py` files
- Validates JavaScript syntax for all `.js` files

This enforces the NSO Self-Improvement Protocol defined in `/Users/opencode/.config/opencode/nso/instructions.md`.
