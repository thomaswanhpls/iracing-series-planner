'use client'

import { createContext, useContext, useSyncExternalStore, useCallback, useEffect, ReactNode } from 'react'
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  toggleTrackOwned as localToggle,
  setTrackOwned as localSet,
  bulkSetOwned as localBulk,
  clearAllOwned as localClear,
  seedFromDb,
} from './store'
import {
  toggleTrackOwnedInDb,
  bulkSetOwnedInDb,
  clearAllOwnedInDb,
} from '@/lib/db/actions'

interface OwnershipContextValue {
  ownedTrackIds: number[]
  isOwned: (trackId: number) => boolean
  toggle: (trackId: number) => void
  setOwned: (trackId: number, owned: boolean) => void
  bulkSet: (trackIds: number[]) => void
  clearAll: () => void
}

const OwnershipContext = createContext<OwnershipContextValue | null>(null)

interface OwnershipProviderProps {
  children: ReactNode
  /** userId from session — routes mutations through DB when set */
  userId?: string
  /** Server-fetched owned track ids to seed localStorage on first load */
  initialOwnedTrackIds?: number[]
}

export function OwnershipProvider({ children, userId, initialOwnedTrackIds }: OwnershipProviderProps) {
  const ownedTrackIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Seed localStorage from DB data on first mount (only if localStorage is empty)
  useEffect(() => {
    if (initialOwnedTrackIds && initialOwnedTrackIds.length > 0) {
      seedFromDb(initialOwnedTrackIds)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isOwned = useCallback(
    (trackId: number) => ownedTrackIds.includes(trackId),
    [ownedTrackIds]
  )

  const toggle = useCallback(
    (trackId: number) => {
      const nowOwned = !ownedTrackIds.includes(trackId)
      localToggle(trackId)
      if (userId) {
        toggleTrackOwnedInDb(userId, trackId, nowOwned).catch(console.error)
      }
    },
    [userId, ownedTrackIds]
  )

  const setOwned = useCallback(
    (trackId: number, owned: boolean) => {
      localSet(trackId, owned)
      if (userId) {
        toggleTrackOwnedInDb(userId, trackId, owned).catch(console.error)
      }
    },
    [userId]
  )

  const bulkSet = useCallback(
    (trackIds: number[]) => {
      localBulk(trackIds)
      if (userId) {
        bulkSetOwnedInDb(userId, trackIds).catch(console.error)
      }
    },
    [userId]
  )

  const clearAll = useCallback(() => {
    localClear()
    if (userId) {
      clearAllOwnedInDb(userId).catch(console.error)
    }
  }, [userId])

  return (
    <OwnershipContext.Provider value={{ ownedTrackIds, isOwned, toggle, setOwned, bulkSet, clearAll }}>
      {children}
    </OwnershipContext.Provider>
  )
}

export function useOwnership() {
  const ctx = useContext(OwnershipContext)
  if (!ctx) throw new Error('useOwnership must be used within OwnershipProvider')
  return ctx
}
