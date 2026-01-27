import React, { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, Trash2, Volume2 } from 'lucide-react'

export function VoiceRecorder({ value, onChange }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioRef = useRef(null)
  const timerRef = useRef(null)

  // Initialize audio from value prop (base64)
  useEffect(() => {
    if (value && !audioUrl) {
      setAudioUrl(value)
    }
  }, [value])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [])

  const startRecording = async () => {
    setError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Convert to base64 for storage
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result
          onChange?.(base64)
        }
        reader.readAsDataURL(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Max 60 seconds
          if (prev >= 60) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Recording error:', err)
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied')
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found')
      } else {
        setError('Could not start recording')
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const deleteRecording = () => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    onChange?.(null)
    setRecordingTime(0)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="voice-recorder">
      {error && (
        <div className="voice-error">{error}</div>
      )}

      {!audioUrl ? (
        // Recording controls
        <div className="voice-controls">
          {isRecording ? (
            <>
              <div className="recording-indicator">
                <span className="rec-dot"></span>
                <span className="rec-time">{formatTime(recordingTime)}</span>
              </div>
              <button
                type="button"
                className="voice-btn stop-btn"
                onClick={stopRecording}
              >
                <Square size={18} />
                <span>Stop</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="voice-btn record-btn"
              onClick={startRecording}
            >
              <Mic size={18} />
              <span>Record Voice Note</span>
            </button>
          )}
        </div>
      ) : (
        // Playback controls
        <div className="voice-playback">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
          />
          <button
            type="button"
            className="voice-btn play-btn"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div className="playback-info">
            <Volume2 size={14} />
            <span>Voice note recorded</span>
          </div>
          <button
            type="button"
            className="voice-btn delete-btn"
            onClick={deleteRecording}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
