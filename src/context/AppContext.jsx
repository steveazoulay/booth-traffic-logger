import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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

  // Load users from Supabase when show is selected
  useEffect(() => {
    if (currentShow) {
      loadUsers()
    }
  }, [currentShow])

  // Load leads from Supabase when show is selected
  useEffect(() => {
    if (!currentShow) return

    loadLeads()

    // Subscribe to real-time changes
    const leadsSubscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeads()
      })
      .subscribe()

    const usersSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        loadUsers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(leadsSubscription)
      supabase.removeChannel(usersSubscription)
    }
  }, [currentShow])

  const loadUsers = async () => {
    if (!currentShow) return

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('show_id', currentShow)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading users:', error)
    } else {
      setUsers(data || [])
    }
    setIsLoading(false)
  }

  const loadLeads = async () => {
    if (!currentShow) return

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('show_id', currentShow)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading leads:', error)
    } else {
      // Transform from snake_case to camelCase
      const transformedLeads = (data || []).map(lead => ({
        id: lead.id,
        contactName: lead.contact_name,
        storeName: lead.store_name,
        email: lead.email,
        phone: lead.phone,
        zipCode: lead.zip_code,
        city: lead.city,
        state: lead.state,
        interests: lead.interests || [],
        temperature: lead.temperature,
        notes: lead.notes,
        voiceNote: lead.voice_note,
        createdBy: lead.created_by,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      }))
      setLeads(transformedLeads)
    }
  }

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
    return data
  }

  const updateUser = async (userId, updates) => {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      return false
    }

    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, ...updates } : u
    ))

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updates }))
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

    setUsers(prev => prev.filter(u => u.id !== userId))
    return true
  }

  // Leads functions
  const addLead = async (leadData) => {
    const dbLead = {
      contact_name: leadData.contactName,
      store_name: leadData.storeName,
      email: leadData.email || null,
      phone: leadData.phone || null,
      zip_code: leadData.zipCode || null,
      city: leadData.city || null,
      state: leadData.state || null,
      interests: leadData.interests || [],
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

    if (error) {
      console.error('Error adding lead:', error)
      return null
    }

    const newLead = {
      id: data.id,
      contactName: data.contact_name,
      storeName: data.store_name,
      email: data.email,
      phone: data.phone,
      zipCode: data.zip_code,
      city: data.city,
      state: data.state,
      interests: data.interests || [],
      temperature: data.temperature,
      notes: data.notes,
      voiceNote: data.voice_note,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    setLeads(prev => [newLead, ...prev])
    return newLead
  }

  const updateLead = async (leadId, updates) => {
    const dbUpdates = {
      contact_name: updates.contactName,
      store_name: updates.storeName,
      email: updates.email || null,
      phone: updates.phone || null,
      zip_code: updates.zipCode || null,
      city: updates.city || null,
      state: updates.state || null,
      interests: updates.interests || [],
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

    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, ...updates, updatedAt: dbUpdates.updated_at } : l
    ))
    return true
  }

  const deleteLead = async (leadId) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      console.error('Error deleting lead:', error)
      return false
    }

    setLeads(prev => prev.filter(l => l.id !== leadId))
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
    isLoading
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
