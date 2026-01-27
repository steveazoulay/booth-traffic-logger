import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TrendingUp, MapPin, Building, Tag, Users, ChevronDown, ChevronUp, BarChart3, Map } from 'lucide-react'
import { Charts } from './Charts'
import { LeadsHeatmap } from './LeadsHeatmap'

export function StatsPanel() {
  const { getDetailedStats, setView } = useApp()
  const [showCharts, setShowCharts] = useState(true)
  const [showMap, setShowMap] = useState(true)
  const stats = getDetailedStats()

  const [expandedSection, setExpandedSection] = useState('all')

  const toggleSection = (section) => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  const StatBar = ({ value, max, color }) => (
    <div className="stat-bar-container">
      <div
        className="stat-bar-fill"
        style={{
          width: `${max > 0 ? (value / max) * 100 : 0}%`,
          backgroundColor: color
        }}
      />
    </div>
  )

  return (
    <div className="stats-panel">
      <h2 className="stats-panel-title">Analytics Dashboard</h2>

      {/* Summary Cards */}
      <div className="stats-summary">
        <div className="summary-card">
          <span className="summary-value">{stats.total}</span>
          <span className="summary-label">Total Leads</span>
        </div>
        <div className="summary-card hot">
          <span className="summary-value">{stats.temperature.hot}</span>
          <span className="summary-label">Hot Leads</span>
        </div>
        <div className="summary-card warm">
          <span className="summary-value">{stats.temperature.warm}</span>
          <span className="summary-label">Warm</span>
        </div>
        <div className="summary-card browsing">
          <span className="summary-value">{stats.temperature.browsing}</span>
          <span className="summary-label">Browsing</span>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="stats-section">
        <button
          className="stats-section-header"
          onClick={() => setShowCharts(!showCharts)}
        >
          <div className="section-title">
            <BarChart3 size={18} />
            <span>Visual Analytics</span>
          </div>
          {showCharts ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showCharts && (
          <div className="stats-section-content">
            <Charts />
          </div>
        )}
      </div>

      {/* Geographic Heatmap */}
      <div className="stats-section">
        <button
          className="stats-section-header"
          onClick={() => setShowMap(!showMap)}
        >
          <div className="section-title">
            <Map size={18} />
            <span>Geographic Distribution</span>
          </div>
          {showMap ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showMap && (
          <div className="stats-section-content">
            <LeadsHeatmap />
          </div>
        )}
      </div>

      {/* Account Types */}
      <div className="stats-section">
        <button
          className="stats-section-header"
          onClick={() => toggleSection('accounts')}
        >
          <div className="section-title">
            <Tag size={18} />
            <span>Account Types & Interests</span>
          </div>
          {expandedSection === 'accounts' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {(expandedSection === 'accounts' || expandedSection === 'all') && (
          <div className="stats-section-content">
            <div className="stats-grid">
              <div className="stat-row">
                <span className="stat-name">New Accounts</span>
                <div className="stat-data">
                  <StatBar value={stats.interests.newAccount} max={stats.total} color="#10B981" />
                  <span className="stat-count">{stats.interests.newAccount}</span>
                  <span className="stat-percent">
                    {stats.total > 0 ? ((stats.interests.newAccount / stats.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
              <div className="stat-row">
                <span className="stat-name">Reorders</span>
                <div className="stat-data">
                  <StatBar value={stats.interests.reorder} max={stats.total} color="#3B82F6" />
                  <span className="stat-count">{stats.interests.reorder}</span>
                  <span className="stat-percent">
                    {stats.total > 0 ? ((stats.interests.reorder / stats.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
              <div className="stat-row">
                <span className="stat-name">Spring '26 (SS26)</span>
                <div className="stat-data">
                  <StatBar value={stats.interests.ss26} max={stats.total} color="#F59E0B" />
                  <span className="stat-count">{stats.interests.ss26}</span>
                  <span className="stat-percent">
                    {stats.total > 0 ? ((stats.interests.ss26 / stats.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
              <div className="stat-row">
                <span className="stat-name">Fall '26 (F26)</span>
                <div className="stat-data">
                  <StatBar value={stats.interests.f26} max={stats.total} color="#8B5CF6" />
                  <span className="stat-count">{stats.interests.f26}</span>
                  <span className="stat-percent">
                    {stats.total > 0 ? ((stats.interests.f26 / stats.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
              <div className="stat-row">
                <span className="stat-name">Core Collection</span>
                <div className="stat-data">
                  <StatBar value={stats.interests.core} max={stats.total} color="#EC4899" />
                  <span className="stat-count">{stats.interests.core}</span>
                  <span className="stat-percent">
                    {stats.total > 0 ? ((stats.interests.core / stats.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* By State */}
      <div className="stats-section">
        <button
          className="stats-section-header"
          onClick={() => toggleSection('states')}
        >
          <div className="section-title">
            <MapPin size={18} />
            <span>By State</span>
            <span className="section-count">{stats.byState.length} states</span>
          </div>
          {expandedSection === 'states' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {(expandedSection === 'states' || expandedSection === 'all') && (
          <div className="stats-section-content">
            {stats.byState.length === 0 ? (
              <p className="no-data">No location data yet</p>
            ) : (
              <div className="ranking-list">
                {stats.byState.slice(0, 10).map((item, index) => (
                  <div key={item.state} className="ranking-item">
                    <span className="ranking-position">#{index + 1}</span>
                    <span className="ranking-name">{item.state}</span>
                    <div className="ranking-data">
                      <StatBar value={item.count} max={stats.byState[0]?.count || 1} color="#C9A962" />
                      <span className="ranking-count">{item.count}</span>
                      <span className="ranking-percent">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* By City */}
      <div className="stats-section">
        <button
          className="stats-section-header"
          onClick={() => toggleSection('cities')}
        >
          <div className="section-title">
            <Building size={18} />
            <span>By City</span>
            <span className="section-count">{stats.byCity.length} cities</span>
          </div>
          {expandedSection === 'cities' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {(expandedSection === 'cities' || expandedSection === 'all') && (
          <div className="stats-section-content">
            {stats.byCity.length === 0 ? (
              <p className="no-data">No city data yet</p>
            ) : (
              <div className="ranking-list">
                {stats.byCity.slice(0, 10).map((item, index) => (
                  <div key={item.city} className="ranking-item">
                    <span className="ranking-position">#{index + 1}</span>
                    <span className="ranking-name">{item.city}</span>
                    <div className="ranking-data">
                      <StatBar value={item.count} max={stats.byCity[0]?.count || 1} color="#1B2A4A" />
                      <span className="ranking-count">{item.count}</span>
                      <span className="ranking-percent">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* By Staff */}
      <div className="stats-section">
        <button
          className="stats-section-header"
          onClick={() => toggleSection('staff')}
        >
          <div className="section-title">
            <Users size={18} />
            <span>By Staff Member</span>
          </div>
          {expandedSection === 'staff' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {(expandedSection === 'staff' || expandedSection === 'all') && (
          <div className="stats-section-content">
            {stats.byStaff.length === 0 ? (
              <p className="no-data">No staff data yet</p>
            ) : (
              <div className="ranking-list">
                {stats.byStaff.map((item, index) => (
                  <div key={item.staff} className="ranking-item">
                    <span className="ranking-position">#{index + 1}</span>
                    <span className="ranking-name">{item.staff}</span>
                    <div className="ranking-data">
                      <StatBar value={item.count} max={stats.byStaff[0]?.count || 1} color="#6366F1" />
                      <span className="ranking-count">{item.count}</span>
                      <span className="ranking-percent">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className="back-to-app-btn"
        onClick={() => setView('list')}
      >
        Back to Leads
      </button>
    </div>
  )
}
