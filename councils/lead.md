# Lead Council — Orchestrator

**Role:** Orchestrates all sub-councils for significant changes.
**Authority:** Decides which councils to invoke and synthesizes their reports.

## How to Use

For any significant change, run through this lead checklist to determine which councils must review. Then invoke each relevant council mentally and aggregate their findings.

## Trigger Matrix

| Change Type | Councils to Invoke |
|-------------|-------------------|
| New API route | Security, Quality, Deployment (if env vars) |
| New database table | Architect, Security, Deployment |
| New frontend page | Architect, Quality |
| New dependency | Architect, Security, Deployment |
| Env var change | Deployment, Security |
| Auth/permission change | Security, Architect, Quality |
| Config/build change | Deployment, Architect |
| Any code change | Quality (always) |

## Orchestration Flow

1. **Identify domains touched** by the change
2. **Invoke each relevant council** using their checklist
3. **Collect findings** — approvals, change requests, or rejections
4. **Resolve conflicts** — follow priority order: Security > Architecture > Quality > Deployment
5. **Synthesize** a final go/no-go decision
6. **Document** the decision and any outstanding concerns

## Priority Order for Conflicts

1. **Security Council** — Never compromise
2. **Architect Council** — Structural integrity
3. **Quality Council** — Maintainability
4. **Deployment Council** — Platform constraints

## Output

After orchestration, produce a summary:

```markdown
## Council Review Summary
- **Architect:** ✅ Approved (with note on file naming)
- **Security:** ✅ Approved
- **Quality:** ⚠️ Change requested (add edge case tests)
- **Deployment:** ✅ Approved

**Decision:** Approved pending test additions.
```
