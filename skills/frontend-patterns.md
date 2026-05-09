# Frontend Patterns

> **MANDATORY:** ALL rules in `RULES.md` apply. This skill supplements, never overrides, `RULES.md`.
> Every PR, commit, and deployment MUST comply with `RULES.md`. Deviations require an ADR.

## Structure
```
src/
  api/          # Axios client + API modules (one per backend resource)
  components/
    Layout/     # LayoutWrapper (RTL/LTR), Header, Footer
    ui/         # Reusable UI primitives (Button, Input, etc.)
    auth/       # ProtectedRoute
    rbac/       # RoleGuard, PermissionGate, UserRoleBadge
  contexts/     # AuthContext, LocaleContext (NOT PreloaderContext — use React Query)
  hooks/        # useAuth, useLocale, useRBAC
  pages/        # Page components (one per route)
  types/        # TypeScript interfaces
  i18n/         # Translation JSON files (en, ar)
  utils/        # Constants, helpers
  tests/        # Frontend tests (factories, unit, integration)
```

## Hard Rules

### State Management
- **Server state MUST use `@tanstack/react-query`.** Custom preloader/cache implementations FORBIDDEN.
- **Auth state MUST use `AuthContext`.** Direct `localStorage` reads in components FORBIDDEN.
- **Form state MUST use `react-hook-form` + `zod`.** Manual `useState` for forms FORBIDDEN.
- **URL state MUST use `react-router-dom` hooks** (`useSearchParams`, `useParams`).

### Component Quality
- Every file MUST be PascalCase matching the default export.
- Components MUST be co-located with their tests.
- `React.memo()` for frequently rendered components with same props.
- `useCallback`/`useMemo` for callbacks/values passed to memoized children.
- Class components FORBIDDEN except `ErrorBoundary`.

### Accessibility (WCAG AA minimum)
- ALL form inputs MUST have `<label>` with `htmlFor`.
- ALL images MUST have `alt` attributes.
- Loading spinners MUST have `role="status"` and `aria-label`.
- Error messages MUST have `role="alert"`.
- Color MUST NOT be the sole means of conveying information (WCAG 1.4.1).
- Color contrast MUST meet 4.5:1 for normal text, 3:1 for large text.
- Interactive elements MUST be keyboard navigable.

### SEO
- Every page MUST set a unique `document.title` via `react-helmet-async`.
- Meta descriptions MUST exist for public pages.
- Canonical URLs MUST prevent duplicate content.
- Structured data (JSON-LD) for public pages.

### i18n
- ALL user-facing strings MUST use `t()` from `useLocale`. Hardcoded strings FORBIDDEN.
- Translation files MUST be complete (every key in `en.json` MUST exist in `ar.json`).
- RTL layouts MUST be tested with Arabic content before release.

### CSS & Styling
- Class names MUST use `clsx` + `tailwind-merge` for safe composition. Template literal concatenation FORBIDDEN.
- Tailwind CSS is the ONLY styling framework. Bootstrap, styled-components, CSS modules are FORBIDDEN.
- Fonts MUST be self-hosted via `@fontsource/inter` and `@fontsource/cairo` and preloaded with `<link rel="preload">`.

## Rules for Every New Feature
1. **Types** — Add TypeScript interfaces in `types/{feature}.ts`
2. **API** — Add API calls in `api/{feature}.ts`
3. **Data Fetching** — Use `useQuery` / `useMutation` from `@tanstack/react-query` (NOT `usePreload`)
4. **Page** — Create page component in `pages/`
5. **Route** — Add route in `App.tsx` (lazy-loaded with `React.lazy()` + `Suspense`)
6. **i18n** — Add translation keys in both `en.json` and `ar.json`
7. **Tests** — Add factory, unit tests, and integration tests (minimum 70% coverage)
8. **RBAC** — Use `PermissionGate` (preferred) or `RoleGuard` for access control
9. **Accessibility** — Verify keyboard navigation, screen reader support, color contrast
10. **SEO** — Set document title, meta description

## RTL/LTR Layout
```tsx
// LocaleContext wraps everything with dir + lang attributes
<LocaleProvider>
  <div dir={direction} lang={locale}>
    {children}
  </div>
</LocaleProvider>
```

The LayoutWrapper component mirrors ALL children automatically when locale changes.

## Data Fetching (React Query)
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function UsersPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
    staleTime: 5 * 60 * 1000,
  })

  const createUser = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  if (isLoading) return <Loading />
  return <UserList users={data} />
}
```

## RBAC Components
```tsx
// Only show for specific roles
<RoleGuard roles={['admin', 'technician']}>
  <AdminPanel />
</RoleGuard>

// Only show if user has specific permission (PREFERRED)
<PermissionGate permission="content:create">
  <CreateButton />
</PermissionGate>

// Show user role badge
<UserRoleBadge />
```

## Error Handling
- Wrap the app tree with `ErrorBoundary` at the outermost level.
- Use `react-error-boundary` for function-component-friendly error boundaries with reset capabilities.
- Every page MUST handle: loading, empty, error, and success states.
- Network errors use exponential backoff retry (handled by React Query and Axios interceptor).
