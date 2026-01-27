import React from 'react'
import { useApp } from '../context/AppContext'
import { Users, Flame, Sun, Eye } from 'lucide-react'

export function StatsBar() {
  const { getStats, filter, setFilter } = useApp()
  const stats = getStats()

  const statItems = [
    { key: 'all', label: 'Total', value: stats.total, icon: Users, color: 'navy' },
    { key: 'hot', label: 'Hot', value: stats.hot, icon: Flame, color: 'hot' },
    { key: 'warm', label: 'Warm', value: stats.warm, icon: Sun, color: 'warm' },
    { key: 'browsing', label: 'Browsing', value: stats.browsing, icon: Eye, color: 'browsing' },
  ]

  return (
    <div className="stats-bar">
      {statItems.map(({ key, label, value, icon: Icon, color }) => (
        <button
          key={key}
          className={`stat-item stat-${color} ${filter === key ? 'active' : ''}`}
          onClick={() => setFilter(key)}
        >
          <Icon size={18} />
          <span className="stat-value">{value}</span>
          <span className="stat-label">{label}</span>
        </button>
      ))}
    </div>
  )
}
