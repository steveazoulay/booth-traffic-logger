import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const INTEREST_OPTIONS = ['SS26', 'F26', 'Core', 'Reorder', 'New Account']

const TEMPERATURE_OPTIONS = [
  { value: 'hot', label: 'HOT LEAD', emoji: '🔥' },
  { value: 'warm', label: 'WARM', emoji: '☀️' },
  { value: 'browsing', label: 'BROWSING', emoji: '👀' }
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export function LeadForm() {
  const { view, editingLead, addLead, updateLead, cancelEdit, currentUser, setView } = useApp()

  const [formData, setFormData] = useState({
    contactName: '',
    storeName: '',
    email: '',
    phone: '',
    cityState: '',
    interests: [],
    temperature: '',
    notes: ''
  })

  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = view === 'edit' && editingLead

  useEffect(() => {
    if (isEditing) {
      setFormData({
        contactName: editingLead.contactName || '',
        storeName: editingLead.storeName || '',
        email: editingLead.email || '',
        phone: editingLead.phone || '',
        cityState: [editingLead.city, editingLead.state].filter(Boolean).join(', ') || '',
        interests: editingLead.interests || [],
        temperature: editingLead.temperature || '',
        notes: editingLead.notes || ''
      })
    } else {
      setFormData({
        contactName: '',
        storeName: '',
        email: '',
        phone: '',
        cityState: '',
        interests: [],
        temperature: '',
        notes: ''
      })
    }
    setErrors({})
  }, [isEditing, editingLead])

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Required'
    }
    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Required'
    }
    if (!formData.temperature) {
      newErrors.temperature = 'Please select lead temperature'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const parseCityState = (cityState) => {
    if (!cityState) return { city: '', state: '' }
    const parts = cityState.split(',').map(p => p.trim())
    if (parts.length >= 2) {
      return { city: parts[0], state: parts[1] }
    }
    return { city: parts[0] || '', state: '' }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsSaving(true)

    try {
      const { city, state } = parseCityState(formData.cityState)
      const leadData = {
        contactName: formData.contactName,
        storeName: formData.storeName,
        email: formData.email,
        phone: formData.phone,
        city,
        state,
        interests: formData.interests,
        temperature: formData.temperature,
        notes: formData.notes
      }

      if (isEditing) {
        updateLead(editingLead.id, leadData)
      } else {
        addLead({
          ...leadData,
          createdBy: currentUser
        })
      }

      // Reset form for new entry
      setFormData({
        contactName: '',
        storeName: '',
        email: '',
        phone: '',
        cityState: '',
        interests: [],
        temperature: '',
        notes: ''
      })

      if (isEditing) {
        cancelEdit()
        setView('list')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <h2 className="form-title">{isEditing ? 'Edit Visitor' : 'New Visitor'}</h2>

      <div className="form-grid">
        {/* Contact Name */}
        <div className={`form-group ${errors.contactName ? 'has-error' : ''}`}>
          <label className="form-label">CONTACT NAME *</label>
          <input
            type="text"
            className="form-input"
            placeholder="John Smith"
            value={formData.contactName}
            onChange={(e) => updateField('contactName', e.target.value)}
            autoFocus
          />
        </div>

        {/* Store Name */}
        <div className={`form-group ${errors.storeName ? 'has-error' : ''}`}>
          <label className="form-label">STORE NAME *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Store Name"
            value={formData.storeName}
            onChange={(e) => updateField('storeName', e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label">EMAIL</label>
          <input
            type="email"
            className="form-input"
            placeholder="john@store.com"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </div>

        {/* Phone */}
        <div className="form-group">
          <label className="form-label">PHONE</label>
          <input
            type="tel"
            className="form-input"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </div>

        {/* City / State - Full width */}
        <div className="form-group form-group-full">
          <label className="form-label">CITY / STATE</label>
          <input
            type="text"
            className="form-input"
            placeholder="Chicago, IL"
            value={formData.cityState}
            onChange={(e) => updateField('cityState', e.target.value)}
          />
        </div>

        {/* Interest Tags - Full width */}
        <div className="form-group form-group-full">
          <label className="form-label">INTEREST</label>
          <div className="tags-grid">
            {INTEREST_OPTIONS.map(interest => (
              <button
                key={interest}
                type="button"
                className={`tag-btn ${formData.interests.includes(interest) ? 'selected' : ''}`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Temperature - Full width */}
        <div className={`form-group form-group-full ${errors.temperature ? 'has-error' : ''}`}>
          <label className="form-label">LEAD TEMPERATURE *</label>
          <div className="temperature-grid">
            {TEMPERATURE_OPTIONS.map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                className={`temp-btn temp-btn-${value} ${formData.temperature === value ? 'selected' : ''}`}
                onClick={() => updateField('temperature', value)}
              >
                <span className="temp-emoji">{emoji}</span>
                <span className="temp-label">{label}</span>
              </button>
            ))}
          </div>
          {errors.temperature && <span className="error-text">{errors.temperature}</span>}
        </div>

        {/* Notes - Full width */}
        <div className="form-group form-group-full">
          <label className="form-label">NOTES</label>
          <textarea
            className="form-textarea"
            placeholder="Interested in AERIS collection, asked about minimums..."
            rows={3}
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        className="submit-btn"
        disabled={isSaving}
      >
        {isSaving ? 'SAVING...' : 'SAVE LEAD'}
      </button>
    </form>
  )
}
