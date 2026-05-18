# Code Examples

This directory contains examples demonstrating both **good** and **bad** coding practices for this Next.js + Supabase template.

## Purpose

These examples serve as:
- **Learning resources** for understanding the template's patterns
- **Reference implementations** for common tasks
- **Anti-pattern demonstrations** showing what NOT to do
- **Validation tools** for the AI Council system

## Examples

### ✅ Good Examples

#### `good-api-route.ts`
Demonstrates a production-ready API route with:
- ✅ Proper permission checking with `requirePermission`
- ✅ Zod validation for request bodies
- ✅ Standardized response helpers (`apiError`, `paginatedResponse`)
- ✅ Structured logging with `logger`
- ✅ Proper error handling with `catch (error: unknown)`
- ✅ Type safety throughout
- ✅ Soft deletes instead of hard deletes
- ✅ Authentication checks
- ✅ Multi-tenancy (owner_id filtering)
- ✅ JSDoc documentation

**Use this as a template** when creating new API routes.

### ❌ Bad Examples

#### `bad-api-route.ts`
Demonstrates anti-patterns that violate the template's rules:
- ❌ Missing permission checks
- ❌ No input validation
- ❌ Using `console.log` instead of `logger`
- ❌ Using `error: any` in catch blocks
- ❌ Exposing internal errors to clients
- ❌ SQL injection vulnerability (raw SQL)
- ❌ Missing authentication checks
- ❌ Hard deletes instead of soft deletes
- ❌ No structured logging
- ❌ Missing JSDoc comments

**Never write code like this.** This example exists only to show what to avoid.

## Key Patterns to Follow

### 1. Permission Checking
```typescript
// ✅ GOOD
await requirePermission("account:read");

// ❌ BAD
// No permission check
```

### 2. Input Validation
```typescript
// ✅ GOOD
const result = createAccountSchema.safeParse(body);
if (!result.success) {
  return apiError("Validation failed", "VALIDATION_ERROR", 400);
}

// ❌ BAD
const body = await request.json(); // No validation
```

### 3. Error Handling
```typescript
// ✅ GOOD
try {
  // ... code
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error("Error message", { error: error.message });
  }
  return apiError("Internal server error", "INTERNAL_ERROR", 500);
}

// ❌ BAD
try {
  // ... code
} catch (error: any) {
  console.log(error);
  return new Response(JSON.stringify({ error: error.message }));
}
```

### 4. Logging
```typescript
// ✅ GOOD
logger.info("Account created", { accountId: account.id, actorId: user.id });

// ❌ BAD
console.log("Created account:", account);
```

### 5. Database Operations
```typescript
// ✅ GOOD - Using Drizzle ORM
const accounts = await db.select()
  .from(accounts)
  .where(eq(accounts.ownerId, user.id));

// ❌ BAD - Raw SQL (SQL injection risk)
const accounts = await db.execute(sql`SELECT * FROM accounts WHERE id = ${id}`);
```

### 6. Soft Deletes
```typescript
// ✅ GOOD - Soft delete
await db.update(accounts)
  .set({ isDeleted: true, deletedAt: new Date() })
  .where(eq(accounts.id, id));

// ❌ BAD - Hard delete
await db.delete(accounts).where(eq(accounts.id, id));
```

## Validation Rules Enforced

The validation script (`scripts/validate-rules.js`) checks for these patterns:

### Forbidden Patterns (Will Fail Validation)
- `error: any` in catch blocks
- `console.log()` in production code
- Missing `requirePermission` in API routes
- Missing Zod validation
- Raw SQL instead of Drizzle ORM
- Hard deletes
- Missing error handling

### Required Patterns (Will Pass Validation)
- `catch (error: unknown)` with proper narrowing
- `logger` for all logging
- Standardized response helpers
- Proper error boundaries
- Soft deletes
- Structured error responses

## Using These Examples

### For AI Agents
When the AI Council reviews code:
1. Compare against `good-api-route.ts` for patterns
2. Check for anti-patterns from `bad-api-route.ts`
3. Run validation script to catch violations
4. Provide specific feedback based on these examples

### For Human Developers
When learning the template:
1. Study `good-api-route.ts` as the reference implementation
2. Review `bad-api-route.ts` to understand what to avoid
3. Run the validation script on your code
4. Ask the AI Council if you're unsure about patterns

## Additional Resources

- `RULES.md` - Complete architectural rules
- `CLAUDE.md` - AI agent guidelines and mandates
- `councils/` - Council documentation for each focus area
- `skills/ai-init-project.md` - Bootstrap process with validation

## Contributing

When adding new examples:
1. Ensure they follow all template rules
2. Include comprehensive comments
3. Document both good and bad patterns
4. Update this README
5. Get approval from all AI Councils