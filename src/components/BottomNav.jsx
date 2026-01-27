import React from 'react'
import { useApp } from '../context/AppContext'
import { List, PlusCircle } from 'lucide-react'

export function BottomNav() {
  const { view, setView, cancelEdit } = useApp()

  const handleViewLeads = () => {
    cancelEdit()
    setView('list')
  }

  const handleAddLead = () => {
    cancelEdit()
    setView('add')
  }

  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${view === 'list' ? 'active' : ''}`}
        onClick={handleViewLeads}
      >
        <List size={24} />
        <span>Leads</span>
      </button>

      <button
        className={`nav-item nav-item-add ${view === 'add' ? 'active' : ''}`}
        onClick={handleAddLead}
      >
        <PlusCircle size={28} />
        <span>Add Lead</span>
      </button>
    </nav>
  )
}
