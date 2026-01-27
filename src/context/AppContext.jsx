import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLeads } from '../hooks/useLeads'

const AppContext = createContext(null)

const STAFF_MEMBERS = ['Shai', 'Steve', 'Darren', 'Jean-Claude']
const CURRENT_USER_KEY = 'stonerose_current_user'

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState('list') // 'list', 'add', 'edit'
  const [editingLead, setEditingLead] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'hot', 'warm', 'browsing'

  const leadsHook = useLeads()

  // Load current user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(CURRENT_USER_KEY)
    if (stored && STAFF_MEMBERS.includes(stored)) {
      setCurrentUser(stored)
    }
  }, [])

  const selectUser = (user) => {
    setCurrentUser(user)
    localStorage.setItem(CURRENT_USER_KEY, user)
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem(CURRENT_USER_KEY)
  }

  const startEdit = (lead) => {
    setEditingLead(lead)
    setView('edit')
  }

  const cancelEdit = () => {
    setEditingLead(null)
    setView('list')
  }

  const value = {
    // User
    currentUser,
    selectUser,
    logout,
    staffMembers: STAFF_MEMBERS,

    // Navigation
    view,
    setView,
    editingLead,
    startEdit,
    cancelEdit,

    // Filter
    filter,
    setFilter,

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
