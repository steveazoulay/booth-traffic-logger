import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { LeadCard } from './LeadCard'
import { Search, Inbox, Filter, X } from 'lucide-react'

export function LeadsList() {
  const { leads } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [tempFilter, setTempFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [interestFilter, setInterestFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique states from leads
  const uniqueStates = useMemo(() => {
    const states = leads
      .map(l => l.state)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
    return states
  }, [leads])

  // Filter leads
  const filteredLeads = useMemo(() => {
    let result = leads

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(lead =>
        lead.contactName?.toLowerCase().includes(query) ||
        lead.storeName?.toLowerCase().includes(query) ||
        lead.city?.toLowerCase().includes(query) ||
        lead.state?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query)
      )
    }

    // Temperature filter
    if (tempFilter !== 'all') {
      result = result.filter(lead => lead.temperature === tempFilter)
    }

    // State filter
    if (stateFilter !== 'all') {
      result = result.filter(lead => lead.state === stateFilter)
    }

    // Interest filter
    if (interestFilter !== 'all') {
      result = result.filter(lead => lead.interests?.includes(interestFilter))
    }

    return result
  }, [leads, searchQuery, tempFilter, stateFilter, interestFilter])

  const activeFiltersCount = [tempFilter, stateFilter, interestFilter].filter(f => f !== 'all').length

  const clearFilters = () => {
    setTempFilter('all')
    setStateFilter('all')
    setInterestFilter('all')
    setSearchQuery('')
  }

  return (
    <div className="leads-list">
      <div className="list-header">
        <h2 className="list-title">All Leads</h2>
        <span className="list-count">{filteredLeads.length} of {leads.length}</span>
      </div>

      <div className="search-filter-row">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search name, store, city, state, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button
          className={`filter-toggle ${showFilters || activeFiltersCount > 0 ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Temperature</label>
              <select
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="hot">🔥 Hot</option>
                <option value="warm">☀️ Warm</option>
                <option value="browsing">👀 Browsing</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">State</label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Interest</label>
              <select
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Interests</option>
                <option value="New Account">New Account</option>
                <option value="Reorder">Reorder</option>
                <option value="SS26">SS26</option>
                <option value="F26">F26</option>
                <option value="Core">Core</option>
              </select>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button className="clear-filters" onClick={clearFilters}>
              <X size={14} />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {filteredLeads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Inbox size={48} />
          </div>
          <p className="empty-text">
            {leads.length === 0
              ? "No leads yet. Add your first lead!"
              : "No leads match your filters."}
          </p>
          {activeFiltersCount > 0 && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
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
