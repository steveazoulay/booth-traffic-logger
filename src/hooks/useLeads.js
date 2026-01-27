import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'stonerose_leads'
const API_BASE = '/api'

export function useLeads() {
  const [leads, setLeads] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, synced, error

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load leads on mount
  useEffect(() => {
    loadLeads()
  }, [])

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && isLoaded) {
      syncWithServer()
    }
  }, [isOnline, isLoaded])

  const loadLeads = async () => {
    try {
      // Try to fetch from API first
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE}/leads`)
        if (response.ok) {
          const data = await response.json()
          setLeads(data)
          // Save to localStorage as backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          setIsLoaded(true)
          return
        }
      }
    } catch (error) {
      console.log('API not available, using localStorage')
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setLeads(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
    setIsLoaded(true)
  }

  const syncWithServer = async () => {
    if (!navigator.onLine) return

    setSyncStatus('syncing')
    try {
      const response = await fetch(`${API_BASE}/leads`)
      if (response.ok) {
        const serverLeads = await response.json()
        setLeads(serverLeads)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverLeads))
        setSyncStatus('synced')
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('error')
    }
  }

  // Save to localStorage whenever leads change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
    }
  }, [leads, isLoaded])

  const addLead = useCallback(async (leadData) => {
    const newLead = {
      id: crypto.randomUUID(),
      ...leadData,
      timestamp: new Date().toISOString(),
      createdBy: leadData.createdBy || 'Unknown'
    }

    // Optimistic update
    setLeads(prev => [newLead, ...prev])

    // Try to save to API
    if (navigator.onLine) {
      try {
        const response = await fetch(`${API_BASE}/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData)
        })

        if (response.ok) {
          const savedLead = await response.json()
          // Update with server-generated ID
          setLeads(prev => prev.map(l =>
            l.id === newLead.id ? savedLead : l
          ))
          return savedLead
        }
      } catch (error) {
        console.error('Error saving to API:', error)
      }
    }

    return newLead
  }, [])

  const updateLead = useCallback(async (id, updates) => {
    // Optimistic update
    setLeads(prev => prev.map(lead =>
      lead.id === id ? { ...lead, ...updates, updatedAt: new Date().toISOString() } : lead
    ))

    // Try to save to API
    if (navigator.onLine) {
      try {
        const lead = leads.find(l => l.id === id)
        const updatedLead = { ...lead, ...updates }

        await fetch(`${API_BASE}/leads/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLead)
        })
      } catch (error) {
        console.error('Error updating in API:', error)
      }
    }
  }, [leads])

  const deleteLead = useCallback(async (id) => {
    // Optimistic update
    setLeads(prev => prev.filter(lead => lead.id !== id))

    // Try to delete from API
    if (navigator.onLine) {
      try {
        await fetch(`${API_BASE}/leads/${id}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Error deleting from API:', error)
      }
    }
  }, [])

  const getStats = useCallback(() => {
    const total = leads.length
    const hot = leads.filter(l => l.temperature === 'hot').length
    const warm = leads.filter(l => l.temperature === 'warm').length
    const browsing = leads.filter(l => l.temperature === 'browsing').length
    return { total, hot, warm, browsing }
  }, [leads])

  const exportToCSV = useCallback(() => {
    if (leads.length === 0) return null

    const headers = [
      'Contact Name',
      'Store Name',
      'Email',
      'Phone',
      'City',
      'State',
      'Interests',
      'Temperature',
      'Notes',
      'Timestamp',
      'Created By'
    ]

    const rows = leads.map(lead => [
      lead.contactName || '',
      lead.storeName || '',
      lead.email || '',
      lead.phone || '',
      lead.city || '',
      lead.state || '',
      (lead.interests || []).join('; '),
      lead.temperature || '',
      (lead.notes || '').replace(/"/g, '""'),
      lead.timestamp ? new Date(lead.timestamp).toLocaleString() : '',
      lead.createdBy || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const date = new Date().toISOString().split('T')[0]
    const filename = `StoneRose_Leads_Chicago_${date}.csv`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return filename
  }, [leads])

  return {
    leads,
    isLoaded,
    isOnline,
    syncStatus,
    addLead,
    updateLead,
    deleteLead,
    getStats,
    exportToCSV,
    syncWithServer
  }
}
