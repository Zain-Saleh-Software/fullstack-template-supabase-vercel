/**
 * @deprecated Preloading is now handled directly in AppPreloader via React Query.
 * This stub exists to prevent import errors in any legacy consumer.
 * Will be removed in a future version.
 */

export function usePreloader(): never {
    throw new Error('PreloaderContext has been removed. Use AppPreloader + React Query directly.')
}
