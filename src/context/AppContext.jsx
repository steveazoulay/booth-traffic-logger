import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLeads } from '../hooks/useLeads'

const AppContext = createContext(null)

const USERS_KEY = 'stonerose_users'
const CURRENT_USER_KEY = 'stonerose_current_user'

// Default users with passcodes
const DEFAULT_USERS = [
  { id: '1', name: 'Shai', passcode: '1111' },
  { id: '2', name: 'Steve', passcode: '2222' },
  { id: '3', name: 'Darren', passcode: '3333' },
  { id: '4', name: 'Jean-Claude', passcode: '4444' }
]

export function AppProvider({ children }) {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState('list') // 'list', 'add', 'edit', 'stats', 'settings'
  const [editingLead, setEditingLead] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'hot', 'warm', 'browsing'

  const leadsHook = useLeads()

  // Load users from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(USERS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUsers(parsed)
      } catch {
        setUsers(DEFAULT_USERS)
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
      }
    } else {
      setUsers(DEFAULT_USERS)
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
    }
  }, [])

  // Load current user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(CURRENT_USER_KEY)
    if (stored && users.length > 0) {
      const user = users.find(u => u.id === stored || u.name === stored)
      if (user) {
        setCurrentUser(user)
      }
    }
  }, [users])

  // Save users to localStorage when changed
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
  }, [users])

  const verifyPasscode = (userId, passcode) => {
    const user = users.find(u => u.id === userId)
    return user && user.passcode === passcode
  }

  const loginUser = (userId) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setCurrentUser(user)
      localStorage.setItem(CURRENT_USER_KEY, user.id)
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem(CURRENT_USER_KEY)
    setView('list')
  }

  const addUser = (name, passcode) => {
    const newUser = {
      id: crypto.randomUUID(),
      name,
      passcode
    }
    setUsers(prev => [...prev, newUser])
    return newUser
  }

  const updateUser = (userId, updates) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, ...updates } : u
    ))
    // Update currentUser if it's the one being edited
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updates }))
    }
  }

  const deleteUser = (userId) => {
    // Prevent deleting if it's the last user
    if (users.length <= 1) return false
    // Prevent deleting current user
    if (currentUser && currentUser.id === userId) return false

    setUsers(prev => prev.filter(u => u.id !== userId))
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

  // Enhanced stats
  const getDetailedStats = () => {
    const leads = leadsHook.leads
    const total = leads.length

    // Temperature stats
    const hot = leads.filter(l => l.temperature === 'hot').length
    const warm = leads.filter(l => l.temperature === 'warm').length
    const browsing = leads.filter(l => l.temperature === 'browsing').length

    // Interest/Account type stats
    const newAccount = leads.filter(l => l.interests?.includes('New Account')).length
    const reorder = leads.filter(l => l.interests?.includes('Reorder')).length
    const ss26 = leads.filter(l => l.interests?.includes('SS26')).length
    const f26 = leads.filter(l => l.interests?.includes('F26')).length
    const core = leads.filter(l => l.interests?.includes('Core')).length

    // State stats
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

    // City stats
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

    // Staff stats
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

  const value = {
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
    getDetailedStats,

    // Leads
    ...leadsHook
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
