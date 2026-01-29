import React from 'react'
import { useApp } from '../context/AppContext'
import { MapPin } from 'lucide-react'

const SHOWS = [
  {
    id: '5033fe6c-9427-455e-926b-d4d462eb72f6',
    name: 'Chicago Collective',
    location: 'Chicago, USA',
    badge: 'CHICAGO 2026',
    flag: '🇺🇸'
  },
  {
    id: 'vancouver-2026',
    name: 'Metro Show',
    location: 'Vancouver, Canada',
    badge: 'VANCOUVER 2026',
    flag: '🇨🇦'
  }
]

export function ShowSelect() {
  const { selectShow } = useApp()

  return (
    <div className="app">
      <div className="show-select-container">
        <div className="show-select-header">
          <img src="/logo.png" alt="Stone Rose" className="logo-img-loading" />
          <h1 className="show-select-title">Select Show</h1>
        </div>

        <div className="show-select-grid">
          {SHOWS.map(show => (
            <button
              key={show.id}
              className="show-card"
              onClick={() => selectShow(show.id)}
            >
              <span className="show-flag">{show.flag}</span>
              <span className="show-name">{show.name}</span>
              <span className="show-location">
                <MapPin size={14} />
                {show.location}
              </span>
              <span className="show-badge">{show.badge}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { SHOWS }
