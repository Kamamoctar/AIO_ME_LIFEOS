import { addHours, addMinutes, endOfDay, format, startOfDay } from 'date-fns'
import type { MainPrayerName, PrayerDay, ProgramItem, SessionProgress, Zikr } from './types'
import { dateKey } from './prayers'

export const PRAYER_LABELS: Record<MainPrayerName, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
}

interface ProgramOptions {
  day: Date
  now: Date
  prayerDay: PrayerDay
  zikrs: Zikr[]
  sessions?: SessionProgress[]
  prayerSelections?: Record<string, MainPrayerName[]>
}

function concreteWindows(
  zikr: Zikr,
  day: Date,
  prayers: PrayerDay,
  prayerSelections: Record<string, MainPrayerName[]>,
): Array<{ start: Date; end: Date; prayer?: MainPrayerName; label: string }> {
  const rule = zikr.fenetre
  if (rule.type === 'entre-prieres') {
    return [{
      start: prayers[rule.depuis],
      end: prayers[rule.jusqua],
      label: `${PRAYER_LABELS[rule.depuis]} → ${PRAYER_LABELS[rule.jusqua]}`,
    }]
  }
  if (rule.type === 'apres-priere') {
    const chosen = rule.prieres
      ? (prayerSelections[zikr.id] ?? rule.prieres)
      : [rule.depuis ?? 'fajr']
    return chosen.map((prayer) => ({
      start: prayers[prayer],
      end: addHours(prayers[prayer], rule.dureeFenetreHeures ?? 0.75),
      prayer,
      label: `Après ${PRAYER_LABELS[prayer]}`,
    }))
  }
  if (rule.type === 'journee') {
    return [{ start: startOfDay(day), end: endOfDay(day), label: 'Dans la journée' }]
  }
  return [{
    start: addMinutes(startOfDay(day), 1),
    end: endOfDay(day),
    label: 'Quand tu le souhaites',
  }]
}

export function resolveProgram({
  day,
  now,
  prayerDay,
  zikrs,
  sessions = [],
  prayerSelections = {},
}: ProgramOptions): ProgramItem[] {
  const key = dateKey(day)
  const items = zikrs
    .filter((zikr) => zikr.actif !== false)
    .flatMap((zikr) =>
      concreteWindows(zikr, day, prayerDay, prayerSelections).map((window) => {
        const instanceKey = `${key}:${zikr.id}:${window.prayer ?? 'daily'}`
        const count = sessions
          .filter((session) => session.instanceKey === instanceKey)
          .reduce((sum, session) => Math.max(sum, session.count), 0)
        const remaining = zikr.quantite === null ? null : Math.max(zikr.quantite - count, 0)
        const remainingMinutes = Math.max((window.end.getTime() - now.getTime()) / 60_000, 1)
        return {
          id: instanceKey,
          zikrId: zikr.id,
          zikr,
          instanceKey,
          label: window.label,
          start: window.start,
          end: window.end,
          target: zikr.quantite,
          prayer: window.prayer,
          kind: zikr.fenetre.type,
          status: now < window.start ? 'upcoming' : now > window.end ? 'passed' : 'active',
          remainingCount: remaining,
          requiredPacePerMinute: remaining === null || now > window.end ? null : remaining / remainingMinutes,
        } satisfies ProgramItem
      }),
    )
  return items.sort((a, b) => {
    const aFree = a.kind === 'libre' ? 1 : 0
    const bFree = b.kind === 'libre' ? 1 : 0
    return aFree - bFree || a.start.getTime() - b.start.getTime() || a.zikr.nom.localeCompare(b.zikr.nom)
  })
}

export function formatWindow(item: ProgramItem) {
  if (item.kind === 'libre') return 'Libre'
  if (item.kind === 'journee') return 'Aujourd’hui'
  return `${format(item.start, 'HH:mm')}–${format(item.end, 'HH:mm')}`
}

export function paceLabel(pace: number | null) {
  if (pace === null || !Number.isFinite(pace)) return null
  if (pace < 1) return `1 récitation toutes les ${Math.max(1, Math.round(1 / pace))} min`
  return `${Math.ceil(pace)} récitations/min`
}
