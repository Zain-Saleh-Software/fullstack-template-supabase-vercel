# Performance & Resource Management

> **Source of Truth:** This skill defines ALL performance rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 9.1 Memory & CPU

- **Streaming:** Large JSON responses or file uploads/downloads MUST be streamed to prevent high memory consumption.
- **Timeouts:** Every async task and external request MUST have a timeout. Backend: `command_timeout=30` (max 30s). Frontend: Axios timeout 30s.
- **Cleanup:** Frontend `useEffect` MUST return a cleanup function to remove listeners, intervals, or cancel subscriptions to prevent memory leaks.
- **Deduplication:** Prevent concurrent duplicate API fetches via React Query (same query key = single fetch) or Backend locking.
- **React.memo:** Frequently rendered components with stable props MUST be memoized to reduce unnecessary CPU cycles.
- **Component Structure:** Components MUST be strictly modular, focusing on single responsibilities. Reusing existing components is mandatory to avoid codebase bloat.
- **Lazy Loading:** All route pages MUST be lazy-loaded.

---

## 9.2 Network

- **Axios Retry:** Network error retry with exponential backoff: `min(1000 * 2^attempt, 10000)`, max 3 attempts.
- **Refresh Deduplication:** Only one concurrent refresh request. Subsequent 401s wait for the same refresh promise.
- **React Query Retry:** Default retry 1. Configurable per query.

---

## 9.4 Storage

- **Image Optimization:** Serve WebP, use responsive sizes, implement lazy loading (`loading="lazy"`).
- **Cache Headers:** Static assets MUST have `immutable` cache headers (1 year).
- **Data Retention:** Regularly archive or prune transient records to optimize disk usage and index speed.

---

## Related Skills

- **Preloading & Eager Fetching:** See [`preloading-patterns.md`](preloading-patterns.md) for global preloader, React Query caching, and eager data fetching rules.
- **Database Performance:** See [`orm-patterns.md`](orm-patterns.md) for connection pooling, indexing, partitioning, and SELECT * rules.
