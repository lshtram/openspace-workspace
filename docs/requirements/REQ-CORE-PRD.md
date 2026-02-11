---
id: REQ-CORE-PRD
author: oracle_0001
status: APPROVED
date: 2026-02-11
task_id: openspace-nso-alignment
---

# OpenSpace Product Requirements Document (PRD)

Version: 0.1 (Draft)
Date: 2026-02-04
Status: Planning

## Executive Summary
OpenSpace is a multi-modal VibeCoding IDE where the user acts as a team lead or PM, not a file-obsessed coder. The system captures intent through voice, sketching, and annotation, then produces artifacts such as requirements, presentations, previews, and code. Input and output modalities are decoupled so any input can pair with any output, with a strong preference for stable, discoverable UI and Markdown-first artifacts.

## Problem Statement
Current IDEs are optimized for text editing, not intent capture. Teams also need requirements, presentations, diagrams, and traceable decisions. OpenSpace addresses this by making multi-modal inputs first-class and by producing structured artifacts with full traceability from conversation to requirements.

## Core Principles
- Decoupled input/output modalities: any input can pair with any output.
- Replaceable components: voice, sketching, presentation, and indexing are modular and swappable.
- Stable, discoverable UI: no fluid morphing; nothing hidden.
- Artifact-first workflow: requirements, presentations, and diagrams are first-class files.
- Documentation traceability: conversation -> summary -> requirements -> verification.

## Replaceable Components
OpenSpace treats major subsystems as adapters behind stable interfaces. This includes voice input, TTS output, presentation rendering, sketching canvas, and artifact indexing. Initial implementations can be replaced without changing upstream workflows.

## MVP Flows
1. Voice -> Requirements -> Presentation
   - Voice input triggers the configured workflow.
   - Output includes a requirements document and a presentation with narration script.
   - User controls narration and slide navigation.

2. Sketch -> Component Preview
   - User sketches UI or architecture on the whiteboard.
   - The system interprets the sketch and produces a component preview.
   - Output modality is chosen by context after understanding the sketch.

## Requirements Overview (REQ-CORE)
High priority requirements include:
- REQ-CORE-001: Input/output modalities are decoupled.
- REQ-CORE-002: Voice input supported (Whisper/VoiceInk).
- REQ-CORE-003: Voice output (TTS) for presentations and short summaries.
- REQ-CORE-005: Configurable workflow via AGENTS/PROCESS/GUIDELINES.
- REQ-CORE-006: Agent console streaming logs is MVP primary output.
- REQ-CORE-008: Sketching supports freeform, structured, and captured-image input.
- REQ-CORE-013: Generate slides and narration scripts with user control.
- REQ-CORE-014: Voice -> Requirements -> Presentation flow.
- REQ-CORE-015: Sketch -> Component Preview flow.
- REQ-CORE-016: Conversation -> Summary -> Requirements -> Verification pipeline.
- REQ-CORE-026: Default artifact index is a VSCode-like file tree.
- REQ-CORE-036: Presentations stored as Markdown (avoid HTML artifacts).
- REQ-CORE-037/038: Presentation renderer and major subsystems are replaceable.

Full list: docs/requirements/official/REQ-CORE-001-through-039.md
