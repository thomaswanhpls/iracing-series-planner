'use client'

import { createContext, useContext, useSyncExternalStore, useCallback, ReactNode } from 'react'
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  toggleTrackOwned,
  setTrackOwned,
  bulkSetOwned,
  clearAllOwned,
} from './store'

interface OwnershipContextValue {
  ownedTrackIds: number[]
  isOwned: (trackId: number) => boolean
  toggle: (trackId: number) => void
  setOwned: (trackId: number, owned: boolean) => void
  bulkSet: (trackIds: number[]) => void
  clearAll: () => void
}

const OwnershipContext = createContext<OwnershipContextValue | null>(null)

export function OwnershipProvider({ children }: { children: ReactNode }) {
  const ownedTrackIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isOwned = useCallback(
    (trackId: number) => ownedTrackIds.includes(trackId),
    [ownedTrackIds]
  )

  return (
    <OwnershipContext.Provider
      value={{
        ownedTrackIds,
        isOwned,
        toggle: toggleTrackOwned,
        setOwned: setTrackOwned,
        bulkSet: bulkSetOwned,
        clearAll: clearAllOwned,
      }}
    >
      {children}
    </OwnershipContext.Provider>
  )
}

export function useOwnership() {
  const ctx = useContext(OwnershipContext)
  if (!ctx) throw new Error('useOwnership must be used within OwnershipProvider')
  return ctx
}
