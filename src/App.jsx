import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { Header } from './components/Header'
import { TabNav } from './components/TabNav'
import { LeadsList } from './components/LeadsList'
import { LeadForm } from './components/LeadForm'
import { UserSelect } from './components/UserSelect'

function AppContent() {
  const { currentUser, view, isLoaded, editingLead } = useApp()

  if (!isLoaded) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <div className="logo">STONE <span className="flower">✿</span> ROSE</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <UserSelect />
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
