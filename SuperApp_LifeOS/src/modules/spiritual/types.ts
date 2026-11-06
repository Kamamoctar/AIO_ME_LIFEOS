export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
export type MainPrayerName = Exclude<PrayerName, 'sunrise'>
export type ZikrNature = 'cure' | 'quotidien' | 'libre' | 'protocole' | 'micro-dose'
export type BreakPolicy = 'rattraper' | 'recommencer' | 'dissocier-jour-manque'

export type WindowRule =
  | { type: 'libre' }
  | { type: 'journee' }
  | { type: 'entre-prieres'; depuis: MainPrayerName; jusqua: MainPrayerName }
  | {
      type: 'apres-priere'
      depuis?: MainPrayerName
      prieres?: MainPrayerName[]
      dureeFenetreHeures?: number
      editable?: boolean
    }

export interface Zikr {
  id: string
  nom: string
  arabe: string
  formule: string
  formuleLongue?: boolean
  sens: string
  quantite: number | null
  nature: ZikrNature
  dureeJours?: number
  fenetre: WindowRule
  fractionnable?: boolean
  horizonDefaut?: string
  politiqueRupture?: {
    options: BreakPolicy[]
    defaut: BreakPolicy
    editable: boolean
  }
  instruction: string
  notes: string
  actif?: boolean
  personnel?: boolean
}

export interface ZikrData {
  meta: { version: number; note: string }
  priere: {
    methodeDefaut: PrayerMethod
    methodesDisponibles: PrayerMethod[]
    offsetManuelMinutes: Partial<Record<MainPrayerName, number>>
    position: { mode: string; cacheeLocalement: boolean }
  }
  zikrs: Zikr[]
}

export type PrayerMethod = 'MWL' | 'UOIF_12' | 'ISNA' | 'Egypt' | 'Makkah' | 'Karachi'

export interface CoordinatesConfig {
  latitude: number
  longitude: number
  label: string
  source: 'default' | 'geolocation' | 'manual' | 'city'
}

export interface AppSettings {
  id: 'main'
  coordinates: CoordinatesConfig
  prayerMethod: PrayerMethod
  offsets: Partial<Record<MainPrayerName, number>>
  breakPolicy: BreakPolicy
  notificationLevel: 'local' | 'push' | 'ics'
  notificationsEnabled: boolean
  soundEnabled: boolean
  hapticsEnabled: boolean
  tickVolume: number
  metronomeEnabled: boolean
  briefingTime: string
  prayerSelections: Record<string, MainPrayerName[]>
  appearance: 'night' | 'day'
  onboardingDone: boolean
}

export interface PrayerDay {
  dateKey: string
  coordinatesKey: string
  method: PrayerMethod
  fajr: Date
  sunrise: Date
  dhuhr: Date
  asr: Date
  maghrib: Date
  isha: Date
}

export interface ProgramItem {
  id: string
  zikrId: string
  zikr: Zikr
  instanceKey: string
  label: string
  start: Date
  end: Date
  target: number | null
  prayer?: MainPrayerName
  kind: WindowRule['type']
  status: 'passed' | 'active' | 'upcoming'
  remainingCount: number | null
  requiredPacePerMinute: number | null
}

export interface SessionProgress {
  id: string
  zikrId: string
  instanceKey: string
  dateKey: string
  count: number
  target: number | null
  startedAt: string
  updatedAt: string
  completedAt?: string
  elapsedSeconds: number
  intentionId?: string
  prayer?: MainPrayerName
}

export interface Completion {
  id: string
  zikrId: string
  dateKey: string
  count: number
  target: number | null
  startedAt: string
  completedAt: string
  elapsedSeconds: number
  intentionId?: string
  instanceKey: string
}

export interface Intention {
  id: string
  zikrId: string
  text: string
  createdAt: string
  status: 'en-cours' | 'confiee' | 'temoignage'
  archivedAt?: string
}

export interface CureDay {
  id: string
  zikrId: string
  intentionId?: string
  dayNumber: number
  dateKey: string
  status: 'fait' | 'manque' | 'a-venir'
}

export interface ZikrRecord {
  id: string
  data: Zikr
  updatedAt: string
}
