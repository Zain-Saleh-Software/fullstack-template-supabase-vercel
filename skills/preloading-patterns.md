# Data Fetching & Caching Patterns

> **MANDATORY:** ALL rules in `RULES.md` apply. This skill supplements, never overrides, `RULES.md`.
> Every PR, commit, and deployment MUST comply with `RULES.md`. Deviations require an ADR.

## IMPORTANT: Custom PreloaderContext is DEPRECATED

The custom `PreloaderContext` has been **replaced by `@tanstack/react-query`** per RULES.md section 16.2.

**Reason:** The custom preloader had:
- Race conditions on concurrent loads
- Infinite re-fetch bugs (inline `fetcher` in dependency arrays)
- `forceUpdate` anti-pattern (counter state)
- No caching strategy, no deduplication, no retry logic
- Used only in one place (Dashboard) — significant complexity for no benefit

**All new code MUST use `@tanstack/react-query`. Do NOT use `PreloaderContext` or `usePreloader`.**

## How It Works (React Query)

React Query provides:
- Automatic caching with configurable `staleTime`
- Request deduplication (concurrent same-key requests share one fetch)
- Automatic retry with exponential backoff
- Background refetching (refetchOnWindowFocus, refetchOnReconnect)
- Optimistic updates for mutations
- Cache invalidation on mutations

## Usage

### Setting up QueryClient (in App.tsx or main.tsx)
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min default stale time
      retry: 3,                         // retry 3 times on failure
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),  // exponential backoff
      refetchOnWindowFocus: true,       // refetch when user returns to tab
      refetchOnReconnect: true,         // refetch on network recovery
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        ...
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

### Fetching data in components (replaces usePreload)
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'

function UsersPage() {
  const queryClient = useQueryClient()

  // Auto-fetches, caches, deduplicates, retries
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
    staleTime: 5 * 60 * 1000,   // 5 min
  })

  // Mutation with automatic cache invalidation
  const createUser = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })  // Refetch users list
    },
  })

  if (isLoading) return <Loading />
  if (error) return <Error message={error.message} />
  return <UserList users={users} />
}
```

### Preloading data eagerly (on app startup or navigation)
```tsx
import { useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'

function AppContent() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Prefetch users so they're in cache when the component mounts
    queryClient.prefetchQuery({
      queryKey: ['users'],
      queryFn: () => usersApi.list(),
      staleTime: 5 * 60 * 1000,
    })
  }, [])

  return <Router />
}
```

### Global Preloading with AppPreloader (limit=100)
A full-screen loading spinner that preloads ALL essential data before the app renders.

```tsx
// components/AppPreloader.tsx
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function AppPreloader({ children }) {
  const queryClient = useQueryClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const preload = async () => {
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ['users', 'list'],
          queryFn: () => usersApi.list(),
          staleTime: 30_000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['events', 'list', { limit: 100 }],
          queryFn: async () => {
            const { data } = await api.get('/events', { params: { limit: 100 } })
            return data
          },
          staleTime: 30_000,
        }),
      ])
      if (!cancelled) setReady(true)
    }
    preload()
    return () => { cancelled = true }
  }, [queryClient])

  if (!ready) return <FullScreenSpinner />
  return <>{children}</>
}
```

**Rules:**
- MUST be placed inside `QueryProvider` (needs `queryClient`)
- MUST limit every preload query to 100 items
- MUST use `Promise.allSettled` (fail-soft — app loads even if some preloads fail)
- MUST show a centered spinner with `role="status"` and `aria-label`
- MUST use `staleTime: 30_000` to avoid immediate refetches after spinner hides

### Pagination
```tsx
function UsersPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],         // page in queryKey = auto-refetch on page change
    queryFn: () => usersApi.list({ limit: 20, offset: (page - 1) * 20 }),
    staleTime: 2 * 60 * 1000,
  })

  return (
    <>
      <UserList users={data?.data ?? []} />
      <Pagination page={page} total={data?.total} onPageChange={setPage} />
    </>
  )
}
```

### Optimistic updates (for mutations)
```tsx
const updateUser = useMutation({
  mutationFn: ({ id, data }) => usersApi.update(id, data),
  onMutate: async ({ id, data }) => {
    await queryClient.cancelQueries({ queryKey: ['users'] })
    const previous = queryClient.getQueryData(['users'])
    queryClient.setQueryData(['users'], (old) =>
      old?.map(u => u.id === id ? { ...u, ...data } : u)
    )
    return { previous }
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['users'], context.previous)  // rollback
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })  // refetch
  },
})
```

## Real-Time Change Detection (Database Triggers + Polling)

The frontend detects database changes (INSERT/UPDATE/DELETE) by polling the `GET /api/v1/changes/check?since=<timestamp>` endpoint.

**Backend:**
1. Database triggers on `users`, `roles`, `permissions`, `events` insert rows into `table_changes` log table
2. The `changes/check` endpoint queries `table_changes` for records since the given timestamp

**Frontend:**
1. `useTableChanges` hook polls every 5 seconds
2. When `has_changes` is true, `UpdateBanner` appears at the top of the viewport
3. User can click "Refresh" to reload the page or "Dismiss" to acknowledge

```tsx
// hooks/useTableChanges.ts — simplified
function useTableChanges() {
  const [hasChanges, setHasChanges] = useState(false)
  const lastCheckedRef = useRef(new Date().toISOString())

  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await changesApi.check(lastCheckedRef.current)
      if (result.has_changes) setHasChanges(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const acknowledgeChanges = () => {
    lastCheckedRef.current = new Date().toISOString()
    setHasChanges(false)
  }

  return { hasChanges, acknowledgeChanges, refresh: () => window.location.reload() }
}
```

**Rules:**
- Polling interval: 5 seconds (configurable)
- Polling errors MUST be silently ignored (connection may be down)
- The changes endpoint does NOT require auth (it only reveals that *something* changed, not what)
- `table_changes` records MUST be pruned after 7 days to prevent unbounded growth

## Rules
1. **EVERY data fetch MUST use `@tanstack/react-query`.** Direct `useEffect` + `fetch` is FORBIDDEN.
2. **The custom `PreloaderContext`/`usePreloader` is DEPRECATED.** Do not use it in new code. Migrate existing usage.
3. **Query keys MUST follow a consistent pattern:** `['entityName']` for lists, `['entityName', id]` for single items.
4. **`staleTime` MUST be configured per query type:** user data (5 min), reference data (30 min), real-time data (0).
5. **Cache invalidation MUST happen on mutations** via `queryClient.invalidateQueries()`.
6. **Optimistic updates MUST be used** for mutations affecting the current user's data.
7. **Error states MUST be handled** in every query: `isLoading`, `isError`, `error`, `data`.
8. **Retry with exponential backoff** is enabled by default (max 3 retries).
9. **`refetchOnWindowFocus` MUST be enabled** for data that changes frequently.
10. **Pagination state MUST be in the query key** to trigger automatic refetches.

## Migration Guide (from PreloaderContext to React Query)

| Old Pattern | New Pattern |
|------------|-------------|
| `usePreload('key', fetcher)` | `useQuery({ queryKey: ['key'], queryFn: fetcher })` |
| `preload('key', fetcher)` | `queryClient.prefetchQuery({ queryKey: ['key'], queryFn: fetcher })` |
| `reload()` | `refetch()` |
| `get('key')` | `queryClient.getQueryData(['key'])` |
| After mutation: `reload()` | After mutation: `queryClient.invalidateQueries({ queryKey: ['key'] })` |
