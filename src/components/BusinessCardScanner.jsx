import React, { useState, useRef, useEffect } from 'react'
import { Camera, X, Loader2, Check, RotateCcw, Upload } from 'lucide-react'
import Tesseract from 'tesseract.js'

export function BusinessCardScanner({ onScanComplete, onClose }) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  // Attach stream to video when video element is ready
  useEffect(() => {
    if (isCapturing && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play()
        setCameraReady(true)
      }
    }
  }, [isCapturing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    setError(null)
    setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      streamRef.current = stream
      setIsCapturing(true)
    } catch (err) {
      console.error('Camera error:', err)
      setError('Could not access camera. Please use file upload instead.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageData)
      stopCamera()
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCapturedImage(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setError(null)
    startCamera()
  }

  const parseBusinessCard = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    const result = {
      contactName: '',
      storeName: '',
      email: '',
      phone: '',
      city: '',
      state: ''
    }

    // Email pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    // Phone pattern (various formats)
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/
    // US State abbreviations
    const stateRegex = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i

    lines.forEach((line, index) => {
      // Find email
      const emailMatch = line.match(emailRegex)
      if (emailMatch && !result.email) {
        result.email = emailMatch[0].toLowerCase()
      }

      // Find phone
      const phoneMatch = line.match(phoneRegex)
      if (phoneMatch && !result.phone) {
        result.phone = phoneMatch[0]
      }

      // Find state (to help identify city line)
      const stateMatch = line.match(stateRegex)
      if (stateMatch) {
        result.state = stateMatch[1].toUpperCase()
        // Try to extract city from same line
        const cityPart = line.replace(stateRegex, '').replace(/[,\s]+$/, '').trim()
        if (cityPart && !result.city) {
          result.city = cityPart.split(',')[0].trim()
        }
      }
    })

    // Try to find name (usually first or second line, all caps or title case)
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i]
      // Skip if it looks like email, phone, or address
      if (emailRegex.test(line) || phoneRegex.test(line)) continue
      if (/\d{5}/.test(line)) continue // ZIP code

      // Check if it looks like a name (2-3 words, letters only)
      const nameMatch = line.match(/^[A-Za-z]+\s+[A-Za-z]+(?:\s+[A-Za-z]+)?$/)
      if (nameMatch && !result.contactName) {
        result.contactName = line
        continue
      }

      // Otherwise might be company name
      if (!result.storeName && line.length > 2 && !result.contactName) {
        result.storeName = line
      } else if (result.contactName && !result.storeName && line.length > 2) {
        result.storeName = line
      }
    }

    return result
  }

  const processImage = async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      const result = await Tesseract.recognize(capturedImage, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })

      const extractedData = parseBusinessCard(result.data.text)
      onScanComplete(extractedData)
    } catch (err) {
      console.error('OCR error:', err)
      setError('Could not read the business card. Please try again or enter manually.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>Scan Business Card</h3>
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

          {!isCapturing && !capturedImage && (
            <div className="scanner-options">
              <button className="scanner-option-btn" onClick={startCamera}>
                <Camera size={24} />
                <span>Take Photo</span>
              </button>
              <button
                className="scanner-option-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} />
                <span>Upload Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {isCapturing && (
            <div className="scanner-camera">
              {!cameraReady && (
                <div className="scanner-loading">
                  <Loader2 size={32} className="scanner-spinner" />
                  <p>Starting camera...</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="scanner-video"
                style={{ display: cameraReady ? 'block' : 'none' }}
              />
              <div className="scanner-camera-controls">
                <button className="scanner-cancel-btn" onClick={stopCamera}>
                  Cancel
                </button>
                <button
                  className="scanner-capture-btn"
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                >
                  <Camera size={24} />
                </button>
              </div>
            </div>
          )}

          {capturedImage && !isProcessing && (
            <div className="scanner-preview">
              <img src={capturedImage} alt="Captured" className="scanner-image" />
              <div className="scanner-preview-controls">
                <button className="scanner-retake-btn" onClick={retakePhoto}>
                  <RotateCcw size={18} />
                  <span>Retake</span>
                </button>
                <button className="scanner-process-btn" onClick={processImage}>
                  <Check size={18} />
                  <span>Extract Info</span>
                </button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="scanner-processing">
              <Loader2 size={40} className="scanner-spinner" />
              <p>Reading business card...</p>
              <div className="scanner-progress">
                <div
                  className="scanner-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="scanner-progress-text">{progress}%</span>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}
