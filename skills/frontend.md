# Frontend Skill (Vercel + Supabase Stack)

**Description:** Patterns for components, Tailwind v4, dark mode, state management, and i18n.
**Role:** The Executor

## 1. Component Architecture (Atomic Structure)

Components are organized by complexity level:

```
src/components/
├── ui/           ← Primitives (Button, Input, Card, Modal, Badge, Skeleton)
├── forms/        ← Form components (FormField, FormSelect, FormInput)
├── layout/       ← Layout components (Sidebar, Header, MainContent, Shell)
└── [feature]/    ← Feature-specific components (AccountTable, InvoiceChart)
```

### ui/ — Atomic Primitives
- Stateless, reusable, no business logic
- Accept data via props; emit events via callbacks
- Examples: `Button`, `Input`, `Card`, `Badge`, `Modal`, `DropdownMenu`, `Skeleton`
- Never import from `@/lib/db` or `@/lib/auth`

### forms/ — Form Components
- Use `react-hook-form` + Zod
- Accept the form's `control` or `register` as props
- Handle field-level display, validation errors, labels
- Examples: `FormInput`, `FormSelect`, `FormTextarea`, `FormDatePicker`

### layout/ — Page Structure
- Define the shell of pages (sidebar, header, content area)
- Usually Server Components wrapping children
- Examples: `AuthenticatedLayout`, `DashboardShell`, `PageHeader`

### feature/ — Domain Components
- Business-logic-aware, specific to one domain
- Compose `ui/` primitives and `forms/` components
- Examples: `AccountTable`, `InvoiceChart`, `UserProfileCard`, `ContactTimeline`

### Composition over Configuration

```tsx
// Good — composition with children and slots
<Card>
  <Card.Header>
    <Card.Title>Account Details</Card.Title>
    <Card.Description>View and manage account settings</Card.Description>
  </Card.Header>
  <Card.Content>
    <AccountForm account={account} />
  </Card.Content>
  <Card.Footer>
    <Button variant="primary">Save</Button>
    <Button variant="ghost">Cancel</Button>
  </Card.Footer>
</Card>

// Bad — config object (hard to customize, type-unsafe)
<Card config={{ title: '...', sections: [...], buttons: [...] }} />
```

### Server/Client Boundary

```
Server Component (fetch data)
  ├── Client Component (interactive sub-tree)
  │   ├── Button (ui primitive)
  │   └── FormInput (form component)
  └── Client Component (another interactive section)
      └── Modal (ui primitive)
```

Data flows DOWN as props. Events flow UP as callbacks. Never fetch data in Client Components when a parent Server Component can do it.

---

## 2. Server vs Client Components

- **Default to Server Components:** `export default async function Page()`
- **Use `"use client"` ONLY when:** hooks needed, interactivity, React Query providers, browser APIs
- **Data Fetching:** Server Components fetch directly from Drizzle ORM; Client Components use React Query

## 3. Tailwind CSS v4

This template uses Tailwind CSS v4 with the new `@import` syntax.

### Dark Mode

Use the `.dark` class pattern:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

The `next-themes` provider handles theme toggling. Use `useTheme()` from `next-themes`.

### cn() Utility

Use the `cn()` utility from `@/lib/utils` for conditional class merging:

```tsx
import { cn } from '@/lib/utils';

<div className={cn('base-class', condition && 'conditional-class')}>
```

## 4. State Management

| State Type | Solution |
|-----------|----------|
| Server state (API data) | TanStack Query (`@tanstack/react-query`) |
| Local UI state | React `useState` / `useReducer` |
| Shared UI state | React Context API |
| Form state | `react-hook-form` + Zod resolver |

### React Query Patterns

```typescript
// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['accounts'],
  queryFn: () => fetch('/api/v1/accounts').then(r => r.json()),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => fetch('/api/v1/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
});
```

## 5. Forms

Use `react-hook-form` with Zod schema validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema } from '@/lib/validators/account';
```

## 6. i18n

Use `next-intl` for translations. Messages live in `messages/` directory.

```typescript
import { useTranslations } from 'next-intl';
const t = useTranslations('accounts');
return <h1>{t('title')}</h1>;
```

## Validation Checklist

- [ ] Server Components by default; `"use client"` only when needed
- [ ] Dark mode supported via `.dark:` classes
- [ ] `cn()` utility used for class merging
- [ ] React Query for server state in client components
- [ ] Forms use `react-hook-form` + Zod
- [ ] i18n with `next-intl` for all user-facing text
- [ ] Error boundaries in place
- [ ] Loading states for async operations
