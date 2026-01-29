import { openDB } from 'idb'

const DB_NAME = 'stone-rose-booth-logger'
const DB_VERSION = 1

let dbPromise = null

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Leads store
        if (!db.objectStoreNames.contains('leads')) {
          const leadsStore = db.createObjectStore('leads', { keyPath: 'id' })
          leadsStore.createIndex('show_id', 'show_id')
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' })
          usersStore.createIndex('show_id', 'show_id')
        }

        // Sync queue for pending operations
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('timestamp', 'timestamp')
        }

        // Meta store for last sync times
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' })
        }
      }
    })
  }
  return dbPromise
}

// Leads operations
export const saveLeadsLocally = async (leads, showId) => {
  const db = await getDB()
  const tx = db.transaction('leads', 'readwrite')
  const store = tx.objectStore('leads')

  // Clear existing leads for this show and save new ones
  const index = store.index('show_id')
  const existingKeys = await index.getAllKeys(showId)
  for (const key of existingKeys) {
    await store.delete(key)
  }

  for (const lead of leads) {
    await store.put({ ...lead, show_id: showId })
  }

  await tx.done
}

export const getLeadsLocally = async (showId) => {
  const db = await getDB()
  const tx = db.transaction('leads', 'readonly')
  const index = tx.store.index('show_id')
  const leads = await index.getAll(showId)
  return leads.map(lead => {
    const { show_id, ...rest } = lead
    return rest
  })
}

export const addLeadLocally = async (lead, showId) => {
  const db = await getDB()
  await db.put('leads', { ...lead, show_id: showId })
}

export const updateLeadLocally = async (lead, showId) => {
  const db = await getDB()
  await db.put('leads', { ...lead, show_id: showId })
}

export const deleteLeadLocally = async (leadId) => {
  const db = await getDB()
  await db.delete('leads', leadId)
}

// Users operations
export const saveUsersLocally = async (users, showId) => {
  const db = await getDB()
  const tx = db.transaction('users', 'readwrite')
  const store = tx.objectStore('users')

  const index = store.index('show_id')
  const existingKeys = await index.getAllKeys(showId)
  for (const key of existingKeys) {
    await store.delete(key)
  }

  for (const user of users) {
    await store.put({ ...user, show_id: showId })
  }

  await tx.done
}

export const getUsersLocally = async (showId) => {
  const db = await getDB()
  const tx = db.transaction('users', 'readonly')
  const index = tx.store.index('show_id')
  const users = await index.getAll(showId)
  return users.map(user => {
    const { show_id, ...rest } = user
    return rest
  })
}

// Sync queue operations
export const addToSyncQueue = async (operation) => {
  const db = await getDB()
  await db.add('syncQueue', {
    ...operation,
    timestamp: Date.now()
  })
}

export const getSyncQueue = async () => {
  const db = await getDB()
  const tx = db.transaction('syncQueue', 'readonly')
  const index = tx.store.index('timestamp')
  return index.getAll()
}

export const clearSyncQueue = async () => {
  const db = await getDB()
  const tx = db.transaction('syncQueue', 'readwrite')
  await tx.store.clear()
  await tx.done
}

export const removeSyncQueueItem = async (id) => {
  const db = await getDB()
  await db.delete('syncQueue', id)
}

// Meta operations
export const setLastSyncTime = async (showId) => {
  const db = await getDB()
  await db.put('meta', { key: `lastSync_${showId}`, value: Date.now() })
}

export const getLastSyncTime = async (showId) => {
  const db = await getDB()
  const record = await db.get('meta', `lastSync_${showId}`)
  return record?.value || null
}
