# Testing Council

**Role:** Guardian of Test Coverage, Test Quality, and Reliability
**Authority:** Can reject changes with insufficient test coverage, poorly structured tests, or flaky tests
**Priority:** #3 (High — Testing ensures reliability and prevents regressions)

## Mission

Ensure every code change has adequate test coverage, follows proper test structure (arrange-act-assert), covers edge cases and error scenarios, and maintains or improves overall coverage thresholds.

## Focus Areas

### 1. Coverage Thresholds (Non-Negotiable)

| Area | Minimum | Enforcement |
|------|---------|-------------|
| API Routes | 90% | Block merge if below |
| Auth/RBAC | 100% | Block merge if below |
| Database Schemas (structure) | 100% | Block merge if below |
| Overall Project | 70% | Block merge if below |

### 2. Test Locations

Every new feature MUST have tests in the correct location:

```
tests/api/[entity].test.ts        # API route integration tests
tests/db/[entity].test.ts         # Schema shape validation tests
tests/lib/[module].test.ts        # Utility function unit tests
tests/components/[component].test.tsx  # Component tests (optional)
tests/e2e/[workflow].spec.ts      # E2E tests (optional but encouraged)
```

### 3. Test Structure

All tests MUST follow the Arrange-Act-Assert (AAA) pattern:

```typescript
it('creates account with valid data', async () => {
  // Arrange — set up test data and mocks
  // Act — execute the code under test
  // Assert — verify the expected outcome
});
```

### 4. Test Categories Required

For every new API route, tests MUST cover:

- [ ] **Happy Path:** Successful operation with valid data
- [ ] **Validation Errors:** Invalid/missing data returns 400
- [ ] **Permission Errors:** Unauthorized user gets 403
- [ ] **Not Found:** Non-existent resource returns 404
- [ ] **Server Errors:** Database or service failures return 500
- [ ] **Edge Cases:** Empty lists, boundary values, concurrent operations

### 5. Test Naming Convention

```typescript
describe('POST /api/v1/invoices', () => {
  describe('when user has permission', () => {
    it('creates invoice with valid data', () => {});
    it('returns 400 for missing required fields', () => {});
    it('returns 400 for invalid data types', () => {});
  });
  describe('when user lacks permission', () => {
    it('returns 403 Forbidden', () => {});
  });
  describe('when resource not found', () => {
    it('returns 404 for non-existent entity', () => {});
  });
  describe('error handling', () => {
    it('returns 500 on database failure', () => {});
  });
});
```

### 6. Schema Shape Tests

Every new Drizzle table definition MUST have a corresponding schema test verifying:

- All required audit fields are present
- Correct data types for each field
- Primary key is UUID
- Foreign key references are correct

### 7. Test Quality Standards

- No flaky tests: tests must pass consistently (not timing-dependent)
- No test interdependence: each test runs independently
- No mock-heavy tests: mock only external services, test real logic
- No tests without assertions: every test must validate something
- No skipped tests: `it.skip()` requires a documented justification
- Proper async handling: always `await` async operations

## Review Checklist

### Coverage
- [ ] New API routes have corresponding test files in `tests/api/`
- [ ] New schemas have shape tests in `tests/db/`
- [ ] API route coverage meets 90% minimum
- [ ] Auth/RBAC coverage at 100%
- [ ] Overall coverage remains at 70%+

### Test Structure
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] Descriptive test names with `describe`/`it` blocks
- [ ] Tests cover all 5 required scenarios (happy, validation, permission, not found, error)

### Test Quality
- [ ] No flaky tests (consistent results across runs)
- [ ] Tests are independent (no shared state between tests)
- [ ] Proper async handling (no unawaited promises)
- [ ] No tests without assertions
- [ ] No skipped tests without documented justification

### Schema Tests
- [ ] All audit fields verified in schema tests
- [ ] Data types verified
- [ ] Primary key format verified (UUID)
- [ ] Foreign key references verified

## Rejection Criteria

Reject changes that:
- ❌ New API route without corresponding test file
- ❌ New schema table without schema shape test
- ❌ Coverage drops below thresholds (70% overall, 90% API, 100% auth/schemas)
- ❌ Tests that fail intermittently (flaky)
- ❌ Tests without assertions
- ❌ Tests that depend on execution order
- ❌ Skipped tests without documented justification
- ❌ Tests that don't cover the 5 required scenarios for API routes
- ❌ Mock-heavy tests that don't test real behavior

## Escalation

- **Security Council:** Security-critical paths must have 100% coverage
- **Quality Council:** Test quality and code quality are shared concerns
- **Architect Council:** Test structure must align with architectural patterns
- **Deployment Council:** Tests must pass in CI/CD before deployment

## Test Automation

### CI/CD Pipeline Checks
- `npm run test` must pass (GitHub Actions)
- Coverage thresholds enforced in CI
- Pre-push hook runs all tests

### Pre-Commit Validation
- TypeScript type check
- Linting
- Test execution (optional, pre-push is the gate)

## Examples

### Good
```typescript
describe('POST /api/v1/invoices', () => {
  describe('when user has permission', () => {
    it('creates invoice with valid data', async () => {
      // Arrange
      const validData = { amount: '100.00', customerId: mockId };
      const request = createMockRequest(validData);
      vi.mocked(requirePermission).mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([mockInvoice]) }) });

      // Act
      const response = await POST(request);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.amount).toBe('100.00');
    });
  });
});
```

### Bad
```typescript
// Wrong: No structure, no assertions, unclear test name
test('invoice', async () => {
  const res = await fetch('/api/v1/invoices', { method: 'POST' });
  console.log(res.status);
});
```
