import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Loader2, AlertTriangle, Camera, QrCode } from 'lucide-react'
import { VoiceRecorder } from './VoiceRecorder'
import { BusinessCardScanner } from './BusinessCardScanner'
import { QRBadgeScanner } from './QRBadgeScanner'

const INTEREST_OPTIONS = ['SS26', 'F26', 'Core', 'Reorder', 'New Account']

const TAG_OPTIONS = [
  { value: 'follow-up-urgent', label: 'Follow-up Urgent', color: '#E85D5D' },
  { value: 'send-catalog', label: 'Send Catalog', color: '#3B82F6' },
  { value: 'call-back', label: 'Call Back', color: '#F5A623' }
]

const TEMPERATURE_OPTIONS = [
  { value: 'hot', label: 'HOT LEAD', emoji: '🔥' },
  { value: 'warm', label: 'WARM', emoji: '☀️' },
  { value: 'browsing', label: 'BROWSING', emoji: '👀' }
]

export function LeadForm() {
  const { view, editingLead, addLead, updateLead, cancelEdit, currentUser, setView, leads } = useApp()

  const [formData, setFormData] = useState({
    contactName: '',
    storeName: '',
    email: '',
    phone: '',
    zipCode: '',
    city: '',
    state: '',
    interests: [],
    tags: [],
    temperature: '',
    notes: '',
    voiceNote: null
  })

  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLookingUpZip, setIsLookingUpZip] = useState(false)
  const [zipError, setZipError] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)

  const isEditing = view === 'edit' && editingLead

  // Duplicate detection
  const potentialDuplicates = useMemo(() => {
    if (isEditing) return []

    const duplicates = []
    const storeName = formData.storeName?.toLowerCase().trim()
    const contactName = formData.contactName?.toLowerCase().trim()
    const email = formData.email?.toLowerCase().trim()
    const phone = formData.phone?.replace(/\D/g, '')

    if (!storeName && !contactName && !email && !phone) return []

    leads.forEach(lead => {
      let matchScore = 0
      let matchReasons = []

      // Check store name (fuzzy match)
      if (storeName && lead.storeName?.toLowerCase().includes(storeName)) {
        matchScore += 2
        matchReasons.push('store')
      }

      // Check contact name
      if (contactName && lead.contactName?.toLowerCase().includes(contactName)) {
        matchScore += 2
        matchReasons.push('name')
      }

      // Check email (exact match)
      if (email && lead.email?.toLowerCase() === email) {
        matchScore += 3
        matchReasons.push('email')
      }

      // Check phone (normalized)
      if (phone && phone.length >= 7 && lead.phone?.replace(/\D/g, '').includes(phone)) {
        matchScore += 3
        matchReasons.push('phone')
      }

      if (matchScore >= 2) {
        duplicates.push({ lead, matchScore, matchReasons })
      }
    })

    return duplicates.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
  }, [leads, formData.storeName, formData.contactName, formData.email, formData.phone, isEditing])

  useEffect(() => {
    if (isEditing) {
      setFormData({
        contactName: editingLead.contactName || '',
        storeName: editingLead.storeName || '',
        email: editingLead.email || '',
        phone: editingLead.phone || '',
        zipCode: editingLead.zipCode || '',
        city: editingLead.city || '',
        state: editingLead.state || '',
        interests: editingLead.interests || [],
        tags: editingLead.tags || [],
        temperature: editingLead.temperature || '',
        notes: editingLead.notes || '',
        voiceNote: editingLead.voiceNote || null
      })
    } else {
      setFormData({
        contactName: '',
        storeName: '',
        email: '',
        phone: '',
        zipCode: '',
        city: '',
        state: '',
        interests: [],
        tags: [],
        temperature: '',
        notes: '',
        voiceNote: null
      })
    }
    setErrors({})
    setZipError('')
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

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  // Auto-lookup ZIP code
  const lookupZipCode = async (zip) => {
    if (zip.length !== 5 || !/^\d{5}$/.test(zip)) {
      return
    }

    setIsLookingUpZip(true)
    setZipError('')

    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (response.ok) {
        const data = await response.json()
        if (data.places && data.places.length > 0) {
          const place = data.places[0]
          setFormData(prev => ({
            ...prev,
            city: place['place name'],
            state: place['state abbreviation']
          }))
        }
      } else {
        setZipError('ZIP code not found')
      }
    } catch (error) {
      console.error('ZIP lookup error:', error)
      setZipError('Could not lookup ZIP')
    } finally {
      setIsLookingUpZip(false)
    }
  }

  const handleZipChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5)
    updateField('zipCode', value)
    setZipError('')

    // Auto-lookup when 5 digits entered
    if (value.length === 5) {
      lookupZipCode(value)
    } else {
      // Clear city/state if ZIP is incomplete
      setFormData(prev => ({ ...prev, city: '', state: '' }))
    }
  }

  const handleScanComplete = (scannedData) => {
    setFormData(prev => ({
      ...prev,
      contactName: scannedData.contactName || prev.contactName,
      storeName: scannedData.storeName || prev.storeName,
      email: scannedData.email || prev.email,
      phone: scannedData.phone || prev.phone,
      city: scannedData.city || prev.city,
      state: scannedData.state || prev.state
    }))
    setShowScanner(false)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsSaving(true)

    try {
      const leadData = {
        contactName: formData.contactName,
        storeName: formData.storeName,
        email: formData.email,
        phone: formData.phone,
        zipCode: formData.zipCode,
        city: formData.city,
        state: formData.state,
        interests: formData.interests,
        tags: formData.tags,
        temperature: formData.temperature,
        notes: formData.notes,
        voiceNote: formData.voiceNote
      }

      if (isEditing) {
        updateLead(editingLead.id, leadData)
      } else {
        addLead({
          ...leadData,
          createdBy: currentUser.name
        })
      }

      // Reset form for new entry
      setFormData({
        contactName: '',
        storeName: '',
        email: '',
        phone: '',
        zipCode: '',
        city: '',
        state: '',
        interests: [],
        tags: [],
        temperature: '',
        notes: '',
        voiceNote: null
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
      <div className="form-header-row">
        <h2 className="form-title">{isEditing ? 'Edit Visitor' : 'New Visitor'}</h2>
        {!isEditing && (
          <div className="scan-buttons">
            <button
              type="button"
              className="scan-btn"
              onClick={() => setShowQRScanner(true)}
            >
              <QrCode size={18} />
              <span>Scan Badge</span>
            </button>
            <button
              type="button"
              className="scan-btn scan-btn-secondary"
              onClick={() => setShowScanner(true)}
            >
              <Camera size={18} />
              <span>Scan Card</span>
            </button>
          </div>
        )}
      </div>

      {showQRScanner && (
        <QRBadgeScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {showScanner && (
        <BusinessCardScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanner(false)}
        />
      )}

      {potentialDuplicates.length > 0 && (
        <div className="duplicate-warning">
          <div className="duplicate-header">
            <AlertTriangle size={18} />
            <span>Potential duplicate{potentialDuplicates.length > 1 ? 's' : ''} found!</span>
          </div>
          <div className="duplicate-list">
            {potentialDuplicates.map(({ lead, matchReasons }) => (
              <div key={lead.id} className="duplicate-item">
                <strong>{lead.contactName}</strong> - {lead.storeName}
                <span className="match-reasons">
                  (matches: {matchReasons.join(', ')})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

        {/* ZIP Code */}
        <div className="form-group">
          <label className="form-label">
            ZIP CODE
            {isLookingUpZip && <Loader2 size={14} className="zip-loader" />}
          </label>
          <input
            type="text"
            className={`form-input ${zipError ? 'has-zip-error' : ''}`}
            placeholder="90210"
            value={formData.zipCode}
            onChange={handleZipChange}
            maxLength={5}
            inputMode="numeric"
          />
          {zipError && <span className="zip-error-text">{zipError}</span>}
        </div>

        {/* City / State (auto-populated) */}
        <div className="form-group">
          <label className="form-label">CITY / STATE</label>
          <input
            type="text"
            className="form-input form-input-readonly"
            placeholder="Auto-fills from ZIP"
            value={formData.city && formData.state ? `${formData.city}, ${formData.state}` : ''}
            readOnly
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

        {/* Follow-up Tags - Full width */}
        <div className="form-group form-group-full">
          <label className="form-label">FOLLOW-UP TAGS</label>
          <div className="tags-grid">
            {TAG_OPTIONS.map(tag => (
              <button
                key={tag.value}
                type="button"
                className={`tag-btn tag-btn-colored ${formData.tags.includes(tag.value) ? 'selected' : ''}`}
                style={formData.tags.includes(tag.value) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                onClick={() => toggleTag(tag.value)}
              >
                {tag.label}
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

        {/* Voice Note - Full width */}
        <div className="form-group form-group-full">
          <label className="form-label">VOICE NOTE</label>
          <VoiceRecorder
            value={formData.voiceNote}
            onChange={(voiceNote) => updateField('voiceNote', voiceNote)}
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
