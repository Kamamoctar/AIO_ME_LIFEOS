import { differenceInCalendarDays, format } from 'date-fns'
import type { BreakPolicy, CureDay } from './types'

export interface CureUpdate {
  days: CureDay[]
  currentDay: number
  restarted: boolean
}

export function applyBreakPolicy(
  existing: CureDay[],
  zikrId: string,
  today: Date,
  policy: BreakPolicy,
  intentionId?: string,
): CureUpdate {
  const todayKey = format(today, 'yyyy-MM-dd')
  const relevant = existing
    .filter((day) => day.zikrId === zikrId && (!intentionId || day.intentionId === intentionId))
    .sort((a, b) => a.dayNumber - b.dayNumber)
  const alreadyDone = relevant.find((day) => day.dateKey === todayKey && day.status === 'fait')
  if (alreadyDone) return { days: relevant, currentDay: alreadyDone.dayNumber, restarted: false }

  const lastDone = [...relevant].reverse().find((day) => day.status === 'fait')
  const gap = lastDone ? differenceInCalendarDays(today, new Date(`${lastDone.dateKey}T12:00:00`)) : 1
  if (policy === 'recommencer' && lastDone && gap > 1) {
    const first: CureDay = {
      id: `${zikrId}:${intentionId ?? 'default'}:${todayKey}`,
      zikrId,
      intentionId,
      dayNumber: 1,
      dateKey: todayKey,
      status: 'fait',
    }
    return { days: [first], currentDay: 1, restarted: true }
  }

  const result = [...relevant]
  if (lastDone && gap > 1) {
    for (let missingIndex = 1; missingIndex < gap; missingIndex += 1) {
      const missingDate = new Date(`${lastDone.dateKey}T12:00:00`)
      missingDate.setDate(missingDate.getDate() + missingIndex)
      const missingKey = format(missingDate, 'yyyy-MM-dd')
      if (!result.some((day) => day.dateKey === missingKey)) {
        result.push({
          id: `${zikrId}:${intentionId ?? 'default'}:${missingKey}`,
          zikrId,
          intentionId,
          dayNumber: lastDone.dayNumber + missingIndex,
          dateKey: missingKey,
          status: 'manque',
        })
      }
    }
  }

  const completedCount = result.filter((day) => day.status === 'fait').length
  const nextDay = policy === 'dissocier-jour-manque' || policy === 'rattraper'
    ? completedCount + 1
    : (lastDone?.dayNumber ?? 0) + 1
  result.push({
    id: `${zikrId}:${intentionId ?? 'default'}:${todayKey}`,
    zikrId,
    intentionId,
    dayNumber: nextDay,
    dateKey: todayKey,
    status: 'fait',
  })
  return { days: result, currentDay: nextDay, restarted: false }
}

export function currentStreak(dateKeys: string[], today = new Date()) {
  const dates = new Set(dateKeys)
  let cursor = new Date(today)
  const todayKey = format(cursor, 'yyyy-MM-dd')
  if (!dates.has(todayKey)) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (dates.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
