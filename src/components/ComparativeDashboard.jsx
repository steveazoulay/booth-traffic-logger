import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { ArrowLeft, TrendingUp, Users, Flame, RefreshCw } from 'lucide-react'

const COLORS = {
  chicago: '#1B2A4A',
  vancouver: '#C9A962',
  hot: '#E85D5D',
  warm: '#F5A623',
  browsing: '#6B7280'
}

const SHOW_NAMES = {
  chicago: 'Chicago Collective',
  vancouver: 'Metro Show'
}

export function ComparativeDashboard() {
  const { setView } = useApp()
  const [chicagoLeads, setChicagoLeads] = useState([])
  const [vancouverLeads, setVancouverLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setIsLoading(true)

    // Fetch leads from both shows
    const [chicagoResult, vancouverResult] = await Promise.all([
      supabase.from('leads').select('*').eq('show_id', 'chicago'),
      supabase.from('leads').select('*').eq('show_id', 'vancouver')
    ])

    setChicagoLeads(chicagoResult.data || [])
    setVancouverLeads(vancouverResult.data || [])
    setIsLoading(false)
  }

  // Summary stats
  const summaryData = useMemo(() => {
    const getStats = (leads) => ({
      total: leads.length,
      hot: leads.filter(l => l.temperature === 'hot').length,
      warm: leads.filter(l => l.temperature === 'warm').length,
      browsing: leads.filter(l => l.temperature === 'browsing').length
    })

    return {
      chicago: getStats(chicagoLeads),
      vancouver: getStats(vancouverLeads)
    }
  }, [chicagoLeads, vancouverLeads])

  // Comparison bar data
  const comparisonData = useMemo(() => [
    {
      name: 'Total Leads',
      Chicago: summaryData.chicago.total,
      Vancouver: summaryData.vancouver.total
    },
    {
      name: 'Hot Leads',
      Chicago: summaryData.chicago.hot,
      Vancouver: summaryData.vancouver.hot
    },
    {
      name: 'Warm Leads',
      Chicago: summaryData.chicago.warm,
      Vancouver: summaryData.vancouver.warm
    },
    {
      name: 'Browsing',
      Chicago: summaryData.chicago.browsing,
      Vancouver: summaryData.vancouver.browsing
    }
  ], [summaryData])

  // Daily comparison (last 7 days)
  const dailyComparisonData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      const chicagoCount = chicagoLeads.filter(lead => {
        const leadDate = new Date(lead.created_at)
        return leadDate >= date && leadDate < nextDay
      }).length

      const vancouverCount = vancouverLeads.filter(lead => {
        const leadDate = new Date(lead.created_at)
        return leadDate >= date && leadDate < nextDay
      }).length

      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Chicago: chicagoCount,
        Vancouver: vancouverCount
      })
    }
    return days
  }, [chicagoLeads, vancouverLeads])

  // Interest comparison
  const interestComparisonData = useMemo(() => {
    const interests = ['New Account', 'Reorder', 'SS26', 'F26', 'Core']

    return interests.map(interest => {
      const chicagoCount = chicagoLeads.filter(l =>
        (l.interests || []).includes(interest)
      ).length
      const vancouverCount = vancouverLeads.filter(l =>
        (l.interests || []).includes(interest)
      ).length

      return {
        name: interest,
        Chicago: chicagoCount,
        Vancouver: vancouverCount
      }
    })
  }, [chicagoLeads, vancouverLeads])

  if (isLoading) {
    return (
      <div className="comparative-dashboard">
        <div className="dashboard-loading">
          <RefreshCw size={32} className="loading-spinner" />
          <p>Loading data from both shows...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="comparative-dashboard">
      <div className="dashboard-header">
        <button className="back-btn" onClick={() => setView('stats')}>
          <ArrowLeft size={20} />
          <span>Back to Stats</span>
        </button>
        <h2 className="dashboard-title">Comparative Dashboard</h2>
        <button className="refresh-btn" onClick={loadAllData}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="comparison-summary">
        <div className="summary-show chicago">
          <div className="show-header">
            <span className="show-flag">🇺🇸</span>
            <h3>Chicago Collective</h3>
          </div>
          <div className="show-stats">
            <div className="big-stat">
              <span className="stat-number">{summaryData.chicago.total}</span>
              <span className="stat-label">Total Leads</span>
            </div>
            <div className="mini-stats">
              <span className="mini-stat hot">🔥 {summaryData.chicago.hot}</span>
              <span className="mini-stat warm">☀️ {summaryData.chicago.warm}</span>
              <span className="mini-stat browse">👀 {summaryData.chicago.browsing}</span>
            </div>
          </div>
        </div>

        <div className="vs-badge">VS</div>

        <div className="summary-show vancouver">
          <div className="show-header">
            <span className="show-flag">🇨🇦</span>
            <h3>Metro Show</h3>
          </div>
          <div className="show-stats">
            <div className="big-stat">
              <span className="stat-number">{summaryData.vancouver.total}</span>
              <span className="stat-label">Total Leads</span>
            </div>
            <div className="mini-stats">
              <span className="mini-stat hot">🔥 {summaryData.vancouver.hot}</span>
              <span className="mini-stat warm">☀️ {summaryData.vancouver.warm}</span>
              <span className="mini-stat browse">👀 {summaryData.vancouver.browsing}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Comparison Chart */}
      <div className="chart-card">
        <h3 className="chart-title">Lead Comparison</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="Chicago" fill={COLORS.chicago} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Vancouver" fill={COLORS.vancouver} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Trend Comparison */}
      <div className="chart-card">
        <h3 className="chart-title">Daily Trend (Last 7 Days)</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff' }}
                labelFormatter={(label, payload) => payload[0]?.payload?.date || label}
              />
              <Legend />
              <Bar dataKey="Chicago" fill={COLORS.chicago} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Vancouver" fill={COLORS.vancouver} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interest Comparison */}
      <div className="chart-card">
        <h3 className="chart-title">Interest Comparison</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={interestComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={90} />
              <Tooltip
                contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="Chicago" fill={COLORS.chicago} radius={[0, 4, 4, 0]} />
              <Bar dataKey="Vancouver" fill={COLORS.vancouver} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
