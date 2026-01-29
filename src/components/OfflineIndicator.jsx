import React from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

export function OfflineIndicator({ isOffline, pendingCount, onSync }) {
  if (!isOffline && pendingCount === 0) return null

  return (
    <div className={`offline-indicator ${isOffline ? 'offline' : 'syncing'}`}>
      {isOffline ? (
        <>
          <WifiOff size={16} />
          <span>Offline Mode</span>
          {pendingCount > 0 && (
            <span className="pending-badge">{pendingCount} pending</span>
          )}
        </>
      ) : (
        <>
          <RefreshCw size={16} className="syncing-icon" />
          <span>Syncing {pendingCount} changes...</span>
        </>
      )}
    </div>
  )
}
