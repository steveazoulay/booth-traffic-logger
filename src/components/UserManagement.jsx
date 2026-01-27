import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { User, Plus, Trash2, Edit2, Check, X, Eye, EyeOff } from 'lucide-react'

export function UserManagement() {
  const { users, currentUser, addUser, updateUser, deleteUser, setView } = useApp()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showPasscode, setShowPasscode] = useState({})

  const [newName, setNewName] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [editName, setEditName] = useState('')
  const [editPasscode, setEditPasscode] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!newName.trim()) {
      setError('Name is required')
      return
    }
    if (newPasscode.length !== 4 || !/^\d{4}$/.test(newPasscode)) {
      setError('Passcode must be exactly 4 digits')
      return
    }

    addUser(newName.trim(), newPasscode)
    setNewName('')
    setNewPasscode('')
    setIsAdding(false)
    setError('')
  }

  const handleEdit = (user) => {
    setEditingId(user.id)
    setEditName(user.name)
    setEditPasscode(user.passcode)
    setError('')
  }

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      setError('Name is required')
      return
    }
    if (editPasscode.length !== 4 || !/^\d{4}$/.test(editPasscode)) {
      setError('Passcode must be exactly 4 digits')
      return
    }

    updateUser(editingId, { name: editName.trim(), passcode: editPasscode })
    setEditingId(null)
    setEditName('')
    setEditPasscode('')
    setError('')
  }

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const success = deleteUser(userId)
      if (!success) {
        alert('Cannot delete this user. You cannot delete the current user or the last remaining user.')
      }
    }
  }

  const togglePasscodeVisibility = (userId) => {
    setShowPasscode(prev => ({ ...prev, [userId]: !prev[userId] }))
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <h2 className="management-title">Manage Users</h2>
        <button
          className="add-user-btn"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {error && <p className="management-error">{error}</p>}

      {/* Add new user form */}
      {isAdding && (
        <div className="user-form">
          <div className="user-form-row">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="user-form-input"
              autoFocus
            />
            <input
              type="text"
              placeholder="4-digit passcode"
              value={newPasscode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                setNewPasscode(val)
              }}
              className="user-form-input user-form-input-small"
              maxLength={4}
            />
            <button className="user-form-btn save" onClick={handleAdd}>
              <Check size={18} />
            </button>
            <button
              className="user-form-btn cancel"
              onClick={() => {
                setIsAdding(false)
                setNewName('')
                setNewPasscode('')
                setError('')
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="users-list">
        {users.map(user => (
          <div
            key={user.id}
            className={`user-item ${currentUser?.id === user.id ? 'current' : ''}`}
          >
            {editingId === user.id ? (
              <div className="user-form-row">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="user-form-input"
                  autoFocus
                />
                <input
                  type="text"
                  value={editPasscode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setEditPasscode(val)
                  }}
                  className="user-form-input user-form-input-small"
                  maxLength={4}
                />
                <button className="user-form-btn save" onClick={handleSaveEdit}>
                  <Check size={18} />
                </button>
                <button
                  className="user-form-btn cancel"
                  onClick={() => {
                    setEditingId(null)
                    setError('')
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="user-info">
                  <div className="user-avatar">
                    <User size={20} />
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-passcode">
                      {showPasscode[user.id] ? user.passcode : '••••'}
                      <button
                        className="passcode-toggle"
                        onClick={() => togglePasscodeVisibility(user.id)}
                      >
                        {showPasscode[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </span>
                  </div>
                  {currentUser?.id === user.id && (
                    <span className="current-badge">You</span>
                  )}
                </div>
                <div className="user-actions">
                  <button
                    className="user-action-btn edit"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="user-action-btn delete"
                    onClick={() => handleDelete(user.id)}
                    disabled={currentUser?.id === user.id || users.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <button
        className="back-to-app-btn"
        onClick={() => setView('list')}
      >
        Back to App
      </button>
    </div>
  )
}
