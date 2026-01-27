import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const COLORS = {
  hot: '#E85D5D',
  warm: '#F5A623',
  browsing: '#6B7280',
  navy: '#1B2A4A',
  gold: '#C9A962',
  green: '#10B981',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  pink: '#EC4899'
}

export function Charts() {
  const { leads } = useApp()

  // Leads by hour today
  const hourlyData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`,
      count: 0
    }))

    leads.forEach(lead => {
      const date = new Date(lead.timestamp)
      if (date >= today) {
        const hour = date.getHours()
        hours[hour].count++
      }
    })

    // Only show hours from 7am to 8pm for trade show
    return hours.slice(7, 21)
  }, [leads])

  // Leads by day (last 7 days)
  const dailyData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      const count = leads.filter(lead => {
        const leadDate = new Date(lead.timestamp)
        return leadDate >= date && leadDate < nextDay
      }).length

      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      })
    }
    return days
  }, [leads])

  // Temperature distribution
  const temperatureData = useMemo(() => {
    const hot = leads.filter(l => l.temperature === 'hot').length
    const warm = leads.filter(l => l.temperature === 'warm').length
    const browsing = leads.filter(l => l.temperature === 'browsing').length

    return [
      { name: 'Hot', value: hot, color: COLORS.hot },
      { name: 'Warm', value: warm, color: COLORS.warm },
      { name: 'Browsing', value: browsing, color: COLORS.browsing }
    ].filter(d => d.value > 0)
  }, [leads])

  // Interest distribution
  const interestData = useMemo(() => {
    const interests = {
      'New Account': 0,
      'Reorder': 0,
      'SS26': 0,
      'F26': 0,
      'Core': 0
    }

    leads.forEach(lead => {
      (lead.interests || []).forEach(interest => {
        if (interests[interest] !== undefined) {
          interests[interest]++
        }
      })
    })

    return Object.entries(interests).map(([name, value]) => ({
      name,
      value
    })).filter(d => d.value > 0)
  }, [leads])

  // Top states
  const topStatesData = useMemo(() => {
    const stateCounts = {}
    leads.forEach(lead => {
      if (lead.state) {
        stateCounts[lead.state] = (stateCounts[lead.state] || 0) + 1
      }
    })

    return Object.entries(stateCounts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [leads])

  if (leads.length === 0) {
    return (
      <div className="charts-empty">
        <p>No data to display yet. Add some leads to see charts!</p>
      </div>
    )
  }

  return (
    <div className="charts-container">
      {/* Hourly Activity */}
      <div className="chart-card">
        <h3 className="chart-title">Today's Activity (Hourly)</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff' }}
                labelStyle={{ color: '#C9A962' }}
              />
              <Bar dataKey="count" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="chart-card">
        <h3 className="chart-title">Daily Trend (Last 7 Days)</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff' }}
                labelStyle={{ color: '#C9A962' }}
                formatter={(value) => [value, 'Leads']}
                labelFormatter={(label, payload) => payload[0]?.payload?.date || label}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.navy}
                strokeWidth={3}
                dot={{ fill: COLORS.gold, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: COLORS.gold }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Temperature & Interest Side by Side */}
      <div className="charts-row">
        {/* Temperature Distribution */}
        <div className="chart-card chart-card-half">
          <h3 className="chart-title">Lead Temperature</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={temperatureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value, entry) => (
                    <span style={{ color: '#374151' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interest Distribution */}
        <div className="chart-card chart-card-half">
          <h3 className="chart-title">Interests</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={interestData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={80} />
                <Tooltip
                  contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff' }}
                />
                <Bar dataKey="value" fill={COLORS.navy} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top States */}
      {topStatesData.length > 0 && (
        <div className="chart-card">
          <h3 className="chart-title">Top States</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topStatesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff' }}
                  labelStyle={{ color: '#C9A962' }}
                />
                <Bar dataKey="count" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
