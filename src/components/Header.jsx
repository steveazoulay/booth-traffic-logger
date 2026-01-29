import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { LogOut, Download, Settings, X, BarChart3, Users, ArrowLeftRight } from 'lucide-react'
import { SHOWS } from './ShowSelect'

export function Header() {
  const { currentShow, currentUser, logout, exitShow, exportToCSV, leads, getStats, setView } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const stats = getStats()
  const showInfo = SHOWS.find(s => s.id === currentShow)

  // Permission checks
  const userName = currentUser?.name?.toLowerCase()
  const canExport = ['steve', 'melissa', 'shai'].includes(userName)
  const canManageUsers = userName === 'steve'

  const handleLogoClick = () => {
    setView('list')
    setMenuOpen(false)
  }

  const handleExport = () => {
    const filename = exportToCSV()
    if (filename) {
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 2000)
    }
    setMenuOpen(false)
  }

  const handleStatsClick = () => {
    setView('stats')
    setMenuOpen(false)
  }

  const handleSettingsClick = () => {
    setView('settings')
    setMenuOpen(false)
  }

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-top-inner">
          <div className="header-spacer"></div>
          <div className="header-brand-center">
            <img
              src="/logo.png"
              alt="Stone Rose"
              className="logo-img"
              onClick={handleLogoClick}
              title="Back to Home"
            />
            <div className="badge">{showInfo?.badge || 'SHOW 2026'}</div>
          </div>
          <button
            className="settings-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Settings"
          >
            {menuOpen ? <X size={20} /> : <Settings size={20} />}
          </button>
        </div>
      </div>

      <div className="header-stats-row">
        <div className="header-stats-row-inner">
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">TOTAL</span>
          </div>
          <div className="stat-item stat-hot">
            <span className="stat-value">{stats.hot}</span>
            <span className="stat-label"><span className="stat-icon">🔥</span> HOT</span>
          </div>
          <div className="stat-item stat-warm">
            <span className="stat-value">{stats.warm}</span>
            <span className="stat-label"><span className="stat-icon">🌞</span> WARM</span>
          </div>
          <div className="stat-item stat-browsing">
            <span className="stat-value">{stats.browsing}</span>
            <span className="stat-label"><span className="stat-icon">👀</span> BROWSE</span>
          </div>
        </div>
        </div>
      </div>

      {menuOpen && (
        <div className="header-menu">
          <div className="menu-user">
            <span className="user-label">Logged in as</span>
            <span className="user-name">{currentUser?.name}</span>
          </div>

          <button
            className="menu-item"
            onClick={handleStatsClick}
          >
            <BarChart3 size={18} />
            <span>Analytics Dashboard</span>
          </button>

          {canExport && (
            <button
              className="menu-item"
              onClick={handleExport}
              disabled={leads.length === 0}
            >
              <Download size={18} />
              <span>Export CSV ({leads.length} leads)</span>
            </button>
          )}

          {canManageUsers && (
            <button
              className="menu-item"
              onClick={handleSettingsClick}
            >
              <Users size={18} />
              <span>Manage Users</span>
            </button>
          )}

          <button
            className="menu-item"
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Switch User</span>
          </button>

          <button
            className="menu-item menu-item-logout"
            onClick={() => { exitShow(); setMenuOpen(false); }}
          >
            <ArrowLeftRight size={18} />
            <span>Change Show</span>
          </button>
        </div>
      )}

      {exportSuccess && (
        <div className="export-toast">
          CSV exported successfully!
        </div>
      )}
    </header>
  )
}
