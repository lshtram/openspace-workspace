# Requirements: Core Product (REQ-CORE)

**Source**: Session 001 (initial-planning)  
**Date**: 2026-02-04  
**Status**: Draft

## Traceability
- **Derived from**: `docs/requirements/summaries/session-001-summary.md`

## Requirements Table

| ID | Category | Requirement | Priority | Status |
|----|----------|-------------|----------|--------|
| REQ-CORE-001 | Modalities | Input/output modalities are decoupled | High | Draft |
| REQ-CORE-002 | Voice | Voice input supported (Whisper/VoiceInk) | High | Draft |
| REQ-CORE-003 | Voice | Voice output (TTS) integrated for presentations and short summaries | High | Draft |
| REQ-CORE-004 | Voice | Voice output behavior fully configurable | High | Draft |
| REQ-CORE-005 | Workflow | Configurable workflow via AGENTS/PROCESS/GUIDELINES | High | Draft |
| REQ-CORE-006 | Output | Agent console streaming logs is MVP primary output | High | Draft |
| REQ-CORE-007 | Whiteboard | Whiteboard is a modality, not the full shell | Medium | Draft |
| REQ-CORE-008 | Sketching | Support freeform, structured, and captured-image sketches | High | Draft |
| REQ-CORE-009 | Annotation | Annotation as a distinct modality | High | Draft |
| REQ-CORE-010 | UI Principles | No fluid morphing; clear, stable layout with nothing hidden | High | Draft |
| REQ-CORE-011 | Artifacts | Global artifact index (project map) | High | Draft |
| REQ-CORE-012 | Artifacts | Contextual artifact indexes by flow | Medium | Draft |
| REQ-CORE-013 | Presentation | Generate slides + narration script with user control | High | Draft |
| REQ-CORE-014 | MVP Flow | Voice → Requirements → Presentation flow | High | Draft |
| REQ-CORE-015 | MVP Flow | Sketch → Component Preview flow | High | Draft |
| REQ-CORE-016 | Documentation | Conversation → Summary → Requirements → Verification | High | Draft |
| REQ-CORE-017 | Documentation | Non-text truth modalities stored when translation not possible | Medium | Draft |
| REQ-CORE-018 | Roadmap | Future phases include dashboards + hybrid artifact evolution view | Medium | Draft |
| REQ-CORE-019 | Documentation | /document updates session files in place (no duplicates) | High | Draft |
| REQ-CORE-020 | Documentation | Summary verification loop required before requirements generation | High | Draft |
| REQ-CORE-021 | Documentation | Requirements verified against summary (not transcript) | High | Draft |
| REQ-CORE-022 | Documentation | If verification fails, iterate and ask user for clarification | High | Draft |
| REQ-CORE-023 | Documentation | Transcripts preserved raw (no cleanup) | High | Draft |
| REQ-CORE-024 | Artifacts | Multi-dimensional artifact classification with sort/filter | High | Draft |
| REQ-CORE-025 | Artifacts | Quick view simplify/restore control | Medium | Draft |
| REQ-CORE-026 | Artifacts | Default artifact index is VSCode-like file tree | High | Draft |
| REQ-CORE-027 | Artifacts | File tree includes all artifact files | High | Draft |
| REQ-CORE-028 | Artifacts | Default mixed tree organization; user-controlled | Medium | Draft |
| REQ-CORE-029 | Artifacts | Metadata not in filenames; use sidecar metadata | Medium | Draft |
| REQ-CORE-030 | Interaction | Agents batch related questions | Medium | Draft |
| REQ-CORE-031 | Artifacts | Prefer filesystem metadata/YAML front matter | Medium | Draft |
| REQ-CORE-032 | Artifacts | Metadata index must be safe and recoverable | Medium | Draft |
| REQ-CORE-033 | Modalities | Output modality chosen by context after understanding | Medium | Draft |
| REQ-CORE-034 | Voice | Quick toggle and keybinds for voice output | Medium | Draft |
| REQ-CORE-035 | Voice | On-demand TTS activation | Medium | Draft |
| REQ-CORE-036 | Presentation | Store presentations as Markdown; avoid HTML artifacts | High | Draft |
| REQ-CORE-037 | Architecture | Presentation renderer must be replaceable | High | Draft |
| REQ-CORE-038 | Architecture | Major subsystems are modular and swappable | High | Draft |
| REQ-CORE-039 | Presentation | Default renderer is Reveal.js (swappable) | Medium | Draft |

## Detailed Requirements

### REQ-CORE-001: Decoupled Modalities
**Category**: Modalities  
**Priority**: High  
**Source**: Session 001 – Input/Output separation

**Description**:
Inputs (voice/text/sketch/gesture) must be independent from outputs (text/voice/visual), allowing any pairing.

**Acceptance Criteria**:
- System supports at least two input/output pairings (e.g., voice→text, voice→visual) in MVP.
- Output modality can be chosen independently of input modality.

---

### REQ-CORE-002: Voice Input
**Category**: Voice  
**Priority**: High  
**Source**: Session 001 – Voice input already implemented

**Description**:
Support voice input via existing Whisper/VoiceInk pipeline.

**Acceptance Criteria**:
- Voice input is available for triggering workflows.
- Voice input is transcribed into text commands reliably.

---

### REQ-CORE-003: Voice Output Integration
**Category**: Voice  
**Priority**: High  
**Source**: Session 001 – Voice in/out essential

**Description**:
Integrate TTS for presentations and short narrator summaries.

**Acceptance Criteria**:
- Presentations can be narrated using TTS.
- Short agent replies can be spoken (1–3 sentence summaries).

---

### REQ-CORE-004: Configurable Voice Output
**Category**: Voice  
**Priority**: High  
**Source**: Session 001 – User mood/flow configuration

**Description**:
Voice output triggers are fully configurable per user and per flow.

**Acceptance Criteria**:
- User can toggle voice output (off / completion / errors / all).
- Toggle is easy to access and can be changed quickly.

---

### REQ-CORE-005: Configurable Workflow
**Category**: Workflow  
**Priority**: High  
**Source**: Session 001 – Default flow + customization

**Description**:
Provide a default flow, but allow complete customization via AGENTS.md/PROCESS.md/GUIDELINES.md.

**Acceptance Criteria**:
- Default workflow exists.
- Users can replace or modify the workflow configuration files.

---

### REQ-CORE-006: Agent Console Output
**Category**: Output  
**Priority**: High  
**Source**: Session 001 – MVP output view

**Description**:
Agent console streaming logs is the primary MVP output view.

**Acceptance Criteria**:
- Agents emit streaming logs to a dedicated console view.
- Console view is distinct from terminal.

---

### REQ-CORE-007: Whiteboard Modality
**Category**: Whiteboard  
**Priority**: Medium  
**Source**: Session 001 – Whiteboard as modality

**Description**:
Whiteboard is a modality for input/output but not the main shell.

**Acceptance Criteria**:
- Whiteboard can be opened and used without replacing the main interface.

---

### REQ-CORE-008: Sketching Inputs
**Category**: Sketching  
**Priority**: High  
**Source**: Session 001 – Freeform + structured + image capture

**Description**:
Support freeform sketches, structured shapes, and captured images (whiteboards/napkins).

**Acceptance Criteria**:
- Users can draw freehand and use basic shapes.
- Users can upload or capture an image as sketch input.

---

### REQ-CORE-009: Annotation Modality
**Category**: Annotation  
**Priority**: High  
**Source**: Session 001 – Annotation as distinct modality

**Description**:
Allow markup on top of existing artifacts to revise or replace parts.

**Acceptance Criteria**:
- User can strike through or mark elements in an artifact.
- System recognizes annotation as modification intent.

---

### REQ-CORE-010: Stable UI Map
**Category**: UI Principles  
**Priority**: High  
**Source**: Session 001 – No morphing, nothing hidden

**Description**:
Avoid fluid UI morphing; maintain clear, stable, discoverable navigation.

**Acceptance Criteria**:
- Key panels and artifacts remain locatable via consistent navigation.
- No automatic morphing that hides or relocates artifacts without user intent.

---

### REQ-CORE-011: Global Artifact Index
**Category**: Artifacts  
**Priority**: High  
**Source**: Session 001 – Project map

**Description**:
Provide a global index listing all artifacts.

**Acceptance Criteria**:
- Global index lists all artifacts regardless of flow.

---

### REQ-CORE-012: Contextual Artifact Indexes
**Category**: Artifacts  
**Priority**: Medium  
**Source**: Session 001 – Contextual filters

**Description**:
Provide contextual views that filter artifacts by current flow.

**Acceptance Criteria**:
- Users can toggle a contextual view for requirements, debugging, etc.

---

### REQ-CORE-013: Presentation Output
**Category**: Presentation  
**Priority**: High  
**Source**: Session 001 – Slides + narration + user control

**Description**:
Generate slide decks with narration scripts and user-controlled playback.

**Acceptance Criteria**:
- System can generate a slide deck artifact.
- TTS narration can be started manually and controlled (play/pause/skip).

---

### REQ-CORE-014: MVP Flow – Voice → Requirements → Presentation
**Category**: MVP Flow  
**Priority**: High  
**Source**: Session 001 – MVP sequencing

**Description**:
MVP must support voice input leading to requirements and a presentation output.

**Acceptance Criteria**:
- A voice request triggers requirements generation.
- Output includes a presentation artifact with narration script.

---

### REQ-CORE-015: MVP Flow – Sketch → Component Preview
**Category**: MVP Flow  
**Priority**: High  
**Source**: Session 001 – MVP sequencing

**Description**:
MVP must support sketch input leading to a component preview.

**Acceptance Criteria**:
- A sketch can produce a preview artifact (non-production sandbox).
- User can refine requirements before final code generation.

---

### REQ-CORE-016: Documentation Pipeline
**Category**: Documentation  
**Priority**: High  
**Source**: Session 001 – Traceability system

**Description**:
Documentation pipeline must create transcript → summary → requirements → verification.

**Acceptance Criteria**:
- Each session has transcript and summary files.
- Requirements link back to summaries.
- Verification files exist for both summary and requirements.

---

### REQ-CORE-017: Non-Text Truth Modalities
**Category**: Documentation  
**Priority**: Medium  
**Source**: Session 001 – Non-text truth allowed

**Description**:
When translation to text is not possible, store audio/image/video as truth artifacts.

**Acceptance Criteria**:
- System supports storing non-text artifacts with references in documentation.

---

### REQ-CORE-018: Roadmap Features
**Category**: Roadmap  
**Priority**: Medium  
**Source**: Session 001 – Phase mapping

**Description**:
Future phases include reporting dashboards and hybrid artifact evolution view.

**Acceptance Criteria**:
- Phase map includes reporting dashboards and hybrid artifact evolution.

---

### REQ-CORE-019: In-Place Session Updates
**Category**: Documentation  
**Priority**: High  
**Source**: Session 001 – No duplicates, delta updates

**Description**:
The /document workflow must update an existing session file in place instead of creating duplicate files.

**Acceptance Criteria**:
- Running /document multiple times for the same session does not create new transcript files.
- Session transcript is updated with new content only.

---

### REQ-CORE-020: Summary Verification Loop
**Category**: Documentation  
**Priority**: High  
**Source**: Session 001 – Verification before requirements

**Description**:
Summary must be verified against transcript before requirements are generated; loop until accurate.

**Acceptance Criteria**:
- Summary verification exists and passes before requirements generation.
- If verification fails, summary is revised and re-verified.

---

### REQ-CORE-021: Requirements Verified Against Summary
**Category**: Documentation  
**Priority**: High  
**Source**: Session 001 – Requirements vs summary

**Description**:
Requirements verification must compare requirements against the session summary (not transcript).

**Acceptance Criteria**:
- Requirements verification report references the summary as the source.
- Verification checks for coverage of summary points.

---

### REQ-CORE-022: Clarification Loop on Verification Gaps
**Category**: Documentation  
**Priority**: High  
**Source**: Session 001 – Ask user on ambiguity

**Description**:
If verification finds gaps or ambiguity, prompt the user to clarify before finalizing.

**Acceptance Criteria**:
- Verification report flags ambiguous or missing items.
- User is asked for clarification before proceeding.

---

### REQ-CORE-023: Raw Transcript Preservation
**Category**: Documentation  
**Priority**: High  
**Source**: Session 001 – Keep transcript raw

**Description**:
Session transcripts must remain raw and unfiltered, preserving tool-call markers and metadata.

**Acceptance Criteria**:
- Transcript retains tool-call markers and full context.
- No cleanup pass removes or alters raw data.

---

### REQ-CORE-024: Multi-Dimensional Artifact Classification
**Category**: Artifacts  
**Priority**: High  
**Source**: Session 001 – Classification flexibility

**Description**:
Artifact navigation must support multiple classification dimensions (type, date, component/feature, flow stage) with table-like sorting and filtering.

**Acceptance Criteria**:
- Artifact list supports sorting by at least two dimensions.
- Artifact list supports filtering by type and feature/domain.

---

### REQ-CORE-025: Quick View Simplify/Restore
**Category**: Artifacts  
**Priority**: Medium  
**Source**: Session 001 – Simplify complex view on demand

**Description**:
Users must be able to quickly simplify or restore complex artifact views via a button/toggle.

**Acceptance Criteria**:
- A single action collapses to a simplified view.
- A single action restores the prior complex view.

---

### REQ-CORE-026: Default File Tree View
**Category**: Artifacts  
**Priority**: High  
**Source**: Session 001 – Default view decision

**Description**:
Default artifact index is a VSCode-like file tree (folders/files). Advanced filters are optional views.

**Acceptance Criteria**:
- Default navigation shows a folder/file tree.
- Users can switch to advanced filtered views when needed.

---

### REQ-CORE-027: All Artifacts in File Tree
**Category**: Artifacts  
**Priority**: High  
**Source**: Session 001 – All artifacts are files

**Description**:
The file tree includes all artifacts (requirements, diagrams, presentations, logs), since each artifact is stored as a file in the project folder.

**Acceptance Criteria**:
- File tree lists non-code artifacts alongside code files.
- Artifacts are visible in their stored paths.

---

### REQ-CORE-028: Mixed Tree Organization
**Category**: Artifacts  
**Priority**: Medium  
**Source**: Session 001 – User-controlled organization

**Description**:
Default organization is a mixed tree; users control their own structure. System may suggest defaults via guidelines but does not enforce cataloging.

**Acceptance Criteria**:
- System does not force artifacts into a dedicated root.
- Users can organize artifacts and code in their preferred structure.

---

### REQ-CORE-029: Metadata Outside Filenames
**Category**: Artifacts  
**Priority**: Medium  
**Source**: Session 001 – Metadata storage decision

**Description**:
Artifact metadata should not be encoded in file names. Use file extensions and optional sidecar metadata (e.g., JSON/INDEX) when needed.

**Acceptance Criteria**:
- File naming does not require type/stage/feature tokens.
- Optional metadata store can capture artifact classification.

---

### REQ-CORE-030: Question Batching
**Category**: Interaction  
**Priority**: Medium  
**Source**: Session 001 – Interaction guideline

**Description**:
Agents should group related questions into blocks to reduce back-and-forth, avoiding one-at-a-time questioning unless blocked.

**Acceptance Criteria**:
- Clarifying questions are presented in blocks when possible.
- Single-question turns are used only when blocking.

---

### REQ-CORE-031: Metadata via Filesystem/YAML
**Category**: Artifacts  
**Priority**: Medium  
**Source**: Session 001 – Metadata storage preference

**Description**:
Prefer file-system metadata and/or YAML front matter for artifact metadata when possible.

**Acceptance Criteria**:
- Text artifacts may include YAML front matter for metadata.
- System leverages file-system metadata where available.

---

### REQ-CORE-032: Metadata Index Safety
**Category**: Artifacts  
**Priority**: Medium  
**Source**: Session 001 – Index safety concerns

**Description**:
If a metadata index/JSON sidecar is used, it must be safe and recoverable (avoid single-point corruption).

**Acceptance Criteria**:
- Index corruption does not destroy artifact discoverability.
- Recovery or regeneration path exists.

---

### REQ-CORE-033: Context-Driven Output Modality
**Category**: Modalities  
**Priority**: Medium  
**Source**: Session 001 – Sketch input vs output modalities

**Description**:
Sketch input should translate to agent understanding first; output modality (preview/presentation/text) is chosen based on context and task complexity.

**Acceptance Criteria**:
- System can choose output modality based on task context.
- Sketch input does not force component preview as the only output.

---

### REQ-CORE-034: Voice Output Quick Controls
**Category**: Voice  
**Priority**: Medium  
**Source**: Session 001 – Quick toggle/keybinds

**Description**:
Provide quick toggles and keybinds to control voice output behavior.

**Acceptance Criteria**:
- User can toggle voice output via a quick control.
- User can bind a key to voice output behavior.

---

### REQ-CORE-035: On-Demand TTS Activation
**Category**: Voice  
**Priority**: Medium  
**Source**: Session 001 – On-demand narration

**Description**:
Allow on-demand activation of TTS (e.g., press-to-speak for agent summary).

**Acceptance Criteria**:
- User can trigger TTS narration manually on demand.

---

### REQ-CORE-036: Markdown Presentation Storage
**Category**: Presentation  
**Priority**: High  
**Source**: Session 001 – Markdown preference

**Description**:
Presentation artifacts should be stored as Markdown whenever possible; avoid persisting HTML output.

**Acceptance Criteria**:
- Presentation source is saved as Markdown.
- HTML output is generated on demand, not stored.

---

### REQ-CORE-037: Replaceable Presentation Renderer
**Category**: Architecture  
**Priority**: High  
**Source**: Session 001 – Replaceable components

**Description**:
Presentation rendering must be a replaceable component (Reveal.js now, but swappable).

**Acceptance Criteria**:
- Renderer is behind a stable interface.
- Implementation can be swapped without changing upstream workflows.

---

### REQ-CORE-038: Modular, Replaceable Subsystems
**Category**: Architecture  
**Priority**: High  
**Source**: Session 001 – Replaceable components philosophy

**Description**:
All major subsystems (voice, sketching, presentation, annotation, indexing) must be modular and replaceable via clean interfaces.

**Acceptance Criteria**:
- Each subsystem exposes a stable interface contract.
- Implementation details are isolated behind adapters.

---

### REQ-CORE-039: Default Presentation Renderer
**Category**: Presentation  
**Priority**: Medium  
**Source**: Session 001 – Reveal.js now, swappable later

**Description**:
Use Reveal.js as the initial presentation renderer, while keeping the renderer swappable.

**Acceptance Criteria**:
- Reveal.js is the default renderer for Markdown presentations.
- Renderer can be replaced without changing presentation source files.
