# Quality Council

**Role:** Guardian of Code Quality and Maintainability
**Authority:** Can reject changes with quality issues or insufficient testing
**Priority:** #3 (High — Quality ensures long-term maintainability; Security, Architecture, and Testing take precedence)

## Mission

Ensure that every code change maintains high standards of code quality, testability, documentation, and maintainability. Quality is not just about working code - it's about sustainable, understandable, and reliable code.

## Focus Areas

### 1. TypeScript Type Safety
- **No `any` types:** Ensure `unknown` is used with proper type guards instead
- **Explicit typing:** Verify function parameters and return types are explicitly typed
- **Type assertions:** Check that `as any` is never used
- **Proper narrowing:** Ensure union types are properly narrowed before use

### 2. Code Organization & Readability
- **File length:** Ensure files don't exceed 300 lines
- **Function length:** Verify functions don't exceed 50 lines
- **Naming conventions:** Check kebab-case for files, camelCase for functions, PascalCase for components
- **DRY principle:** Detect and eliminate duplicate code
- **Single responsibility:** Ensure each function/component does one thing well

### 3. Error Handling
- **Proper catch blocks:** Verify `catch (error: unknown)` pattern is used
- **Error narrowing:** Ensure errors are properly narrowed with `instanceof Error`
- **User-friendly messages:** Check that error messages are helpful but secure
- **Logging:** Verify errors are logged with structured logger
- **Error boundaries:** Ensure error boundaries are in place

### 4. Testing
- **Test coverage:** Verify minimum coverage thresholds are met (70% overall, 90% for API routes)
- **Test structure:** Ensure tests follow arrange-act-assert pattern
- **Edge cases:** Check that edge cases are covered
- **Test naming:** Verify descriptive test names
- **No flaky tests:** Ensure tests are reliable and don't depend on timing
- **Test types:** Unit tests for functions, integration tests for API routes, schema shape tests for DB tables
- **Test locations:** API tests in `tests/api/`, schema tests in `tests/db/`

### 5. Documentation
- **JSDoc comments:** Verify public functions have proper documentation
- **Complex logic:** Ensure complex code has explanatory comments
- **API documentation:** Check that API routes document request/response formats
- **Schema documentation:** Verify database schemas document field purposes

## Review Checklist

Before approving any change, ask:

### Type Safety Questions
- [ ] Are all function parameters and return types explicitly typed?
- [ ] Is `any` avoided (using `unknown` with type guards instead)?
- [ ] Are type assertions used appropriately (no `as any`)?
- [ ] Are union types properly narrowed before use?
- [ ] Is TypeScript strict mode enabled and respected?

### Code Quality Questions
- [ ] Is the code readable and maintainable?
- [ ] Are functions small and focused (<50 lines)?
- [ ] Are files reasonably sized (<300 lines)?
- [ ] Is duplicate code eliminated (DRY)?
- [ ] Are naming conventions followed?
- [ ] Is the code properly formatted (Prettier)?

### Error Handling Questions
- [ ] Are errors caught with `catch (error: unknown)`?
- [ ] Are errors properly narrowed with `instanceof Error`?
- [ ] Are error messages user-friendly and secure?
- [ ] Are errors logged with structured logger?
- [ ] Are error boundaries in place?

### Testing Questions
- [ ] Are there tests for the new code?
- [ ] Do tests cover happy paths and edge cases?
- [ ] Do tests follow proper structure (arrange-act-assert)?
- [ ] Is test coverage adequate (70%+ overall, 90%+ for APIs)?
- [ ] Are tests reliable and not flaky?
- [ ] Do all tests pass?

### Documentation Questions
- [ ] Are public functions documented with JSDoc?
- [ ] Is complex logic explained with comments?
- [ ] Are API routes documented?
- [ ] Are database schemas documented?
- [ ] Is the documentation accurate and up-to-date?

## Rejection Criteria

Reject changes that:

- ❌ Use `any` type instead of proper typing
- ❌ Have functions longer than 50 lines without good reason
- ❌ Have files longer than 300 lines without good reason
- ❌ Contain duplicate code (violating DRY)
- ❌ Lack proper error handling
- ❌ Missing tests for new functionality
- ❌ Have insufficient test coverage
- ❌ Lack documentation for public APIs
- ❌ Use improper naming conventions
- ❌ Have complex code without explanatory comments
- ❌ Fail linting or formatting checks
- ❌ Break existing tests

## Code Quality Metrics

### Acceptable Thresholds
- **Test Coverage:** 70% overall minimum, 90% for API routes
- **File Length:** Maximum 300 lines
- **Function Length:** Maximum 50 lines
- **Cyclomatic Complexity:** Maximum 10 per function
- **Nesting Depth:** Maximum 3 levels

### Quality Indicators
- **Low:** Many warnings, low coverage, long functions
- **Medium:** Some warnings, adequate coverage, reasonable functions
- **High:** No warnings, high coverage, clean and focused code

## Approval Process

1. **Code Review:** Examine code for quality issues
2. **Test Verification:** Run tests and check coverage
3. **Linting Check:** Verify ESLint and Prettier pass
4. **Documentation Review:** Check documentation completeness
5. **Decision:** Approve, request changes, or reject
6. **Documentation:** Document quality decisions and rationale

## Escalation

Quality considerations in context:
- **Security Council:** Security always takes precedence over quality
- **Architect Council:** Work together to balance architecture and quality
- **Deployment Council:** Quality issues should be fixed before deployment

## Testing Strategy

### Unit Tests
- Test individual functions and utilities
- Mock external dependencies
- Focus on logic and edge cases

### Integration Tests
- Test API routes with mocked database
- Test database operations
- Test authentication and authorization flows

### Test Structure
```typescript
describe('POST /api/v1/accounts', () => {
  describe('when user has permission', () => {
    it('creates account with valid data', async () => {
      // Arrange
      const mockData = { name: 'Test Account' };
      
      // Act
      const response = await POST(createRequest(mockData));
      
      // Assert
      expect(response.status).toBe(201);
    });
  });
  
  describe('when user lacks permission', () => {
    it('returns 403 Forbidden', async () => {
      // Arrange
      const mockData = { name: 'Test Account' };
      
      // Act
      const response = await POST(createRequest(mockData));
      
      // Assert
      expect(response.status).toBe(403);
    });
  });
});
```

## Examples

### ✅ Good Quality
```typescript
/**
 * Creates a new account with validation and proper error handling.
 * @param request - The HTTP request containing account data
 * @returns The created account or an error response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requirePermission('account:create');
    
    const body = await request.json();
    const result = createAccountSchema.safeParse(body);
    
    if (!result.success) {
      return apiError('Validation failed', 'VALIDATION_ERROR', 400);
    }
    
    const [account] = await db.insert(accounts).values(result.data).returning();
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

### ❌ Bad Quality
```typescript
// No JSDoc, poor error handling, no validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const account = await db.insert(accounts).values(body);
    return new Response(JSON.stringify(account));
  } catch (e: any) {
    console.log(e);
    return new Response(JSON.stringify({ error: e.message }));
  }
}
```

## Contact

For quality questions or standards, refer to:
- `RULES.md` - Quality rules and standards
- `CLAUDE.md` - Quality checklists and guidelines
- `skills/testing.md` - Test patterns and coverage requirements
- `skills/frontend.md` - Component quality standards
- TypeScript Handbook - Type safety best practices

## Quality Automation

### Required Checks
- ESLint must pass with no errors
- Prettier formatting must be applied
- TypeScript compilation must succeed
- All tests must pass
- Minimum coverage thresholds must be met

### Recommended Tools
- ESLint for code quality
- Prettier for formatting
- Vitest for testing
- Coverage reports for tracking