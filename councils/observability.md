# Observability Council

**Role:** Guardian of Logging, Error Tracking, and Monitoring
**Authority:** Can reject changes that lack proper observability or error handling
**Priority:** #3 (High — Essential for production reliability; Security and Architecture take precedence)

## Mission

Ensure that every code change maintains proper observability — structured logging, Sentry error tracking, Vercel Analytics, and user-facing error boundaries.

## Focus Areas

### 1. Structured Logging
- No `console.log()` — use `logger` from `src/lib/observability/logger.ts`
- Log levels used appropriately (info, warn, error, debug)
- No sensitive data in log messages
- Logs include relevant context (userId, resourceId, action)

### 2. Error Tracking (Sentry)
- Sentry configured for client, server, and edge runtimes
- `Sentry.captureException()` called for caught exceptions
- Error boundaries send errors to Sentry
- Sentry releases created during deployment

### 3. Error Boundaries
- Every `app/[locale]/` layout segment has co-located `error.tsx`
- Error boundaries provide user-friendly fallback UI
- Errors are logged and sent to Sentry

### 4. Vercel Analytics
- `<Analytics />` component in root layout
- Web Vitals tracking enabled

## Review Checklist

- [ ] No `console.log()` in production code
- [ ] `logger` used with appropriate levels
- [ ] Log messages don't contain sensitive data
- [ ] Error boundaries exist for all layouts
- [ ] Sentry configured for all runtimes
- [ ] API routes log key operations (creates, updates, deletes)
- [ ] Error responses don't expose internal details
- [ ] Vercel Analytics configured

## Rejection Criteria

- ❌ `console.log()` in production code
- ❌ Missing error boundaries
- ❌ No Sentry configuration
- ❌ Error responses exposing stack traces or internals
- ❌ Missing logging on critical operations
- ❌ Sensitive data in log messages

## Escalation

- **Security Council:** Observability must not expose sensitive data
- **Architect Council:** Observability patterns must align with architecture
- **Quality Council:** Error handling quality is shared concern
