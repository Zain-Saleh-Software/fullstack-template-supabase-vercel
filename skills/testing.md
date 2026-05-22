# Testing Skill (Vercel + Supabase Stack)

**Description:** Patterns for unit, integration, and E2E tests using Vitest.
**Role:** The Reviewer / The Executor

## 1. Test Structure

Every new API route MUST have a corresponding test in `tests/api/`.
Every new Drizzle schema table MUST have a schema-shape test in `tests/db/`.

### API Route Tests

```typescript
// tests/api/accounts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('POST /api/v1/accounts', () => {
  describe('when user has permission', () => {
    it('creates account with valid data', async () => {
      // Arrange
      const mockData = { name: 'Test Account' };

      // Act
      const response = await POST(createRequest(mockData));
      const body = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.name).toBe('Test Account');
    });

    it('returns 400 for invalid data', async () => {
      const response = await POST(createRequest({}));
      expect(response.status).toBe(400);
    });
  });

  describe('when user lacks permission', () => {
    it('returns 403 Forbidden', async () => {
      vi.mocked(requirePermission).mockRejectedValue(new Error('Forbidden'));
      const response = await POST(createRequest({ name: 'Test' }));
      expect(response.status).toBe(403);
    });
  });
});
```

### Schema Tests

```typescript
// tests/db/accounts.test.ts
import { describe, it, expect } from 'vitest';
import { accounts } from '@/lib/db/schema';

describe('accounts schema', () => {
  it('has all required audit fields', () => {
    const columns = Object.keys(accounts);
    expect(columns).toContain('id');
    expect(columns).toContain('owner_id');
    expect(columns).toContain('is_deleted');
    expect(columns).toContain('deleted_at');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
    expect(columns).toContain('is_active');
  });
});
```

## 2. Coverage Requirements

| Area | Minimum Coverage |
|------|-----------------|
| API routes | 90% |
| Database schemas | 100% (structure) |
| Auth/RBAC | 100% |
| Overall | 70% |

## 3. Test Categories

- **Unit Tests:** Individual functions and utilities (fast, no DB)
- **Integration Tests:** API routes with mocked database
- **E2E Tests:** Critical user workflows (optional but encouraged)

## 4. Test Naming

```typescript
describe('POST /api/v1/accounts', () => {
  describe('when user has permission', () => {
    it('creates account with valid data', () => {});
    it('returns 400 for missing required fields', () => {});
  });
  describe('when user lacks permission', () => {
    it('returns 403', () => {});
  });
  describe('error handling', () => {
    it('returns 500 on database failure', () => {});
  });
});
```

## Validation Checklist

- [ ] Tests for all new API routes in `tests/api/`
- [ ] Schema shape tests in `tests/db/`
- [ ] Tests cover happy path, validation errors, permission errors, and server errors
- [ ] No mock-heavy tests (test real behavior where possible)
- [ ] No flaky tests (proper async handling)
- [ ] `npm run test` passes
- [ ] Coverage meets thresholds
