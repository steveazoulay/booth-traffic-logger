import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Flame, Sun, Eye, Mail, Phone, MapPin, Clock,
  Edit3, Trash2, MoreVertical, X, Tag
} from 'lucide-react'

const temperatureConfig = {
  hot: { icon: Flame, label: 'Hot Lead', emoji: '' },
  warm: { icon: Sun, label: 'Warm', emoji: '' },
  browsing: { icon: Eye, label: 'Just Browsing', emoji: '' }
}

const tagConfig = {
  'follow-up-urgent': { label: 'Follow-up Urgent', color: '#E85D5D' },
  'send-catalog': { label: 'Send Catalog', color: '#3B82F6' },
  'call-back': { label: 'Call Back', color: '#F5A623' },
  'demo-requested': { label: 'Demo Requested', color: '#8B5CF6' },
  'qualified-prospect': { label: 'Qualified Prospect', color: '#10B981' }
}

export function LeadCard({ lead }) {
  const { startEdit, deleteLead } = useApp()
  const [showActions, setShowActions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const temp = temperatureConfig[lead.temperature] || temperatureConfig.browsing
  const TempIcon = temp.icon

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const handleDelete = () => {
    if (confirmDelete) {
      deleteLead(lead.id)
      setConfirmDelete(false)
      setShowActions(false)
    } else {
      setConfirmDelete(true)
    }
  }

  return (
    <div className={`lead-card lead-card-${lead.temperature}`}>
      <div className="card-header">
        <div className="card-title">
          <h3 className="contact-name">{lead.contactName}</h3>
          <p className="store-name">{lead.storeName}</p>
        </div>

        <button
          className="action-toggle"
          onClick={() => setShowActions(!showActions)}
          aria-label="Actions"
        >
          {showActions ? <X size={20} /> : <MoreVertical size={20} />}
        </button>
      </div>

      {showActions && (
        <div className="card-actions">
          <button className="action-btn edit-btn" onClick={() => startEdit(lead)}>
            <Edit3 size={18} />
            <span>Edit</span>
          </button>
          <button
            className={`action-btn delete-btn ${confirmDelete ? 'confirm' : ''}`}
            onClick={handleDelete}
          >
            <Trash2 size={18} />
            <span>{confirmDelete ? 'Tap to confirm' : 'Delete'}</span>
          </button>
        </div>
      )}

      <div className="card-body">
        <div className={`temperature-badge temp-${lead.temperature}`}>
          <TempIcon size={14} />
          <span>{temp.label}</span>
        </div>

        <div className="card-details">
          {(lead.city || lead.state) && (
            <div className="detail-row">
              <MapPin size={16} />
              <span>{[lead.city, lead.state].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {lead.email && (
            <a href={`mailto:${lead.email}`} className="detail-row detail-link">
              <Mail size={16} />
              <span>{lead.email}</span>
            </a>
          )}

          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="detail-row detail-link">
              <Phone size={16} />
              <span>{lead.phone}</span>
            </a>
          )}
        </div>

        {lead.interests && lead.interests.length > 0 && (
          <div className="interests">
            {lead.interests.map(interest => (
              <span key={interest} className="interest-tag">
                <Tag size={12} />
                {interest}
              </span>
            ))}
          </div>
        )}

        {lead.tags && lead.tags.length > 0 && (
          <div className="follow-up-tags">
            {lead.tags.map(tag => {
              const config = tagConfig[tag]
              return config ? (
                <span
                  key={tag}
                  className="follow-up-tag"
                  style={{ backgroundColor: config.color }}
                >
                  {config.label}
                </span>
              ) : null
            })}
          </div>
        )}

        {lead.notes && (
          <p className="notes">{lead.notes}</p>
        )}

        <div className="card-footer">
          <div className="timestamp">
            <Clock size={14} />
            <span>{formatDate(lead.timestamp)}</span>
          </div>
          {lead.createdBy && (
            <span className="created-by">by {lead.createdBy}</span>
          )}
        </div>
      </div>
    </div>
  )
}
