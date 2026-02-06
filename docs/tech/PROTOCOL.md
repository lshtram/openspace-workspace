# OpenSpace Development Protocol

This document defines the strict operational boundaries for AI Agents working on the OpenSpace project.

## 1. Explicit Approval Rule
- **NEVER** implement code, modify files (outside of documentation), or execute multi-step tasks without explicit, written user approval of the proposed plan.
- A "Plan" must be shared first. Implementation can only start after the user says "Yes", "Proceed", "Approved", or equivalent.
- Proactive suggestions are encouraged, but proactive execution is **forbidden**.

## 2. Manual Test Protocol (The "Reset" Rule)
- If a verification step requires **manual intervention** (e.g., "User opens browser", "User speaks into mic"), this is a high-risk state.
- **Immediate Revocation**: The inclusion of a manual test instantly revokes any previously granted approvals for that specific deliverable or task.
- **Re-Approval Required**: The agent must pause, present the manual test plan clearly, and wait for a fresh approval before taking any further action.

## 3. Workflow Sequence
1. **Understand**: Analyze the request.
2. **Plan**: Present a concise execution and verification plan.
3. **Approve**: Wait for user confirmation.
4. **Implement**: Execute only the approved steps.
5. **Verify**: Run automated tests or present manual test instructions.

## 4. Documentation Responsibility
- Documentation (like this file) should be updated to reflect evolving project constraints immediately upon user request.
