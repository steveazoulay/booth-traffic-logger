import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { LeadCard } from './LeadCard'
import { Search, Inbox } from 'lucide-react'

export function LeadsList() {
  const { leads } = useApp()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter by search
  let filteredLeads = leads
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filteredLeads = leads.filter(lead =>
      lead.contactName?.toLowerCase().includes(query) ||
      lead.storeName?.toLowerCase().includes(query) ||
      lead.city?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query)
    )
  }

  return (
    <div className="leads-list">
      <div className="list-header">
        <h2 className="list-title">All Leads</h2>
        <span className="list-count">{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search by name, store, city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredLeads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Inbox size={48} />
          </div>
          <p className="empty-text">
            {leads.length === 0
              ? "No leads yet. Add your first lead!"
              : "No leads match your search."}
          </p>
        </div>
      ) : (
        <div className="leads-grid">
          {filteredLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  )
}
