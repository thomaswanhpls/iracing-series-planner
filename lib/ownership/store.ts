const STORAGE_KEY = 'iracing-owned-tracks'

type Listener = () => void

let listeners: Listener[] = []
let cachedSnapshot: number[] = []

function getSnapshot(): number[] {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    // Only update reference if content changed
    if (JSON.stringify(parsed) !== JSON.stringify(cachedSnapshot)) {
      cachedSnapshot = parsed
    }
    return cachedSnapshot
  } catch {
    return cachedSnapshot
  }
}

const SERVER_SNAPSHOT: number[] = []

function getServerSnapshot(): number[] {
  return SERVER_SNAPSHOT
}

function emitChange() {
  listeners.forEach((l) => l())
}

function save(trackIds: number[]) {
  cachedSnapshot = trackIds
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trackIds))
  emitChange()
}

export function subscribe(listener: Listener) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export { getSnapshot, getServerSnapshot }

export function toggleTrackOwned(trackId: number) {
  const current = getSnapshot()
  if (current.includes(trackId)) {
    save(current.filter((id) => id !== trackId))
  } else {
    save([...current, trackId])
  }
}

export function setTrackOwned(trackId: number, owned: boolean) {
  const current = getSnapshot()
  if (owned && !current.includes(trackId)) {
    save([...current, trackId])
  } else if (!owned && current.includes(trackId)) {
    save(current.filter((id) => id !== trackId))
  }
}

export function bulkSetOwned(trackIds: number[]) {
  const current = getSnapshot()
  const merged = Array.from(new Set([...current, ...trackIds]))
  save(merged)
}

export function clearAllOwned() {
  save([])
}
