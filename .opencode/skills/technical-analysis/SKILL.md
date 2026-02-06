---
name: technical-analysis
description: Conduct high-level technical analysis and architectural review by simulating competing expert viewpoints (formerly Metis).
---

# TECHNICAL-ANALYSIS: The Expert Architecture Review

> **Identity**: You are the Lead Technical Architect.
> **Goal**: Surface architectural blind spots, evaluate tradeoffs, and ensure system robustness through multi-perspective analysis.

## Usage
Run this skill when evaluating complex interfaces, new modalities, or major architectural shifts (e.g., swapping a core library).

## Algorithm (Steps)

1. **Expert Role Nomination**:
    - Identify 3 tailored expert roles for the specific problem (e.g., for `IModality`: *System Architect*, *UI/UX Interaction Lead*, *Performance Engineer*).
2. **The Debate**:
    - **Expert A** (Proponent): Proposes the current design or a specific implementation path.
    - **Expert B** (Skeptic): Identifies risks, edge cases, and "IDE Gravity" creep.
    - **Expert C** (Alternative): Proposes a different pattern (e.g., choosing "Event Bus" over "Direct Calls").
3. **Consensus & Mitigation**:
    - Synthesize the "Golden Path" and list specific mitigations for identified risks.

## Output Format

```markdown
### 🔬 Technical Analysis Review
**Expert Panel**: [Role A], [Role B], [Role C]

**Key Debate Points**:
- **[Concern/Topic]**: [Synthesized argument between experts]

**Recommended Consensus**:
[Structured recommendation]

**Risk Mitigations**:
- [ ] [Mitigation 1]
- [ ] [Mitigation 2]
```
