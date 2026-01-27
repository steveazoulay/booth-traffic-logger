import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { User, Lock, ArrowLeft, Check } from 'lucide-react'

export function UserSelect() {
  const { users, verifyPasscode, loginUser } = useApp()
  const [selectedUser, setSelectedUser] = useState(null)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleUserClick = (user) => {
    setSelectedUser(user)
    setPasscode('')
    setError('')
  }

  const handleBack = () => {
    setSelectedUser(null)
    setPasscode('')
    setError('')
  }

  const handleDigitClick = (digit) => {
    if (passcode.length < 4) {
      const newPasscode = passcode + digit
      setPasscode(newPasscode)
      setError('')

      // Auto-submit when 4 digits entered
      if (newPasscode.length === 4) {
        handleSubmit(newPasscode)
      }
    }
  }

  const handleDelete = () => {
    setPasscode(prev => prev.slice(0, -1))
    setError('')
  }

  const handleSubmit = (code) => {
    const codeToVerify = code || passcode
    if (codeToVerify.length !== 4) {
      setError('Enter 4 digits')
      return
    }

    setIsLoading(true)

    // Small delay for UX
    setTimeout(() => {
      if (verifyPasscode(selectedUser.id, codeToVerify)) {
        loginUser(selectedUser.id)
      } else {
        setError('Incorrect passcode')
        setPasscode('')
      }
      setIsLoading(false)
    }, 300)
  }

  // Passcode entry screen
  if (selectedUser) {
    return (
      <div className="user-select-screen">
        <div className="user-select-content">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="passcode-header">
            <div className="selected-user-avatar">
              <User size={32} />
            </div>
            <h2 className="selected-user-name">{selectedUser.name}</h2>
            <p className="passcode-prompt">Enter your 4-digit passcode</p>
          </div>

          <div className="passcode-dots">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`passcode-dot ${passcode.length > i ? 'filled' : ''} ${error ? 'error' : ''}`}
              />
            ))}
          </div>

          {error && <p className="passcode-error">{error}</p>}

          <div className="numpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                className="numpad-btn"
                onClick={() => handleDigitClick(String(num))}
                disabled={isLoading}
              >
                {num}
              </button>
            ))}
            <button className="numpad-btn numpad-empty" disabled></button>
            <button
              className="numpad-btn"
              onClick={() => handleDigitClick('0')}
              disabled={isLoading}
            >
              0
            </button>
            <button
              className="numpad-btn numpad-delete"
              onClick={handleDelete}
              disabled={isLoading || passcode.length === 0}
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // User selection screen
  return (
    <div className="user-select-screen">
      <div className="user-select-content">
        <div className="logo-large">STONE <span className="flower">✿</span> ROSE</div>
        <div className="badge-large">CHICAGO COLLECTIVE 2026</div>
        <p className="booth-info">Booth #7050 • Jan 31 - Feb 3</p>

        <h2 className="select-title">Select Your Profile</h2>

        <div className="user-grid">
          {users.map(user => (
            <button
              key={user.id}
              className="user-button"
              onClick={() => handleUserClick(user)}
            >
              <User size={28} />
              <span>{user.name}</span>
              <Lock size={14} className="user-lock" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
