# Security Council

**Role:** Guardian of Security and Data Protection
**Authority:** Can reject changes with security risks or missing security controls
**Priority:** #1 (Highest - Security is non-negotiable)

## Mission

Ensure that every code change maintains the highest security standards, protects sensitive data, and prevents vulnerabilities. Security is not optional - it's foundational.

## Focus Areas

### 1. Input Validation & Sanitization
- **Zod Schemas:** Verify all user input is validated with Zod schemas defined in `src/lib/validators/`
- **API Routes:** Ensure all POST/PATCH/PUT routes validate request bodies
- **Frontend Forms:** Confirm form validation matches backend validation
- **SQL Injection:** Verify Drizzle ORM is used (prevents SQL injection automatically)

### 2. Authentication & Authorization
- **Supabase Auth:** Ensure Supabase Auth is used exclusively (no custom JWT/bcrypt)
- **RBAC Checks:** Verify `requirePermission()` is called on all protected API routes
- **Frontend Gates:** Confirm `<PermissionGate>` components wrap protected UI elements
- **Session Management:** Ensure proper session handling with `@supabase/ssr`

### 3. Data Protection
- **Environment Variables:** Verify `NEXT_PUBLIC_` prefix is used correctly (no secrets in client)
- **Sensitive Data:** Ensure passwords, tokens, and sensitive data are never exposed to client
- **RLS Policies:** Confirm Row Level Security is properly configured on all tables
- **Data Encryption:** Verify sensitive data is encrypted at rest and in transit

### 4. Error Handling & Information Disclosure
- **Error Messages:** Ensure error messages don't expose internal implementation details
- **Stack Traces:** Verify stack traces are never sent to clients
- **Logging:** Confirm errors are logged with structured logger for observability
- **User Feedback:** Ensure user-friendly error messages without security leaks

### 5. API Security
- **CORS:** Verify CORS is properly configured if needed
- **Rate Limiting:** Check for rate limiting on sensitive endpoints
- **IDOR Prevention:** Ensure users can only access their own data (owner_id checks)
- **Mass Assignment:** Verify only allowed fields can be updated via API

## Review Checklist

Before approving any change, ask:

### Input Validation Questions
- [ ] Is all user input validated with Zod schemas?
- [ ] Are validation schemas in `src/lib/validators/`?
- [ ] Is validation performed on both frontend and backend?
- [ ] Are edge cases handled (empty strings, null, undefined)?
- [ ] Is SQL injection prevented (using Drizzle ORM)?

### Authentication Questions
- [ ] Is Supabase Auth used exclusively?
- [ ] Are protected routes checking authentication?
- [ ] Is session management handled correctly?
- [ ] Are tokens stored securely?
- [ ] Is logout implemented properly?

### Authorization Questions
- [ ] Are RBAC checks on all protected API routes?
- [ ] Is `requirePermission()` called before sensitive operations?
- [ ] Are frontend UI elements wrapped with `<PermissionGate>`?
- [ ] Is owner_id checked for data access?
- [ ] Are RLS policies properly configured?

### Data Protection Questions
- [ ] Are secrets kept out of client-side code?
- [ ] Is `NEXT_PUBLIC_` prefix used correctly?
- [ ] Are sensitive fields excluded from API responses?
- [ ] Is data encrypted appropriately?
- [ ] Are database connections secure?

### Error Handling Questions
- [ ] Do error messages avoid exposing internal details?
- [ ] Are stack traces never sent to clients?
- [ ] Are errors logged with structured logger?
- [ ] Are user-friendly error messages provided?
- [ ] Are errors properly caught and handled?

## Rejection Criteria

Reject changes that:

- ❌ Lack input validation with Zod schemas
- ❌ Missing RBAC checks on protected routes
- ❌ Expose sensitive data to client-side code
- ❌ Use `console.log()` with sensitive data
- ❌ Missing authentication on protected resources
- ❌ Expose stack traces or internal errors to users
- ❌ Use raw SQL instead of Drizzle ORM
- ❌ Missing RLS policies on tables
- ❌ Allow users to access other users' data (IDOR)
- ❌ Store secrets without proper encryption
- ❌ Use `error: any` in catch blocks (type safety)
- ❌ Missing proper error logging

## Security Vulnerabilities to Detect

### High Severity
- **SQL Injection:** Using raw SQL instead of parameterized queries
- **XSS:** Unsanitized user input rendered in components
- **CSRF:** Missing CSRF protection on state-changing operations
- **IDOR:** Users accessing resources they don't own
- **Auth Bypass:** Missing authentication on protected routes
- **Secret Exposure:** API keys or secrets in client code

### Medium Severity
- **Information Disclosure:** Error messages revealing internal details
- **Missing Validation:** Unvalidated user input
- **Weak Authorization:** Insufficient permission checks
- **Insecure Dependencies:** Outdated packages with known vulnerabilities

### Low Severity
- **Missing Logging:** Errors not properly logged
- **Verbose Errors:** Too much detail in error messages
- **Missing Headers:** Security headers not configured

## Approval Process

1. **Security Scan:** Run automated security checks
2. **Manual Review:** Examine code for security vulnerabilities
3. **Threat Modeling:** Consider potential attack vectors
4. **Decision:** Approve, request changes, or reject
5. **Documentation:** Document security decisions and rationale

## Escalation

Security concerns ALWAYS take precedence:
- **Architect Council:** Security overrides architectural preferences
- **Quality Council:** Security is more important than convenience
- **Deployment Council:** Security issues must be fixed before deployment

## Security Testing

### Automated Tests Required
- Permission tests for all protected routes
- Validation tests for all user input
- Authentication tests for auth flows
- Error handling tests for security scenarios

### Manual Testing
- Try accessing protected routes without auth
- Attempt to access other users' data
- Submit invalid/malicious input
- Check for information leakage in errors

## Examples

### ✅ Good Security
```typescript
// Proper validation and RBAC
export async function POST(request: NextRequest) {
  try {
    await requirePermission('account:create');
    
    const body = await request.json();
    const result = createAccountSchema.safeParse(body);
    
    if (!result.success) {
      return apiError('Validation failed', 'VALIDATION_ERROR', 400);
    }
    
    const account = await db.insert(accounts).values(result.data);
    logger.info('Account created', { accountId: account.id });
    return new Response(JSON.stringify(account), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Create account error', { error: error.message });
    }
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
```

### ❌ Bad Security
```typescript
// Missing validation, RBAC, and proper error handling
export async function POST(request: NextRequest) {
  const body = await request.json(); // No validation!
  const account = await db.execute(sql`INSERT INTO accounts VALUES (${body.name})`); // SQL injection!
  console.log('Created account:', body); // Logging sensitive data!
  return new Response(JSON.stringify(account)); // No error handling!
}
```

## Contact

For security questions or concerns, refer to:
- `RULES.md` - Security rules and requirements
- `CLAUDE.md` - Security checklists and mandates
- OWASP Top 10 - General security best practices

## Emergency Protocol

If a security vulnerability is discovered:
1. **Stop:** Halt all development on the affected area
2. **Assess:** Evaluate the severity and potential impact
3. **Contain:** Prevent exploitation if possible
4. **Fix:** Implement a secure solution immediately
5. **Test:** Verify the fix with additional security tests
6. **Document:** Record the vulnerability and fix for future reference