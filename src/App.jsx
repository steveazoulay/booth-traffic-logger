import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { Header } from './components/Header'
import { TabNav } from './components/TabNav'
import { LeadsList } from './components/LeadsList'
import { LeadForm } from './components/LeadForm'
import { UserSelect } from './components/UserSelect'
import { UserManagement } from './components/UserManagement'
import { StatsPanel } from './components/StatsPanel'

function AppContent() {
  const { currentUser, view, isLoaded, users } = useApp()

  if (!isLoaded || users.length === 0) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <img src="/logo.png" alt="Stone Rose" className="logo-img-loading" />
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <UserSelect />
  }

  // Settings view (User Management)
  if (view === 'settings') {
    return (
      <div className="app">
        <Header />
        <main className="main-content">
          <div className="content-area">
            <UserManagement />
          </div>
        </main>
      </div>
    )
  }

  // Stats view
  if (view === 'stats') {
    return (
      <div className="app">
        <Header />
        <main className="main-content">
          <div className="content-area">
            <StatsPanel />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <TabNav />
        <div className="content-area">
          {view === 'list' && <LeadsList />}
          {(view === 'add' || view === 'edit') && <LeadForm />}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
