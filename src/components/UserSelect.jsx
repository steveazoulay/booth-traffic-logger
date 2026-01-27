import React from 'react'
import { useApp } from '../context/AppContext'
import { User } from 'lucide-react'

export function UserSelect() {
  const { staffMembers, selectUser } = useApp()

  return (
    <div className="user-select-screen">
      <div className="user-select-content">
        <div className="logo-large">STONE <span className="flower">✿</span> ROSE</div>
        <div className="badge-large">CHICAGO COLLECTIVE 2026</div>
        <div className="booth-info">Booth #7050</div>

        <h2 className="select-title">Select Your Name</h2>

        <div className="user-grid">
          {staffMembers.map(name => (
            <button
              key={name}
              className="user-button"
              onClick={() => selectUser(name)}
            >
              <User size={24} />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
