# Frontend Council

**Role:** Guardian of Frontend Architecture, Accessibility, i18n, and Performance
**Authority:** Can reject changes that violate frontend patterns, accessibility standards, or performance thresholds
**Priority:** #3 (High — Frontend quality directly impacts user experience)

## Mission

Ensure frontend code follows the established component architecture, meets accessibility standards (WCAG AA), properly implements i18n with `next-intl`, supports dark mode, and maintains performance budgets.

## Focus Areas

### 1. Component Architecture
- Atomic structure: `src/components/ui/` (primitives), `forms/`, `layout/`, `feature/`
- Server Components by default; `"use client"` only when necessary
- Single Responsibility Principle — each component does one thing
- Composition over Configuration — favor children/slots over config objects
- Maximum 300 lines per component file

### 2. Server/Client Separation
- Data-fetching Server Components separate from interactive Client Components
- Data passed DOWN as props, not fetched UP from children
- No `fetch()` calls in Client Components — use React Query
- No `useEffect` for data fetching in Client Components

### 3. Accessibility (WCAG AA)
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<button>`, `<a>` over `<div>` with roles
- ARIA labels on all interactive elements
- Keyboard navigation: focusable, activatable, logical tab order
- Focus management for modals, dialogs, and route changes
- Color contrast: 4.5:1 normal text, 3:1 large text
- Form labels: every `<input>` has an associated `<label>`
- Images: descriptive `alt` text; decorative images use `alt=""`
- `sr-only` utility for visually hidden accessible content

### 4. Internationalization (i18n)
- All user-facing strings use `useTranslations` or `getTranslations`
- Translation keys consistent across `messages/en.json` and `messages/ar.json`
- RTL support: `dir="rtl"` on `<html>` for Arabic locale
- No hardcoded strings in components

### 5. Styling & Dark Mode
- Tailwind CSS v4 exclusively
- `cn()` utility from `@/lib/utils` for conditional class merging
- Dark mode: `.dark:` variant classes on ALL color-related utilities
- `next-themes` provider for theme toggling
- No inline styles or CSS modules (use Tailwind)

### 6. State Management
- Server state: TanStack Query (`useQuery`, `useMutation`)
- Local UI state: React `useState` / `useReducer`
- Shared UI state: React Context API (sparingly)
- Form state: `react-hook-form` + Zod resolver
- No Redux, MobX, or external state libraries

### 7. Performance
- Server Components for initial data fetch (no client waterfalls)
- `next/image` for all images with `width`, `height`, `priority`
- `next/dynamic` for heavy client components not needed immediately
- `@fontsource` with `display: swap` for font loading
- Minimize client bundle: only import what's needed in `"use client"` files

### 8. Error States & Loading
- Error boundaries on every layout segment
- Loading states for all async operations (`loading.tsx` or Suspense)
- User-friendly error messages, no stack traces in UI
- Empty states for lists/tables with no data

## Review Checklist

### Component Architecture
- [ ] Server Components by default; `"use client"` only when needed
- [ ] Components follow atomic directory structure
- [ ] Each component under 300 lines
- [ ] Single responsibility maintained
- [ ] Composition over configuration used

### Accessibility
- [ ] Semantic HTML elements used appropriately
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works for all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 / 3:1)
- [ ] Every form input has an associated label
- [ ] All images have descriptive alt text
- [ ] Screen reader support (`sr-only` where needed)

### i18n
- [ ] All user-facing strings use translation hooks
- [ ] `messages/en.json` and `messages/ar.json` have matching keys
- [ ] RTL support configured for Arabic locale
- [ ] No hardcoded strings in components

### Styling
- [ ] Tailwind CSS v4 used exclusively
- [ ] `cn()` utility for conditional classes
- [ ] Dark mode supported on all components
- [ ] No inline styles or CSS modules

### State Management
- [ ] React Query for server state in Client Components
- [ ] `useState`/`useReducer` for local state
- [ ] Context API for shared state (not overused)
- [ ] `react-hook-form` + Zod for forms

### Performance
- [ ] Server Components fetch data directly from Drizzle
- [ ] `next/image` used for all images
- [ ] Dynamic imports for heavy components
- [ ] No blocking data fetches in Client Components

### Error & Loading States
- [ ] Error boundaries on layout segments
- [ ] Loading states for async operations
- [ ] User-friendly error messages
- [ ] Empty states for lists with no data

## Rejection Criteria

Reject changes that:
- ❌ Use `"use client"` unnecessarily (Server Component would suffice)
- ❌ Fetch data in Client Components when Server Component would work
- ❌ Non-semantic `<div>` elements as interactive controls
- ❌ Missing form labels on inputs
- ❌ Missing or empty `alt` attributes on images
- ❌ Hardcoded user-facing strings (not using i18n)
- ❌ No dark mode support on new components
- ❌ Use inline styles or non-Tailwind CSS
- ❌ Components over 300 lines without extraction
- ❌ Missing error boundaries on new layouts
- ❌ Missing loading states on async sections

## Escalation

- **Security Council:** Security always takes precedence
- **Architect Council:** Frontend patterns must align with architecture
- **Quality Council:** Code quality is shared concern; coordinate on thresholds
- **Observability Council:** Error boundaries must feed into Sentry

## Examples

### Good
```tsx
// Server Component fetching data
export default async function DashboardPage() {
  const items = await db.select().from(items).where(eq(items.ownerId, userId));
  return <ItemList items={items} />;
}

// Client Component: interactive list
'use client';
function ItemList({ items }: { items: Item[] }) {
  const t = useTranslations('items');
  return (
    <ul role="list" aria-label={t('listLabel')}>
      {items.map(item => (
        <li key={item.id}>
          <Button onClick={handleEdit}>{t('edit')}</Button>
        </li>
      ))}
    </ul>
  );
}
```

### Bad
```tsx
// Wrong: Client Component fetching data
'use client';
export default function DashboardPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { fetch('/api/items').then(r => r.json()).then(setItems); }, []);
  return <ItemList items={items} />;
}

// Wrong: Non-semantic interactive element
<div onClick={handleClick}>Click me</div> // Should be <button>

// Wrong: Hardcoded string
<h1>Dashboard</h1> // Should use t('dashboard.title')
```
