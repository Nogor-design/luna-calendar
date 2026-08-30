import { getMoonPosition, getTimes } from 'suncalc';

const MINUTE_MS = 60_000;
const MOON_HORIZON = 0.133 * Math.PI / 180;

export type ObserverLocation = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

export const observerLocations: ObserverLocation[] = [
  { id: 'denver', label: 'Denver, CO', latitude: 39.7392, longitude: -104.9903, timeZone: 'America/Denver' },
  { id: 'new-york', label: 'New York, NY', latitude: 40.7128, longitude: -74.006, timeZone: 'America/New_York' },
  { id: 'london', label: 'London, UK', latitude: 51.5072, longitude: -0.1276, timeZone: 'Europe/London' },
  { id: 'tokyo', label: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503, timeZone: 'Asia/Tokyo' },
  { id: 'sydney', label: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093, timeZone: 'Australia/Sydney' },
];

export type SkyDetails = {
  moonrise: string;
  moonset: string;
  darknessBegins: string;
  guidance: string;
};

function dateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeZoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  ) - date.getTime();
}

function localMidnightUtc(key: string, timeZone: string) {
  const [year, month, day] = key.split('-').map(Number);
  const wallClock = Date.UTC(year, month - 1, day);
  let instant = wallClock;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    instant = wallClock - timeZoneOffset(new Date(instant), timeZone);
  }

  return instant;
}

function moonHorizonEvents(date: Date, location: ObserverLocation) {
  const start = localMidnightUtc(dateKey(date), location.timeZone);
  const nextCalendarDate = new Date(date.getTime() + 86_400_000);
  const end = localMidnightUtc(dateKey(nextCalendarDate), location.timeZone);
  const step = 10 * MINUTE_MS;
  let previousTime = start;
  let previousAltitude = getMoonPosition(new Date(start), location.latitude, location.longitude).altitude - MOON_HORIZON;
  let rise: Date | null = null;
  let set: Date | null = null;

  for (let time = start + step; time <= end; time += step) {
    const altitude = getMoonPosition(new Date(time), location.latitude, location.longitude).altitude - MOON_HORIZON;

    if (previousAltitude <= 0 && altitude > 0 && !rise) {
      const ratio = -previousAltitude / (altitude - previousAltitude);
      rise = new Date(previousTime + ratio * step);
    }
    if (previousAltitude > 0 && altitude <= 0 && !set) {
      const ratio = previousAltitude / (previousAltitude - altitude);
      set = new Date(previousTime + ratio * step);
    }

    previousAltitude = altitude;
    previousTime = time;
  }

  return { rise, set, midpoint: new Date((start + end) / 2) };
}

function formatTime(date: Date | null, timeZone: string, fallback: string) {
  if (!date || Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date);
}

export function coordinatesLabel(location: ObserverLocation) {
  const latitude = `${Math.abs(location.latitude).toFixed(1)}° ${location.latitude >= 0 ? 'N' : 'S'}`;
  const longitude = `${Math.abs(location.longitude).toFixed(1)}° ${location.longitude >= 0 ? 'E' : 'W'}`;
  return `${latitude}, ${longitude}`;
}

export function getSkyDetails(
  date: Date,
  location: ObserverLocation,
  illumination: number,
  eventType?: string,
): SkyDetails {
  const moonEvents = moonHorizonEvents(date, location);
  const sunTimes = getTimes(moonEvents.midpoint, location.latitude, location.longitude);
  const moonrise = formatTime(moonEvents.rise, location.timeZone, 'No rise');
  const moonset = formatTime(moonEvents.set, location.timeZone, 'No set');
  const darknessBegins = formatTime(sunTimes.nauticalDusk, location.timeZone, 'After dusk');
  const dawn = formatTime(sunTimes.nauticalDawn, location.timeZone, 'dawn');
  let guidance = `The sky grows properly dark after ${darknessBegins}.`;

  if (eventType === 'Meteor shower') {
    guidance = illumination >= 50 && moonEvents.set
      ? `Moonlight is strong. The darker window begins after moonset at ${moonset} and lasts until ${dawn}.`
      : `Moonlight should be manageable. Start after ${darknessBegins} and keep watching toward ${dawn}.`;
  } else if (eventType === 'Eclipse') {
    guidance = moonEvents.rise
      ? `The Moon clears the horizon around ${moonrise}. Use the event timing below for the eclipse itself.`
      : 'The Moon does not rise during this local calendar day; check the event visibility note below.';
  } else if (illumination <= 20) {
    guidance = `A low-moonlight night for stars and deep-sky objects after ${darknessBegins}.`;
  } else if (illumination >= 80) {
    guidance = `A bright moonlit night. Lunar details are easiest to see after moonrise at ${moonrise}.`;
  } else {
    guidance = `Look for the Moon after ${moonrise}; darker conditions return after moonset at ${moonset}.`;
  }

  return { moonrise, moonset, darknessBegins, guidance };
}
