# Frontend Skill (Vercel + Supabase Stack)

**Description:** Patterns for components, Tailwind v4, dark mode, state management, and i18n.
**Role:** The Executor

## 1. Server vs Client Components

- **Default to Server Components:** `export default async function Page()`
- **Use `"use client"` ONLY when:** hooks needed, interactivity, React Query providers, browser APIs
- **Data Fetching:** Server Components fetch directly from Drizzle ORM; Client Components use React Query

## 2. Tailwind CSS v4

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

## 3. State Management

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

## 4. Forms

Use `react-hook-form` with Zod schema validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema } from '@/lib/validators/account';
```

## 5. i18n

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
