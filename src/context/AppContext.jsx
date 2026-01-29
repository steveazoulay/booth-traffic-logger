import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  saveLeadsLocally,
  getLeadsLocally,
  addLeadLocally,
  updateLeadLocally,
  deleteLeadLocally,
  saveUsersLocally,
  getUsersLocally,
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  setLastSyncTime
} from '../lib/offlineStorage'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentShow, setCurrentShow] = useState(null)
  const [users, setUsers] = useState([])
  const [leads, setLeads] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState('list')
  const [editingLead, setEditingLead] = useState(null)
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  // Offline state
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const syncTimeoutRef = useRef(null)

  // Flag to skip subscription reload after manual update
  const skipUserReloadRef = useRef(false)

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      // Trigger sync when coming back online
      syncPendingChanges()
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [currentShow])

  // Update pending sync count
  const updatePendingCount = useCallback(async () => {
    const queue = await getSyncQueue()
    setPendingSyncCount(queue.length)
  }, [])

  useEffect(() => {
    updatePendingCount()
  }, [updatePendingCount])

  const selectShow = (showId) => {
    setCurrentShow(showId)
    setCurrentUser(null)
    setUsers([])
    setLeads([])
  }

  const exitShow = () => {
    setCurrentShow(null)
    setCurrentUser(null)
    setUsers([])
    setLeads([])
    setView('list')
  }

  // Sync pending changes to server
  const syncPendingChanges = useCallback(async () => {
    if (isSyncing || isOffline) return

    const queue = await getSyncQueue()
    if (queue.length === 0) return

    setIsSyncing(true)

    for (const item of queue) {
      try {
        if (item.type === 'addLead') {
          const { data, error } = await supabase
            .from('leads')
            .insert([item.data])
            .select()
            .single()

          if (!error) {
            // Update local ID with server ID
            await updateLeadLocally({
              ...item.leadData,
              id: data.id
            }, item.showId)
          }
        } else if (item.type === 'updateLead') {
          await supabase
            .from('leads')
            .update(item.data)
            .eq('id', item.leadId)
        } else if (item.type === 'deleteLead') {
          await supabase
            .from('leads')
            .delete()
            .eq('id', item.leadId)
        }

        await removeSyncQueueItem(item.id)
      } catch (error) {
        console.error('Sync error:', error)
        // Keep item in queue for retry
        break
      }
    }

    await updatePendingCount()
    setIsSyncing(false)

    // Reload data after sync
    if (currentShow) {
      loadLeads()
    }
  }, [isSyncing, isOffline, currentShow, updatePendingCount])

  // Load users - try cache first, then server
  const loadUsers = async () => {
    if (!currentShow) return

    // Try loading from cache first for instant display
    try {
      const cachedUsers = await getUsersLocally(currentShow)
      if (cachedUsers.length > 0) {
        setUsers(cachedUsers)
        setIsLoading(false)
      }
    } catch (e) {
      console.error('Error loading cached users:', e)
    }

    // If online, fetch from server
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('show_id', currentShow)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setUsers(data)
        // Save to cache
        await saveUsersLocally(data, currentShow)
      }
    }

    setIsLoading(false)
  }

  // Load leads - try cache first, then server
  const loadLeads = async () => {
    if (!currentShow) return

    // Try loading from cache first
    try {
      const cachedLeads = await getLeadsLocally(currentShow)
      if (cachedLeads.length > 0) {
        setLeads(cachedLeads)
      }
    } catch (e) {
      console.error('Error loading cached leads:', e)
    }

    // If online, fetch from server
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('show_id', currentShow)
        .order('created_at', { ascending: false })

      if (!error && data) {
        // Transform from snake_case to camelCase
        const transformedLeads = data.map(lead => ({
          id: lead.id,
          contactName: lead.contact_name,
          storeName: lead.store_name,
          email: lead.email,
          phone: lead.phone,
          zipCode: lead.zip_code,
          city: lead.city,
          state: lead.state,
          interests: lead.interests || [],
          tags: lead.tags || [],
          temperature: lead.temperature,
          notes: lead.notes,
          voiceNote: lead.voice_note,
          createdBy: lead.created_by,
          createdAt: lead.created_at,
          updatedAt: lead.updated_at
        }))
        setLeads(transformedLeads)
        // Save to cache
        await saveLeadsLocally(transformedLeads, currentShow)
        await setLastSyncTime(currentShow)
      }
    }
  }

  // Load users when show is selected
  useEffect(() => {
    if (currentShow) {
      loadUsers()
    }
  }, [currentShow])

  // Load leads and set up real-time subscription when show is selected
  useEffect(() => {
    if (!currentShow) return

    loadLeads()

    // Only subscribe to real-time changes if online
    if (!navigator.onLine) return

    // Use unique channel names per show to avoid conflicts
    const leadsChannelName = `leads_changes_${currentShow}`
    const usersChannelName = `users_changes_${currentShow}`

    const leadsSubscription = supabase
      .channel(leadsChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `show_id=eq.${currentShow}`
        },
        (payload) => {
          console.log('Lead change detected:', payload)
          loadLeads()
        }
      )
      .subscribe((status) => {
        console.log('Leads subscription status:', status)
      })

    const usersSubscription = supabase
      .channel(usersChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `show_id=eq.${currentShow}`
        },
        (payload) => {
          // Skip reload if we just updated manually (to avoid race condition)
          if (skipUserReloadRef.current) {
            skipUserReloadRef.current = false
            return
          }
          console.log('User change detected:', payload)
          loadUsers()
        }
      )
      .subscribe((status) => {
        console.log('Users subscription status:', status)
      })

    return () => {
      console.log('Cleaning up subscriptions for show:', currentShow)
      supabase.removeChannel(leadsSubscription)
      supabase.removeChannel(usersSubscription)
    }
  }, [currentShow])

  const verifyPasscode = (userId, passcode) => {
    const user = users.find(u => u.id === userId)
    return user && user.passcode === passcode
  }

  const loginUser = (userId) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setCurrentUser(user)
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
    setView('list')
  }

  const addUser = async (name, passcode) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, passcode, show_id: currentShow }])
      .select()
      .single()

    if (error) {
      console.error('Error adding user:', error)
      return null
    }

    setUsers(prev => [...prev, data])
    // Update cache
    await saveUsersLocally([...users, data], currentShow)
    return data
  }

  const updateUser = async (userId, updates) => {
    // Set flag to skip real-time subscription reload (prevents race condition)
    skipUserReloadRef.current = true

    // Use .select() to get the updated data back from server
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      console.error('Update attempted with:', { userId, updates })
      skipUserReloadRef.current = false // Reset flag on error
      return false
    }

    console.log('User updated successfully:', data)

    // Use the data returned from server to ensure consistency
    const serverUpdatedUser = data
    const updatedUsers = users.map(u =>
      u.id === userId ? serverUpdatedUser : u
    )
    setUsers(updatedUsers)
    await saveUsersLocally(updatedUsers, currentShow)

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(serverUpdatedUser)
    }
    return true
  }

  const deleteUser = async (userId) => {
    if (users.length <= 1) return false
    if (currentUser && currentUser.id === userId) return false

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      return false
    }

    const updatedUsers = users.filter(u => u.id !== userId)
    setUsers(updatedUsers)
    await saveUsersLocally(updatedUsers, currentShow)
    return true
  }

  // Leads functions with offline support
  const addLead = async (leadData) => {
    // Generate temporary ID for offline use
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newLead = {
      id: tempId,
      contactName: leadData.contactName,
      storeName: leadData.storeName,
      email: leadData.email || null,
      phone: leadData.phone || null,
      zipCode: leadData.zipCode || null,
      city: leadData.city || null,
      state: leadData.state || null,
      interests: leadData.interests || [],
      tags: leadData.tags || [],
      temperature: leadData.temperature,
      notes: leadData.notes || null,
      voiceNote: leadData.voiceNote || null,
      createdBy: leadData.createdBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add to local state immediately
    setLeads(prev => [newLead, ...prev])

    // Save to local storage
    await addLeadLocally(newLead, currentShow)

    // If online, sync to server
    if (navigator.onLine) {
      const dbLead = {
        contact_name: leadData.contactName,
        store_name: leadData.storeName,
        email: leadData.email || null,
        phone: leadData.phone || null,
        zip_code: leadData.zipCode || null,
        city: leadData.city || null,
        state: leadData.state || null,
        interests: leadData.interests || [],
        tags: leadData.tags || [],
        temperature: leadData.temperature,
        notes: leadData.notes || null,
        voice_note: leadData.voiceNote || null,
        created_by: leadData.createdBy || null,
        show_id: currentShow
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([dbLead])
        .select()
        .single()

      if (!error && data) {
        // Update with real ID from server
        const serverLead = {
          ...newLead,
          id: data.id,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }

        setLeads(prev => prev.map(l =>
          l.id === tempId ? serverLead : l
        ))

        await deleteLeadLocally(tempId)
        await addLeadLocally(serverLead, currentShow)

        return serverLead
      }
    } else {
      // Queue for sync when back online
      await addToSyncQueue({
        type: 'addLead',
        showId: currentShow,
        leadData: newLead,
        data: {
          contact_name: leadData.contactName,
          store_name: leadData.storeName,
          email: leadData.email || null,
          phone: leadData.phone || null,
          zip_code: leadData.zipCode || null,
          city: leadData.city || null,
          state: leadData.state || null,
          interests: leadData.interests || [],
          tags: leadData.tags || [],
          temperature: leadData.temperature,
          notes: leadData.notes || null,
          voice_note: leadData.voiceNote || null,
          created_by: leadData.createdBy || null,
          show_id: currentShow
        }
      })
      await updatePendingCount()
    }

    return newLead
  }

  const updateLead = async (leadId, updates) => {
    const updatedLead = {
      ...leads.find(l => l.id === leadId),
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Update local state immediately
    setLeads(prev => prev.map(l =>
      l.id === leadId ? updatedLead : l
    ))

    // Update local storage
    await updateLeadLocally(updatedLead, currentShow)

    // If online, sync to server
    if (navigator.onLine) {
      const dbUpdates = {
        contact_name: updates.contactName,
        store_name: updates.storeName,
        email: updates.email || null,
        phone: updates.phone || null,
        zip_code: updates.zipCode || null,
        city: updates.city || null,
        state: updates.state || null,
        interests: updates.interests || [],
        tags: updates.tags || [],
        temperature: updates.temperature,
        notes: updates.notes || null,
        voice_note: updates.voiceNote || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('leads')
        .update(dbUpdates)
        .eq('id', leadId)

      if (error) {
        console.error('Error updating lead:', error)
        return false
      }
    } else {
      // Queue for sync
      await addToSyncQueue({
        type: 'updateLead',
        showId: currentShow,
        leadId,
        data: {
          contact_name: updates.contactName,
          store_name: updates.storeName,
          email: updates.email || null,
          phone: updates.phone || null,
          zip_code: updates.zipCode || null,
          city: updates.city || null,
          state: updates.state || null,
          interests: updates.interests || [],
          tags: updates.tags || [],
          temperature: updates.temperature,
          notes: updates.notes || null,
          voice_note: updates.voiceNote || null,
          updated_at: new Date().toISOString()
        }
      })
      await updatePendingCount()
    }

    return true
  }

  const deleteLead = async (leadId) => {
    // Update local state immediately
    setLeads(prev => prev.filter(l => l.id !== leadId))

    // Delete from local storage
    await deleteLeadLocally(leadId)

    // If online, sync to server
    if (navigator.onLine) {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      if (error) {
        console.error('Error deleting lead:', error)
        return false
      }
    } else {
      // Queue for sync (only if it's not a temp ID)
      if (!leadId.startsWith('temp_')) {
        await addToSyncQueue({
          type: 'deleteLead',
          showId: currentShow,
          leadId
        })
        await updatePendingCount()
      }
    }

    return true
  }

  const startEdit = (lead) => {
    setEditingLead(lead)
    setView('edit')
  }

  const cancelEdit = () => {
    setEditingLead(null)
    setView('list')
  }

  const getStats = () => {
    return {
      total: leads.length,
      hot: leads.filter(l => l.temperature === 'hot').length,
      warm: leads.filter(l => l.temperature === 'warm').length,
      browsing: leads.filter(l => l.temperature === 'browsing').length
    }
  }

  const getDetailedStats = () => {
    const total = leads.length

    const hot = leads.filter(l => l.temperature === 'hot').length
    const warm = leads.filter(l => l.temperature === 'warm').length
    const browsing = leads.filter(l => l.temperature === 'browsing').length

    const newAccount = leads.filter(l => l.interests?.includes('New Account')).length
    const reorder = leads.filter(l => l.interests?.includes('Reorder')).length
    const ss26 = leads.filter(l => l.interests?.includes('SS26')).length
    const f26 = leads.filter(l => l.interests?.includes('F26')).length
    const core = leads.filter(l => l.interests?.includes('Core')).length

    const stateCount = {}
    leads.forEach(l => {
      if (l.state) {
        stateCount[l.state] = (stateCount[l.state] || 0) + 1
      }
    })
    const stateStats = Object.entries(stateCount)
      .map(([state, count]) => ({
        state,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)

    const cityCount = {}
    leads.forEach(l => {
      if (l.city) {
        const key = l.state ? `${l.city}, ${l.state}` : l.city
        cityCount[key] = (cityCount[key] || 0) + 1
      }
    })
    const cityStats = Object.entries(cityCount)
      .map(([city, count]) => ({
        city,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)

    const staffCount = {}
    leads.forEach(l => {
      if (l.createdBy) {
        staffCount[l.createdBy] = (staffCount[l.createdBy] || 0) + 1
      }
    })
    const staffStats = Object.entries(staffCount)
      .map(([staff, count]) => ({
        staff,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)

    return {
      total,
      temperature: { hot, warm, browsing },
      interests: { newAccount, reorder, ss26, f26, core },
      byState: stateStats,
      byCity: cityStats,
      byStaff: staffStats
    }
  }

  const getFilteredLeads = () => {
    if (filter === 'all') return leads
    return leads.filter(l => l.temperature === filter)
  }

  const exportToCSV = () => {
    if (leads.length === 0) return null

    const headers = ['Contact Name', 'Store Name', 'Email', 'Phone', 'City', 'State', 'ZIP', 'Temperature', 'Interests', 'Notes', 'Created By', 'Created At']
    const rows = leads.map(l => [
      l.contactName,
      l.storeName,
      l.email || '',
      l.phone || '',
      l.city || '',
      l.state || '',
      l.zipCode || '',
      l.temperature,
      (l.interests || []).join('; '),
      l.notes || '',
      l.createdBy || '',
      new Date(l.createdAt).toLocaleString()
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stone-rose-leads-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    return link.download
  }

  const value = {
    // Show selection
    currentShow,
    selectShow,
    exitShow,

    // Users
    users,
    currentUser,
    verifyPasscode,
    loginUser,
    logout,
    addUser,
    updateUser,
    deleteUser,

    // Navigation
    view,
    setView,
    editingLead,
    startEdit,
    cancelEdit,

    // Filter
    filter,
    setFilter,

    // Stats
    getStats,
    getDetailedStats,

    // Leads
    leads,
    addLead,
    updateLead,
    deleteLead,
    getFilteredLeads,
    exportToCSV,

    // Loading state
    isLoading,

    // Offline state
    isOffline,
    pendingSyncCount,
    isSyncing,
    syncPendingChanges
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
