import React, { useState, useRef, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, QrCode, Loader2 } from 'lucide-react'

export function QRBadgeScanner({ onScanComplete, onClose }) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    setError(null)
    setIsScanning(true)

    try {
      const html5QrCode = new Html5Qrcode("qr-reader")
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleScanSuccess(decodedText)
        },
        (errorMessage) => {
          // Ignore scan errors (normal when no QR in view)
        }
      )
    } catch (err) {
      console.error('QR Scanner error:', err)
      setError('Could not access camera. Please check permissions.')
      setIsScanning(false)
    }
  }

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
      html5QrCodeRef.current = null
    }
    setIsScanning(false)
  }

  const parseVCard = (text) => {
    const result = {
      contactName: '',
      storeName: '',
      email: '',
      phone: '',
      city: '',
      state: ''
    }

    // Check if it's a vCard
    if (text.includes('BEGIN:VCARD') || text.includes('VCARD')) {
      const lines = text.split(/[\r\n]+/)

      lines.forEach(line => {
        // Full name
        if (line.startsWith('FN:') || line.startsWith('FN;')) {
          result.contactName = line.split(':').slice(1).join(':').trim()
        }
        // Name (N:Last;First;Middle;Prefix;Suffix)
        else if (line.startsWith('N:') || line.startsWith('N;')) {
          const nameParts = line.split(':').slice(1).join(':').split(';')
          const lastName = nameParts[0] || ''
          const firstName = nameParts[1] || ''
          if (!result.contactName && (firstName || lastName)) {
            result.contactName = `${firstName} ${lastName}`.trim()
          }
        }
        // Organization
        else if (line.startsWith('ORG:') || line.startsWith('ORG;')) {
          result.storeName = line.split(':').slice(1).join(':').replace(/;/g, ' ').trim()
        }
        // Email
        else if (line.startsWith('EMAIL') && line.includes(':')) {
          result.email = line.split(':').slice(1).join(':').trim().toLowerCase()
        }
        // Phone
        else if ((line.startsWith('TEL') || line.startsWith('PHONE')) && line.includes(':')) {
          if (!result.phone) {
            result.phone = line.split(':').slice(1).join(':').trim()
          }
        }
        // Address
        else if (line.startsWith('ADR') && line.includes(':')) {
          // ADR format: PO Box;Extended;Street;City;State;ZIP;Country
          const addrParts = line.split(':').slice(1).join(':').split(';')
          if (addrParts.length >= 5) {
            result.city = addrParts[3] || ''
            result.state = addrParts[4] || ''
          }
        }
      })
    }
    // Check for JSON format (some systems use this)
    else if (text.startsWith('{')) {
      try {
        const data = JSON.parse(text)
        result.contactName = data.name || data.firstName ? `${data.firstName || ''} ${data.lastName || ''}`.trim() : ''
        result.storeName = data.company || data.organization || ''
        result.email = data.email || ''
        result.phone = data.phone || data.mobile || ''
        result.city = data.city || ''
        result.state = data.state || data.region || ''
      } catch (e) {
        // Not valid JSON
      }
    }
    // Plain text - try to extract info
    else {
      // Email pattern
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
      if (emailMatch) {
        result.email = emailMatch[0].toLowerCase()
      }

      // Phone pattern
      const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/)
      if (phoneMatch) {
        result.phone = phoneMatch[0]
      }

      // Try to get name (first line or first non-email/phone text)
      const lines = text.split(/[\r\n,;]+/).map(l => l.trim()).filter(l => l.length > 2)
      for (const line of lines) {
        if (!line.includes('@') && !/\d{7,}/.test(line.replace(/\D/g, ''))) {
          if (!result.contactName) {
            result.contactName = line
          } else if (!result.storeName) {
            result.storeName = line
          }
        }
      }
    }

    return result
  }

  const handleScanSuccess = async (decodedText) => {
    await stopScanner()

    const parsedData = parseVCard(decodedText)
    setScanResult({ raw: decodedText, parsed: parsedData })
  }

  const handleConfirm = () => {
    if (scanResult?.parsed) {
      onScanComplete(scanResult.parsed)
    }
  }

  const handleRescan = () => {
    setScanResult(null)
    startScanner()
  }

  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>Scan Badge QR Code</h3>
          <button className="scanner-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="scanner-content">
          {error && (
            <div className="scanner-error">
              {error}
            </div>
          )}

          {!isScanning && !scanResult && (
            <div className="scanner-options">
              <button className="scanner-option-btn" onClick={startScanner}>
                <QrCode size={24} />
                <span>Start Scanning</span>
              </button>
              <p className="scanner-hint">Point camera at badge QR code</p>
            </div>
          )}

          {isScanning && (
            <div className="qr-scanner-container">
              <div id="qr-reader" ref={scannerRef}></div>
              <div className="qr-scanner-overlay">
                <div className="qr-scanner-frame"></div>
              </div>
              <button className="scanner-cancel-btn qr-cancel" onClick={stopScanner}>
                Cancel
              </button>
            </div>
          )}

          {scanResult && (
            <div className="qr-result">
              <div className="qr-result-header">
                <QrCode size={20} />
                <span>QR Code Scanned!</span>
              </div>

              <div className="qr-result-data">
                {scanResult.parsed.contactName && (
                  <div className="qr-result-item">
                    <span className="qr-label">Name:</span>
                    <span className="qr-value">{scanResult.parsed.contactName}</span>
                  </div>
                )}
                {scanResult.parsed.storeName && (
                  <div className="qr-result-item">
                    <span className="qr-label">Company:</span>
                    <span className="qr-value">{scanResult.parsed.storeName}</span>
                  </div>
                )}
                {scanResult.parsed.email && (
                  <div className="qr-result-item">
                    <span className="qr-label">Email:</span>
                    <span className="qr-value">{scanResult.parsed.email}</span>
                  </div>
                )}
                {scanResult.parsed.phone && (
                  <div className="qr-result-item">
                    <span className="qr-label">Phone:</span>
                    <span className="qr-value">{scanResult.parsed.phone}</span>
                  </div>
                )}
                {(scanResult.parsed.city || scanResult.parsed.state) && (
                  <div className="qr-result-item">
                    <span className="qr-label">Location:</span>
                    <span className="qr-value">
                      {[scanResult.parsed.city, scanResult.parsed.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {!scanResult.parsed.contactName && !scanResult.parsed.storeName &&
                 !scanResult.parsed.email && !scanResult.parsed.phone && (
                  <div className="qr-result-empty">
                    <p>Could not extract contact info from QR code.</p>
                    <p className="qr-raw-label">Raw data:</p>
                    <pre className="qr-raw-data">{scanResult.raw.substring(0, 200)}</pre>
                  </div>
                )}
              </div>

              <div className="qr-result-actions">
                <button className="scanner-retake-btn" onClick={handleRescan}>
                  Scan Again
                </button>
                <button
                  className="scanner-process-btn"
                  onClick={handleConfirm}
                  disabled={!scanResult.parsed.contactName && !scanResult.parsed.email}
                >
                  Use This Info
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
