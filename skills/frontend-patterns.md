# Frontend Architecture & Patterns

> **Source of Truth:** This skill defines ALL frontend rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 5.1 Directory Structure (Mandatory)

```
src/
  api/             # Axios client + API modules (one per backend resource)
  components/
    Layout/        # LayoutWrapper, Header, Footer
    ui/            # Reusable UI primitives (Button, Input, Skeleton, ThemeToggle)
    auth/          # ProtectedRoute
    rbac/          # RoleGuard, PermissionGate, UserRoleBadge
  contexts/        # AuthContext, LocaleContext, ThemeContext (NOT PreloaderContext — deprecated)
  hooks/           # useAuth, useLocale, useTheme, custom query hooks
  pages/           # Page components (one per route, lazy-loaded)
  types/           # TypeScript interfaces (index.ts, api.ts, user.ts, role.ts)
  i18n/            # Translation JSON files (en.json, ar.json)
  utils/           # Constants, helpers
  tests/           # Factories, unit tests, integration tests
```

---

## 5.2 State Management

- **Server State:** Use `@tanstack/react-query` EXCLUSIVELY. Custom preloading/caching (`PreloaderContext`, `usePreloader`) is FORBIDDEN.
- **Auth State:** Use `AuthContext`. Do NOT read `localStorage` directly in components.
- **Form State:** Use `react-hook-form` + `zod`. Manual `useState` for forms is FORBIDDEN.
- **URL State:** Use `react-router-dom` hooks (`useSearchParams`, `useParams`).

---

## 5.3 Routing & Code Splitting

- All page components MUST be lazy-loaded with `React.lazy()` + `Suspense`.
- Suspense fallback MUST use the `Skeleton` component (not a plain "Loading..." text).
- Routes are defined in `App.tsx` with `react-router-dom` `Routes`/`Route`.
- Protected routes use `<ProtectedRoute>` wrapper component.
- Layout is applied via `<LayoutWrapper>` wrapping `<Outlet>` or route children.

---

## 5.4 File & Component Conventions

- **PascalCase:** Component file names MUST match their default export name.
- **Co-location:** Tests MUST be co-located with the component they test.
- **Class Components:** FORBIDDEN except for `ErrorBoundary` (which MUST be a class component).
- **Page Component Pattern:** Each entity creates 3 page components (List, Detail, Form). List renders a table with search/pagination/delete; Detail shows metadata + edit/delete actions; Form is a controlled form with submit/cancel. Junction tables use only List + Form (no Detail, no Edit).
- **React.memo:** Use for frequently rendered components with same props.
- **useCallback/useMemo:** Use for callbacks and values passed to memoized children.
- **Default Exports:** Every page and component MUST use default export.

---

## 5.5 Axios Client Rules

- **Base Configuration:** Create Axios instance with `baseURL` from `VITE_API_BASE_URL`, timeout 30s.
- **Request Interceptor:** Attach `Bearer` token from `localStorage` on every request.
- **Response Interceptor (401):** Attempt token refresh with deduplication (`refreshPromise` pattern — only one refresh at a time). On success, update stored tokens and retry original request. On failure, clear tokens and redirect to `/login`.
- **Network Retry:** Retry on network error with exponential backoff (max 3 attempts, delay: `min(1000 * 2^attempt, 10000)`).
- **Skip Auth:** Support `skipAuth` option in request config for public endpoints.
- **POST Body:** Axios MUST NOT be called with `undefined` body (e.g., `api.post(url)`). Always pass `{}` as body for POST requests with no payload, otherwise Axios omits the `Content-Type` header and the backend's content-type validation middleware rejects the request with 415.

---

## 5.6 CSS & Styling

- **Tailwind CSS** is the ONLY styling framework. Bootstrap, styled-components, CSS modules are FORBIDDEN.
- **Class Composition:** Use `clsx` + `tailwind-merge` for safe class composition. Template literal concatenation is FORBIDDEN.
- **Fonts:** MUST be self-hosted via `@fontsource/inter` (LTR) and `@fontsource/cairo` (RTL). Preloaded with `<link rel="preload">`.
- Base styles (Tailwind directives, CSS variables for fonts, body font-family) in `index.css`.
- **Dark Mode:** MUST use Tailwind's `class`-based dark mode strategy (`darkMode: 'class'` in tailwind.config.js). The `dark` class is toggled on `<html>` via `ThemeContext`. ALL components MUST include `dark:` variants for every color class (background, text, border, shadow, hover states).
- **Theme Context:** `ThemeContext` manages `theme` state (`'light' | 'dark' | 'system'`), persists choice to localStorage, and applies the `dark` class to `<html>`. System preference is detected via `prefers-color-scheme` media query.
- **Theme Toggle:** A `ThemeToggle` component MUST be placed in the Header, rendering a sun icon in dark mode and moon icon in light mode. It calls `toggleTheme()` from `useTheme()`.
- **Flash Prevention:** Theme MUST be applied synchronously in `main.tsx` (before React renders) by reading localStorage and/or `prefers-color-scheme` and adding `dark` class to `<html>`.

---

## 5.7 TypeScript Types Structure

- `types/index.ts`: Shared types — `Locale` (`'en'|'ar'`), `Direction` (`'ltr'|'rtl'`), `Theme` (`'light'|'dark'|'system'`), `Preloadable<T>` (deprecated), `PaginatedResponse<T>`, `ApiError`.
- `types/api.ts`: `ApiConfig` (baseURL, timeout, headers), `RequestOptions` (extends AxiosRequestConfig with skipAuth).
- `types/user.ts`: `User`, `LoginRequest`, `RegisterRequest`, `AuthResponse`.
- `types/role.ts`: `RoleType`, `PermissionType` (union of all permissions), `ROLE_PERMISSIONS` mapping, `hasPermission()`, `hasRole()` helpers.
- Every new feature MUST add a dedicated types file (`types/{feature}.ts`).
- Feature types follow the backend response shape: `{ id, ...fields, created_at, updated_at }`. Entity-specific enums (e.g., `ArticleStatus`, `CampaignStatus`) are co-located in the types file.

---

## 6. Component Design & Patterns

### 6.1 Button
- **Imports:** `forwardRef`, `memo` from React. `clsx` + `tailwind-merge` for class composition.
- **Variants:** `primary` (solid blue), `secondary` (outline), `danger` (red), `ghost` (transparent).
- **Sizes:** `sm`, `md` (default), `lg`.
- **States:** Normal, hover, focus (ring), disabled (opacity + cursor-not-allowed), loading (spinner + disabled).
- **Loading:** Show spinner SVG, disable interaction, `aria-busy="true"`.
- **Accessibility:** Focus ring, `aria-label` for icon-only buttons.

### 6.2 Input
- **Imports:** `forwardRef`, `memo`.
- **Props:** `label`, `error`, `helperText`, plus all standard input props.
- **Error State:** Show error message with `role="alert"`, set `aria-invalid="true"`, `aria-describedby` pointing to error element.
- **Label:** Always render `<label>` with `htmlFor` matching input `id`.

### 6.3 Skeleton
- **Generic:** `animate-pulse` div with configurable `className` for width/height.
- **SkeletonTable:** Grid of skeleton rows/columns for table loading state.
- **SkeletonCard:** Card-shaped skeleton for card loading state.
- **Accessibility:** `role="status"`, `aria-label="Loading..."`.

### 6.4 ProtectedRoute
- **Behavior:** Check `isAuthenticated` from `useAuth()`. If loading, show `<Skeleton>` spinner. If not authenticated, redirect to `/login?return={currentPath}`. If authenticated, render `<Outlet>` or children.
- **Usage:** Wraps route element in `App.tsx`.

### 6.5 ThemeToggle
- **Imports:** `memo` from React, `useTheme` hook.
- **Variant:** Renders sun icon (in dark mode) or moon icon (in light mode) as inline SVGs.
- **Behavior:** Calls `toggleTheme()` which switches between light and dark (bypassing system).
- **Accessibility:** `aria-label` with descriptive text like "Switch to light mode".
- **Placement:** MUST be rendered in the Header next to the locale toggle (before it).
- **Styling:** Circular icon button with border matching locale toggle style.

### 6.6 Layout Components
- **LayoutWrapper:** Full `flex-col` min-h-screen layout. Children in `<main>` with `max-w-7xl mx-auto`. Wraps with `LocaleProvider`.
- **Header:** Memoized. Contains theme toggle, locale toggle (en/ar), logo/home link, dashboard link (if authenticated), login/logout buttons, user display name.
- **Footer:** Memoized. Contains copyright, privacy link, terms link.

### 6.7 ErrorBoundary
- MUST be a class component (ONLY exception to class component rule).
- MUST wrap the entire app tree at the outermost level.
- Fallback UI: Error message + "Reload" button.
- Catches: rendering errors, lifecycle errors, async errors in components.

---

## 7.4 Auth Context Pattern

- Two contexts: `AuthStateContext` (user, loading, isAuthenticated) and `AuthActionsContext` (login, register, logout).
- On mount: try `authApi.me()` with stored token to restore session.
- Login/register: store tokens in `localStorage`, set user in context.
- Logout: clear tokens from `localStorage`, clear user, redirect to `/login`.
- `useAuth()` hook combines both contexts into a single consumer.
- Auth context wraps the entire app above route definitions.

---

## 7.5 Theme Context Pattern

- **State:** `theme` ('light'|'dark'|'system'), `resolvedTheme` (always 'light'|'dark').
- **Initialization:** Reads from localStorage first, falls back to 'system'.
- **System detection:** Uses `window.matchMedia('(prefers-color-scheme: dark)')` and listens for changes when theme is 'system'.
- **Application:** Toggles `dark` class on `document.documentElement` based on resolved theme.
- **Persistence:** Theme choice is saved to localStorage under `STORAGE_KEYS.THEME`.
- **Flash prevention:** `main.tsx` MUST read localStorage and apply the `dark` class before `ReactDOM.createRoot()` is called.
- **Placement:** `ThemeProvider` wraps `LocaleProvider` in the provider hierarchy (outermost provider after `BrowserRouter`).
- **`useTheme()` hook:** Returns `{ theme, resolvedTheme, setTheme, toggleTheme }`. Throws if used outside ThemeProvider.

## 7.6 Locale Context Pattern

- State: `locale` ('en'|'ar'), `direction` ('ltr'|'rtl'), `translations` (loaded JSON).
- Translations: dynamically imported JSON files on locale change.
- Document: sets `lang` attribute on `<html>` to locale, `dir` attribute to direction.
- Persistence: locale saved to `localStorage`.
- `t()` function: translation lookup with key fallback (returns key if not found).
- Show loading spinner while translations load asynchronously.

---

## 7.7 Form Validation Pattern (Blur-based)  

- **No react-hook-form for CRUD forms:** Entity forms (ContactForm, AccountForm) MUST use manual `useState` for form state with a dedicated `validateField(field, value)` function per field.
- **Per-field validation on blur:** Each input MUST call `handleBlur(field)` on `onBlur` which validates that single field and sets its error state. This provides immediate feedback without waiting for form submission.
- **Touched tracking:** Maintain a `touched: Set<string>` state. Errors MUST only display after a field has been blurred (i.e., `touched.has(field) && errors[field]`).
- **Re-validate on change for touched fields:** When a field's value changes (via `onChange`), if the field is already in the `touched` set, re-validate it immediately.
- **Submit validates all:** On form submission, ALL fields MUST be added to the `touched` set and the full `validateAll()` function MUST run. Block submission if any errors exist.
- **Validation functions:** Each field type has a dedicated validation function (e.g., `validateString`, `validateEmail`, `validatePhoneNumber`) that returns a string error or `null`.
- **Error display:** Errors appear below the input in a `<p className="mt-1 text-sm text-red-600">`. The input itself shows `border-red-500 bg-red-50` when in error state.
- **Accessibility:** Error messages MUST have `role="alert"`. Inputs MUST have `aria-invalid` when in error state.

## 7.8 Optimistic Updates & Stale Data Pattern

- **No stale refresh banner for own mutations:** When the user performs a mutation (create/update/delete), the UI MUST update immediately without showing a "refresh" banner.
- **`acknowledgeUserChanges()`:** Every mutation hook (useCreate*, useUpdate*, useDelete*) MUST call `acknowledgeUserChanges()` in its `onSuccess` callback. This function resets the polling timestamp so the user's own database changes are not reported as "stale data" on the next poll cycle.
- **Module-level registration:** `useTableChanges` registers its `acknowledgeChanges` callback globally via `setAcknowledgeChanges()` in a `useEffect`. The `acknowledgeUserChanges()` exported function calls this registered callback (no-op if unmounted).
- **Stale data banner (external changes only):** The `UpdateBanner` component (`useTableChanges` hook) polls `GET /changes/check` every 5 seconds. Changes made by OTHER users or external processes trigger the banner; changes made by the current user are acknowledged immediately.
- **Implementation:** All mutations invalidate their React Query caches (`queryClient.invalidateQueries`) AND call `acknowledgeUserChanges()` in `onSuccess`.

## 7.9 Foreign Key Selection Pattern

- **Dropdown for FK fields:** Foreign key fields (e.g., `account_id` on ContactForm) MUST NOT be raw text inputs. Instead, use a `<select>` populated from the referenced entity's list query (e.g., `useAccountsList`).
- **Context-based prefill:** When a FK value is available from context (e.g., `?account_id=` search param from Account Detail page), render the field as a hidden `<input type="hidden">` instead of a dropdown. This prevents unnecessary queries and keeps the form clean.
- **Edit mode:** In edit mode, the FK is always a hidden input since the relationship is already established and should not be changed.
- **Error state:** The FK dropdown/field uses the same `inputClass()` + `showError()` pattern as other fields for consistent validation.

---

- ALL user-facing strings MUST use `t()` from `useLocale`. Hardcoded strings are FORBIDDEN.
- Translation files MUST be complete — every key in `en.json` MUST exist in `ar.json`.
- New features MUST add translation keys in BOTH `en.json` AND `ar.json`.
- RTL layouts MUST be tested with Arabic content before release.
- Locale MUST be persisted in `localStorage`.
- Use logical CSS properties (margin-inline-start, padding-inline-end, etc.) for RTL support.

---

## 8.2 Accessibility — WCAG AA Minimum

- ALL form inputs MUST have `<label>` with `htmlFor`.
- ALL images MUST have `alt` attributes.
- Loading states MUST have `role="status"` and `aria-label`.
- Error messages MUST have `role="alert"`.
- Color MUST NOT be the sole means of conveying information (WCAG 1.4.1).
- Color contrast MUST meet 4.5:1 for normal text, 3:1 for large text.
- Interactive elements MUST be keyboard navigable.
- Focus states MUST be visible (focus ring on all interactive elements).
- `aria-busy` on loading buttons, `aria-invalid` on errored inputs, `aria-describedby` linking errors to inputs.

---

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

### CSS & Styling
- Class names MUST use `clsx` + `tailwind-merge` for safe composition. Template literal concatenation FORBIDDEN.
- Tailwind CSS is the ONLY styling framework. Bootstrap, styled-components, CSS modules are FORBIDDEN.
- Fonts MUST be self-hosted via `@fontsource/inter` and `@fontsource/cairo` and preloaded with `<link rel="preload">`.
- Dark mode MUST use Tailwind's `class` strategy with `dark:` variants on ALL color classes. EVERY component MUST support both light and dark themes. Missing `dark:` variants on background, text, border, or shadow classes is a VIOLATION.
- `ThemeContext` MUST wrap `LocaleProvider` in the provider hierarchy. Theme MUST be applied synchronously before first render to prevent flash of unstyled theme.

## Rules for Every New Feature
1. **Types** — Add TypeScript interfaces in `types/{feature}.ts` (include status/type constants)
2. **API** — Add API calls in `api/{feature}.ts` with `list`, `getById`, `create`, `update`, `delete`
3. **Data Fetching** — Use `useQuery` / `useMutation` from `@tanstack/react-query` (NOT `usePreload`)
4. **Page** — Create page component in `pages/{feature}/` (List.tsx, Detail.tsx, Form.tsx for main entities; List.tsx + Form.tsx for junction tables)
5. **Route** — Add route in `App.tsx` (lazy-loaded with `React.lazy()` + `Suspense` + `ProtectedRoute`)
6. **Nav** — Add navigation link in `components/Layout/Header.tsx`
7. **i18n** — Add translation keys in both `en.json` and `ar.json`
8. **Tests** — Add factory, unit tests, and integration tests (minimum 70% coverage)
9. **RBAC** — Use `PermissionGate` (preferred) or `RoleGuard` for access control
10. **Accessibility** — Verify keyboard navigation, screen reader support, color contrast
11. **SEO** — Set document title, meta description
12. **Status Badges** — Use inline `statusBadge()` helper with color maps for status display (see KbArticleList for example)
13. **Pagination** — Use `<Pagination>` component with `PAGE_SIZE` constant; access `data?.total ?? 0` from list responses
14. **Form Validation** — ALL forms MUST implement per-field blur validation (see §7.6). Each field validates on `onBlur`, shows errors only after touched. Submit validates all fields.
15. **Optimistic Updates** — ALL mutation hooks MUST call `acknowledgeUserChanges()` in `onSuccess` to prevent stale-data banners for the user's own changes (see §7.7).
16. **FK Dropdowns** — Foreign key fields MUST use dropdown selectors populated from the referenced entity's list query, NOT raw text inputs (see §7.8).
