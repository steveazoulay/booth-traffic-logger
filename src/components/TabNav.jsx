import React from 'react'
import { useApp } from '../context/AppContext'
import { Plus, List } from 'lucide-react'

export function TabNav() {
  const { view, setView, cancelEdit } = useApp()

  const handleAddLead = () => {
    cancelEdit()
    setView('add')
  }

  const handleViewLeads = () => {
    cancelEdit()
    setView('list')
  }

  return (
    <div className="tab-nav">
      <button
        className={`tab-btn tab-add ${view === 'add' || view === 'edit' ? 'active' : ''}`}
        onClick={handleAddLead}
      >
        <Plus size={18} />
        <span>Add Lead</span>
      </button>
      <button
        className={`tab-btn tab-list ${view === 'list' ? 'active' : ''}`}
        onClick={handleViewLeads}
      >
        <span>View Leads</span>
      </button>
    </div>
  )
}
