# Data Fetching, Preloading & Change Detection

> **Source of Truth:** This skill defines ALL data fetching, caching, preloading, and change detection rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## IMPORTANT: Custom PreloaderContext is DEPRECATED

The custom `PreloaderContext` has been **replaced by `@tanstack/react-query`**.

**All new code MUST use `@tanstack/react-query`. Do NOT use `PreloaderContext` or `usePreloader`.**

---

## 7.1 React Query Rules

- `PreloaderContext` / `usePreloader` is **DEPRECATED** — all new code MUST use `@tanstack/react-query`.
- `QueryClient` MUST be configured with: `retry: 1`, `refetchOnWindowFocus: false`, default `staleTime: 30000` (30s).
- **Query Keys MUST follow:** `['entityName']` for lists, `['entityName', id]` for single items, `['entityName', { filters }]` for filtered queries. Pagination state MUST be in the query key.
- **staleTime MUST be configured per query:** user data (30s–5min), reference data (30min), real-time data (0).
- **Cache Invalidation:** MUST happen on mutations via `queryClient.invalidateQueries({ queryKey: ['entityName'] })`.
- **Optimistic Updates:** MUST be used for mutations affecting the current user's visible data. Rollback on error.
- **Error States:** EVERY query MUST handle: `isLoading`, `isError`, `error`, `data` (empty + populated).
- **Pagination:** Query key MUST include page/offset so React Query auto-refetches on change.
- **Permission-Aware Fetching:** Components MUST NOT fetch data the current user cannot access. Use the `enabled` option in `useQuery` to conditionally skip queries based on the user's role/permission.

---

## 7.2 Data Fetching Pattern

```tsx
// Query (GET)
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['entity', { filters }],
  queryFn: () => api.list(filters),
  staleTime: 5 * 60 * 1000,
})

// Mutation (POST/PATCH/DELETE)
const mutation = useMutation({
  mutationFn: (data) => api.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entity'] }),
  onError: (err) => handleError(err),
})
```

---

## 5.7 Global Preloading Pattern

### Purpose
On initial app load, preload ALL essential data (up to 100 items per resource) into React Query cache behind a full-screen loading spinner. This eliminates per-page loading skeletons and ensures the app feels instantly responsive after the initial load.

### Component
`AppPreloader` in `components/AppPreloader.tsx` — wraps the app tree inside `QueryProvider`. Uses `useQueryClient.prefetchQuery()` with `Promise.allSettled` to preload all queries in parallel. Shows a centered spinning indicator with `role="status"` until all prefetches settle.

### Rules
- MUST be placed inside `QueryProvider` (needs `queryClient`)
- MUST limit every preload query to 100 items
- MUST use `Promise.allSettled` (fail-soft — app loads even if some preloads fail)
- MUST show a centered spinner with `role="status"` and `aria-label`
- MUST use `staleTime: 30_000` to avoid immediate refetches after spinner hides
- Currently preloads `users.list` and `events.list`. Add new preloads as the app grows.

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

---

## 7.3 Real-Time Change Detection (Polling)

### Mechanism
Frontend polls `GET /api/v1/changes/check?since=<ISO-8601-timestamp>` every 5 seconds via the `useTableChanges` hook.

### `useTableChanges` Hook (`hooks/useTableChanges.ts`)
Manages polling interval, tracks `hasChanges` state, stores `lastCheckedRef` timestamp. Exposes `{ hasChanges, lastTables, acknowledgeChanges, refresh }`.

### `UpdateBanner` Component (`components/UpdateBanner.tsx`)
Fixed-position blue banner at the top of the viewport (`z-50`). Shows "New updates available" message + "Refresh" button + dismiss (X) button. Triggered when `hasChanges` becomes true. Animates in with `slide-down` CSS keyframe.

### Behavior
- **Acknowledge:** Dismissing the banner calls `acknowledgeChanges()` which resets the `lastCheckedRef` timestamp and hides the banner. Future changes will re-trigger it.
- **Refresh:** The Refresh button calls `window.location.reload()` to reload the entire app with fresh data.
- **Silent Errors:** Polling errors are silently ignored (connection may be temporarily down) — the next poll cycle will retry.
- **Accessibility:** Banner has `role="alert"` and `aria-live="polite"`. Refresh button has `aria-label="Refresh"`.

```tsx
// hooks/useTableChanges.ts
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

---

## React Query Setup Example

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
})
```

---

## Hard Rules

1. **EVERY data fetch MUST use `@tanstack/react-query`.** Direct `useEffect` + `fetch` is FORBIDDEN.
2. **The custom `PreloaderContext`/`usePreloader` is DEPRECATED.** Do not use it in new code.
3. **Query keys MUST follow a consistent pattern:** `['entityName']` for lists, `['entityName', id]` for single items.
4. **`staleTime` MUST be configured per query type:** user data (5 min), reference data (30 min), real-time data (0).
5. **Cache invalidation MUST happen on mutations** via `queryClient.invalidateQueries()`.
6. **Optimistic updates MUST be used** for mutations affecting the current user's data.
7. **Error states MUST be handled** in every query: `isLoading`, `isError`, `error`, `data`.
8. **Retry with exponential backoff** is enabled by default (max 3 retries).
9. **`refetchOnWindowFocus` MUST be enabled** for data that changes frequently.
10. **Pagination state MUST be in the query key** to trigger automatic refetches.
11. **Polling interval:** 5 seconds (configurable).
12. **Polling errors MUST be silently ignored** (connection may be down).
13. **The changes endpoint does NOT require auth** (it only reveals that *something* changed, not what).
14. **`table_changes` records MUST be pruned after 7 days** to prevent unbounded growth.
