import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Target, TrendingUp, Award } from 'lucide-react'

const DAILY_GOAL = 30

export function DailyGoal() {
  const { leads } = useApp()

  const todayStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayLeads = leads.filter(lead => {
      const leadDate = new Date(lead.timestamp)
      leadDate.setHours(0, 0, 0, 0)
      return leadDate.getTime() === today.getTime()
    })

    const count = todayLeads.length
    const percentage = Math.min((count / DAILY_GOAL) * 100, 100)
    const isGoalMet = count >= DAILY_GOAL

    return { count, percentage, isGoalMet }
  }, [leads])

  return (
    <div className={`daily-goal ${todayStats.isGoalMet ? 'goal-met' : ''}`}>
      <div className="goal-header">
        {todayStats.isGoalMet ? <Award size={16} /> : <Target size={16} />}
        <span className="goal-title">Today's Goal</span>
      </div>
      <div className="goal-progress">
        <div className="goal-bar">
          <div
            className="goal-fill"
            style={{ width: `${todayStats.percentage}%` }}
          />
        </div>
        <span className="goal-count">
          {todayStats.count}/{DAILY_GOAL}
        </span>
      </div>
      {todayStats.isGoalMet && (
        <div className="goal-celebration">Goal achieved!</div>
      )}
    </div>
  )
}
