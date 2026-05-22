# Observability Skill (Vercel + Supabase Stack)

**Description:** Patterns for structured logging, Sentry error tracking, and Vercel Analytics.
**Role:** The Architect / The Reviewer

## 1. Structured Logger

Use `logger` from `src/lib/observability/logger.ts`. Never use `console.log()` in production code.

```typescript
import { logger } from '@/lib/observability/logger';

logger.info('User logged in', { userId: 'abc-123' });
logger.error('Database connection failed', { error: err.message });
logger.warn('Rate limit approaching', { current: 95, limit: 100 });
logger.debug('Query executed', { duration: '2ms', table: 'accounts' });
```

### Logger Levels

| Level | When to Use |
|-------|-------------|
| `debug` | Development-only details |
| `info` | Normal operations (creates, logins) |
| `warn` | Unexpected but handled issues |
| `error` | Failures that need attention |

## 2. Sentry Integration

Sentry is configured in `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`.

### Capturing Errors

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // risky operation
} catch (error: unknown) {
  Sentry.captureException(error);
  logger.error('Operation failed', { error });
}
```

### Error Boundaries

Every `app/[locale]/` layout segment MUST have a co-located `error.tsx`:

```tsx
'use client';
import * as Sentry from '@sentry/nextjs';

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  Sentry.captureException(error);
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## 3. Vercel Analytics

Vercel Analytics is configured via `<Analytics />` and `<SpeedInsights />` components in the root layout. Web Vitals are automatically tracked.

## Validation Checklist

- [ ] No `console.log()` in production code — use `logger`
- [ ] Error boundaries on every layout segment
- [ ] Sentry captures exceptions
- [ ] Structured logging with proper levels
- [ ] Vercel Analytics in root layout
- [ ] No sensitive data in log messages
- [ ] Error messages user-friendly, not exposing internals
