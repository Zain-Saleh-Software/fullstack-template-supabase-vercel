import { useEffect, useRef, useState, useCallback } from 'react'
import { changesApi } from '@/api/changes'

const POLL_INTERVAL = 5000

let _acknowledgeChanges: (() => void) | null = null

export function setAcknowledgeChanges(fn: (() => void) | null) {
    _acknowledgeChanges = fn
}

export function acknowledgeUserChanges() {
    if (_acknowledgeChanges) {
        _acknowledgeChanges()
    }
}

export function useTableChanges() {
    const [hasChanges, setHasChanges] = useState(false)
    const [lastTables, setLastTables] = useState<string[]>([])
    const lastCheckedRef = useRef<string>(new Date().toISOString())
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const check = useCallback(async () => {
        try {
            const result = await changesApi.check(lastCheckedRef.current)
            if (result.has_changes) {
                setHasChanges(true)
                setLastTables(result.tables)
            }
        } catch {
            // Silently ignore polling errors — connection may be down
        }
    }, [])

    useEffect(() => {
        intervalRef.current = setInterval(check, POLL_INTERVAL)
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [check])

    const acknowledgeChanges = useCallback(() => {
        lastCheckedRef.current = new Date().toISOString()
        setHasChanges(false)
        setLastTables([])
    }, [])

    useEffect(() => {
        setAcknowledgeChanges(acknowledgeChanges)
        return () => setAcknowledgeChanges(null)
    }, [acknowledgeChanges])

    const refresh = useCallback(() => {
        window.location.reload()
    }, [])

    return { hasChanges, lastTables, acknowledgeChanges, refresh }
}
