import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

export function calculatePrayerTimes(date = new Date(), lat = 6.1375, lng = 1.2123, method = 'MWL') {
  try {
    const coords = new Coordinates(lat, lng);
    let params;
    switch (method) {
      case 'ISNA': params = CalculationMethod.NorthAmerica(); break;
      case 'Egypt': params = CalculationMethod.Egyptian(); break;
      case 'Makkah': params = CalculationMethod.UmmAlQura(); break;
      case 'Karachi': params = CalculationMethod.Karachi(); break;
      default: params = CalculationMethod.MuslimWorldLeague(); break;
    }
    params.madhab = Madhab.Shafi;

    const times = new PrayerTimes(coords, date, params);
    return {
      fajr: times.fajr,
      sunrise: times.sunrise,
      dhuhr: times.dhuhr,
      asr: times.asr,
      maghrib: times.maghrib,
      isha: times.isha,
      current: times.currentPrayer(),
      next: times.nextPrayer(),
      timeForNext: times.timeForPrayer(times.nextPrayer())
    };
  } catch (err) {
    console.error('Error calculating prayer times:', err);
    return null;
  }
}

export function formatTime(date) {
  if (!date) return '--:--';
  const d = new Date(date);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function getNextPrayerCountdown(nextTime) {
  if (!nextTime) return '';
  const now = new Date();
  const diffMs = new Date(nextTime).getTime() - now.getTime();
  if (diffMs <= 0) return 'Maintenant';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes} min`;
}

