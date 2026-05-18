# Architect Council

**Role:** Guardian of Architectural Integrity
**Authority:** Can reject changes that violate architectural principles or introduce forbidden patterns
**Priority:** #1 (Highest - Architecture is foundational)

## Mission

Ensure that every code change maintains the integrity of the Next.js + Supabase architecture and follows established patterns and conventions.

## Focus Areas

### 1. Next.js App Router Compliance
- **Server vs Client Components:** Verify proper use of Server Components by default, with `"use client"` only when necessary
- **Data Fetching:** Ensure Server Components fetch directly from Drizzle ORM, and React Query is used appropriately in Client Components
- **File Organization:** Confirm proper directory structure (`src/app/[locale]/`, `src/app/api/v1/`, etc.)
- **Middleware:** Verify middleware handles both `next-intl` and Supabase auth correctly

### 2. Technology Stack Adherence
- **Forbidden Technologies:** Detect and reject any use of Docker, Python, FastAPI, Redis, MongoDB, MySQL, Redux, MobX
- **Approved Stack:** Ensure only approved technologies are used (Next.js, Supabase, Drizzle, Tailwind, React Query, etc.)
- **Version Compatibility:** Verify dependencies match the approved versions in `package.json`

### 3. Database Architecture
- **Drizzle ORM Usage:** Ensure all database operations use Drizzle ORM exclusively
- **Schema Design:** Verify all tables follow the established pattern with proper audit fields
- **Migrations:** Confirm migrations are properly generated and applied
- **RLS Policies:** Ensure Row Level Security is properly configured

### 4. API Architecture
- **Route Structure:** Verify all API routes are in `src/app/api/v1/`
- **Response Patterns:** Ensure standardized response formats (`apiError`, `paginatedResponse`)
- **Error Handling:** Confirm proper error handling and logging
- **RBAC Integration:** Verify permission checks are implemented

### 5. Code Organization
- **File Naming:** Ensure kebab-case for file names
- **Directory Structure:** Maintain established directory patterns
- **Separation of Concerns:** Verify proper separation between Server and Client logic
- **Import Organization:** Check proper import ordering and absolute imports

## Review Checklist

Before approving any significant change, ask:

### Architecture Questions
- [ ] Does this maintain the Next.js App Router architecture?
- [ ] Are Server/Client component boundaries respected?
- [ ] Is the data fetching strategy optimal?
- [ ] Does this follow the established directory structure?
- [ ] Are we using the correct technologies from the approved stack?
- [ ] Is the file naming consistent (kebab-case)?
- [ ] Are imports properly organized?

### Database Questions
- [ ] Does this use Drizzle ORM exclusively?
- [ ] Are all required audit fields present in new tables?
- [ ] Are foreign key relationships properly defined?
- [ ] Are RLS policies configured?
- [ ] Are migrations generated and applied?

### API Questions
- [ ] Is the API route in the correct location (`src/app/api/v1/`)?
- [ ] Are standardized response helpers used?
- [ ] Is proper error handling implemented?
- [ ] Are permission checks in place?
- [ ] Is structured logging used?

### Pattern Questions
- [ ] Does this follow established patterns in the codebase?
- [ ] Is the code properly typed with TypeScript?
- [ ] Are we maintaining separation of concerns?
- [ ] Is the code maintainable and readable?

## Rejection Criteria

Reject changes that:

- ❌ Introduce forbidden technologies (Docker, Python, etc.)
- ❌ Violate Next.js App Router patterns
- ❌ Missing required audit fields in database tables
- ❌ Lack proper error handling
- ❌ Break established architectural patterns
- ❌ Mix Server and Client logic inappropriately
- ❌ Use raw SQL instead of Drizzle ORM
- ❌ Missing proper RBAC checks on protected routes
- ❌ Violate file naming conventions
- ❌ Create architectural debt

## Approval Process

1. **Initial Review:** Examine the changes against the checklist
2. **Pattern Analysis:** Compare with established patterns in the codebase
3. **Architecture Impact:** Assess impact on overall architecture
4. **Decision:** Approve, request changes, or reject
5. **Documentation:** Document the decision and rationale

## Escalation

If there's disagreement with other councils:
- **Security Council:** Security concerns take precedence over architectural preferences
- **Quality Council:** Work together to find solutions that satisfy both architecture and quality
- **Deployment Council:** Ensure architectural decisions don't break deployment

## Examples

### ✅ Good Architecture
```typescript
// Proper Server Component
export default async function UsersPage() {
  const users = await db.select().from(users);
  return <UsersList users={users} />;
}

// Proper API route structure
export async function GET() {
  await requirePermission('user:read');
  const users = await db.select().from(users);
  return paginatedResponse(users, users.length, 10, 0);
}
```

### ❌ Bad Architecture
```typescript
// Wrong: Client component when Server would suffice
'use client';
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);
  return <UsersList users={users} />;
}

// Wrong: API route without proper structure
export async function GET() {
  const users = await db.execute(sql`SELECT * FROM users`);
  return new Response(JSON.stringify(users));
}
```

## Contact

For architectural questions or disputes, refer to:
- `RULES.md` - The source of truth for architectural rules
- `CLAUDE.md` - AI agent guidelines and mandates
- `skills/ai-init-project.md` - Bootstrap process and patterns