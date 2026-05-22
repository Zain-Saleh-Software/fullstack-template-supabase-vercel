# Lead Council — Orchestrator

**Role:** Orchestrates all sub-councils for significant changes.
**Authority:** Decides which councils to invoke and synthesizes their reports.
**Priority:** #0 (Meta — Orchestrates all other councils)

## How to Use

For any significant change, run through this lead checklist to determine which councils must review. Then invoke each relevant council mentally and aggregate their findings.

## Trigger Matrix

| Change Type | Councils to Invoke |
|-------------|-------------------|
| New API route | API Design, Security, Quality, Testing, Observability |
| New database table | Database, Architect, Security, Deployment |
| New frontend page | Frontend, Architect, Quality, Accessibility (implicit in Frontend) |
| New dependency | Architect, Security, Deployment |
| Env var change | Deployment, Security |
| Auth/permission change | Security, Architect, Quality, Testing |
| Config/build change | Deployment, Architect |
| Git operations | GitHub |
| Any code change | Quality (always), GitHub (if committing) |
| Schema migration | Database, Deployment |
| Test suite changes | Testing, Quality |
| i18n changes | Frontend |
| POC cleanup | Lead (orchestrates all relevant councils) |
| Security patch | Security (blocks everything else) |

## All Available Councils (11 Total)

| Council | Priority | Domain |
|---------|----------|--------|
| `security.md` | #1 | Auth, RBAC, data protection, input validation |
| `architect.md` | #2 | Next.js patterns, tech stack, file structure |
| `database.md` | #2 | Schemas, migrations, RLS, indexes, soft deletes |
| `api-design.md` | #2 | Route structure, response formats, pagination, validation |
| `testing.md` | #3 | Coverage thresholds, test structure, test quality |
| `quality.md` | #3 | TypeScript, code style, error handling, docs |
| `frontend.md` | #3 | Components, a11y, i18n, dark mode, performance |
| `deployment.md` | #3 | Vercel compatibility, env vars, build readiness |
| `observability.md` | #3 | Logging, Sentry, error boundaries |
| `github.md` | #3 | Branch strategy, commits, immutable files, git hooks |
| `lead.md` | #0 | Orchestration (this council) |

## Priority Order for Conflict Resolution

When councils disagree, resolve in this order:

1. **Security Council** — Never compromised, ever
2. **Database Council + Architect Council + API Design Council** — Structural integrity, equal weight
3. **Testing Council + Quality Council + Frontend Council + Deployment Council + Observability Council + GitHub Council** — Implementation quality
4. **Performance** — Optimize within the constraints above
5. **Speed** — Velocity matters, but not at the cost of 1-4

## Orchestration Flow

1. **Identify domains touched** by the change
2. **Invoke each relevant council** using their checklist
3. **Collect findings** — approvals, change requests, or rejections
4. **Resolve conflicts** — follow priority order above
5. **Synthesize** a final go/no-go decision
6. **Document** the decision and any outstanding concerns

## Output

After orchestration, produce a summary:

```markdown
## Council Review Summary
- **Security:** ✅ Approved
- **Architect:** ✅ Approved
- **Database:** N/A (no schema changes)
- **API Design:** ✅ Approved (with note on pagination)
- **Testing:** ⚠️ Change requested (add edge case tests)
- **Quality:** ✅ Approved
- **Frontend:** N/A (no UI changes)
- **Deployment:** ✅ Approved
- **Observability:** ⚠️ Change requested (add logger to error paths)
- **GitHub:** ✅ Approved (commit message follows convention)

**Decision:** Approved pending test additions and logging improvements.
```

## Integration with BMAD Skills

The BMAD agent skills in `.agents/skills/bmad-council-*/` provide detailed review PROCEDURES (step-by-step review workflows). The project councils in `councils/` define the CHECKLISTS (what to verify). When performing a review:

1. Consult the relevant project council(s) for WHAT to check
2. Use the BMAD council skill(s) for HOW to perform the review
3. The Lead Council orchestrates both levels

## Escalation

If a council repeatedly blocks changes without resolution:
1. Document the specific concern
2. Propose a compromise that satisfies the minimum requirement
3. If Security Council blocks, there is no compromise — fix the security issue

## Contact

For orchestration questions, refer to:
- `CLAUDE.md` — AI agent mandates and three-persona system
- `RULES.md` — The ultimate source of truth for all rules
- Individual council files — Detailed checklists per domain
- BMAD council skills in `.agents/skills/bmad-council-*/` — Review procedures
