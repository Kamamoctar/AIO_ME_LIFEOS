import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan'
import { format } from 'date-fns'
import type { AppSettings, MainPrayerName, PrayerDay, PrayerMethod } from './types'

const methodFactories: Record<Exclude<PrayerMethod, 'UOIF_12'>, () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>> = {
  MWL: () => CalculationMethod.MuslimWorldLeague(),
  ISNA: () => CalculationMethod.NorthAmerica(),
  Egypt: () => CalculationMethod.Egyptian(),
  Makkah: () => CalculationMethod.UmmAlQura(),
  Karachi: () => CalculationMethod.Karachi(),
}

export function dateKey(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function coordinatesKey(settings: AppSettings) {
  const { latitude, longitude } = settings.coordinates
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`
}

function calculationParameters(method: PrayerMethod) {
  if (method === 'UOIF_12') {
    const params = CalculationMethod.Other()
    params.fajrAngle = 12
    params.ishaAngle = 12
    return params
  }
  return methodFactories[method]()
}

function withMinuteOffset(value: Date, minutes = 0) {
  return new Date(value.getTime() + minutes * 60_000)
}

export function calculatePrayerDay(day: Date, settings: AppSettings): PrayerDay {
  const params = calculationParameters(settings.prayerMethod)
  params.madhab = Madhab.Shafi
  const coordinates = new Coordinates(settings.coordinates.latitude, settings.coordinates.longitude)
  const times = new PrayerTimes(coordinates, day, params)
  const offset = (name: MainPrayerName) => settings.offsets[name] ?? 0
  return {
    dateKey: dateKey(day),
    coordinatesKey: coordinatesKey(settings),
    method: settings.prayerMethod,
    fajr: withMinuteOffset(times.fajr, offset('fajr')),
    sunrise: times.sunrise,
    dhuhr: withMinuteOffset(times.dhuhr, offset('dhuhr')),
    asr: withMinuteOffset(times.asr, offset('asr')),
    maghrib: withMinuteOffset(times.maghrib, offset('maghrib')),
    isha: withMinuteOffset(times.isha, offset('isha')),
  }
}

