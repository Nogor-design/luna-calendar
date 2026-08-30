'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  coordinatesLabel,
  getSkyDetails,
  observerLocations,
  type ObserverLocation,
} from './sky';

const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 86_400_000;

const phaseNames = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

const phaseGlyphs = ['●', '◔', '◐', '◕', '○', '◕', '◑', '◔'];
const majorPhaseGlyphs: Record<string, string> = {
  'New Moon': '●',
  'First Quarter': '◐',
  'Full Moon': '○',
  'Last Quarter': '◑',
};

type CosmicEvent = {
  date: string;
  name: string;
  type: string;
  note: string;
  bestTime: string;
  lookFor: string;
  visibility: string;
};

const cosmicEvents: CosmicEvent[] = [
  {
    date: '2026-08-28',
    name: 'Partial lunar eclipse',
    type: 'Eclipse',
    note: 'Visible across the Americas, Europe and Africa.',
    bestTime: 'Late evening Aug 27 into early Aug 28',
    lookFor: 'Earth’s shadow covering most of the lunar disk.',
    visibility: 'No equipment is needed. Find a clear view of the Moon.',
  },
  {
    date: '2026-10-21',
    name: 'Orionids peak',
    type: 'Meteor shower',
    note: 'Best viewed after midnight from a dark location.',
    bestTime: 'After midnight through dawn',
    lookFor: 'Fast, faint streaks radiating from Orion.',
    visibility: 'Allow 20 minutes for your eyes to adjust to the dark.',
  },
  {
    date: '2026-11-16',
    name: 'Leonids peak',
    type: 'Meteor shower',
    note: 'Fast meteors radiating from the constellation Leo.',
    bestTime: 'Late night through dawn',
    lookFor: 'Swift streaks that sometimes leave glowing trails.',
    visibility: 'Face away from bright lights and scan a wide area of sky.',
  },
  {
    date: '2026-12-13',
    name: 'Geminids peak',
    type: 'Meteor shower',
    note: 'One of the strongest annual meteor showers.',
    bestTime: 'Around 2 a.m. local time',
    lookFor: 'Bright, colorful meteors appearing across the whole sky.',
    visibility: 'A reclining chair and a dark, open horizon are ideal.',
  },
  {
    date: '2027-02-06',
    name: 'Annular solar eclipse',
    type: 'Eclipse',
    note: 'The Moon leaves a bright ring around the Sun.',
    bestTime: 'Timing depends on your location',
    lookFor: 'A bright ring of sunlight around the Moon’s silhouette.',
    visibility: 'Use certified eclipse glasses for every direct view of the Sun.',
  },
];

function moonPhase(date: Date) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / DAY_MS;
  const fraction = ((days / SYNODIC_MONTH) % 1 + 1) % 1;
  const index = Math.round(fraction * 8) % 8;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * fraction)) * 50);
  return { fraction, index, illumination, name: phaseNames[index] };
}

function phaseGuidance(phaseIndex: number) {
  const guidance = [
    'The darkest lunar night—excellent for stars and deep-sky viewing.',
    'Look low in the west shortly after sunset for the young crescent.',
    'Visible from afternoon into the first half of the night.',
    'An easy evening Moon with more surface detail each night.',
    'Rises near sunset and stays visible through most of the night.',
    'Best seen late at night and into the morning hours.',
    'Rises around midnight and remains visible through the morning.',
    'A slim morning crescent, best spotted before sunrise.',
  ];
  return guidance[phaseIndex];
}

function dateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calendarDateFromKey(key: string) {
  return new Date(`${key}T12:00:00Z`);
}

function currentCalendarDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
}

function makeMonthDays(viewDate: Date) {
  const year = viewDate.getUTCFullYear();
  const month = viewDate.getUTCMonth();
  const firstWeekday = new Date(Date.UTC(year, month, 1, 12)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const cells: Array<Date | null> = Array(firstWeekday).fill(null);

  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(new Date(Date.UTC(year, month, day, 12)));
  }

  while (cells.length % 7) cells.push(null);
  return cells;
}

function nextMajorPhases(from: Date) {
  const labels = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];
  const results: Array<{ name: string; date: Date }> = [];
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 12));
  let previousBucket = Math.floor(moonPhase(start).fraction * 4);

  for (let step = 1; results.length < 4 && step < 45; step += 1) {
    const candidate = new Date(start.getTime() + step * DAY_MS);
    const bucket = Math.floor(moonPhase(candidate).fraction * 4);
    if (bucket !== previousBucket) {
      results.push({ name: labels[bucket % 4], date: candidate });
      previousBucket = bucket;
    }
  }
  return results;
}

export default function LunaCalendar({ initialDateKey }: { initialDateKey: string }) {
  const initialDate = calendarDateFromKey(initialDateKey);
  const [today, setToday] = useState(initialDate);
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [observer, setObserver] = useState<ObserverLocation>(observerLocations[0]);
  const [locationMessage, setLocationMessage] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const monthDays = useMemo(() => makeMonthDays(viewDate), [viewDate]);
  const todayPhase = moonPhase(today);
  const upcomingPhases = useMemo(() => nextMajorPhases(today), [today]);
  const futureEvents = cosmicEvents.filter((event) => event.date >= dateKey(today));
  const upcomingEvents = (futureEvents.length ? futureEvents : cosmicEvents.slice(-4)).slice(0, 4);
  const selectedPhase = selectedDate ? moonPhase(selectedDate) : null;
  const selectedEvent = selectedDate
    ? cosmicEvents.find((event) => event.date === dateKey(selectedDate))
    : undefined;
  const tonightSky = useMemo(
    () => getSkyDetails(today, observer, todayPhase.illumination),
    [observer, today, todayPhase.illumination],
  );
  const selectedSky = useMemo(
    () => selectedDate
      ? getSkyDetails(selectedDate, observer, moonPhase(selectedDate).illumination, selectedEvent?.type)
      : null,
    [observer, selectedDate, selectedEvent?.type],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const localToday = currentCalendarDate();
      setToday(localToday);
      setViewDate((current) => (dateKey(current) === initialDateKey ? localToday : current));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialDateKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedDate && !dialog.open) {
      dialog.showModal();
      detailPanelRef.current?.scrollTo({ top: 0 });
    }
    if (!selectedDate && dialog.open) dialog.close();
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedDate(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [selectedDate]);

  const moveMonth = (amount: number) => {
    setViewDate((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + amount, 1, 12)));
  };

  const openDateDetails = (date: Date) => {
    setSelectedDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)));
  };

  const shiftSelectedDate = (amount: number) => {
    if (!selectedDate) return;
    const next = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate() + amount, 12));
    setSelectedDate(next);
    setViewDate(new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), 1, 12)));
  };

  const chooseLocation = (id: string) => {
    const nextLocation = observerLocations.find((location) => location.id === id);
    if (!nextLocation) return;
    setObserver(nextLocation);
    setLocationMessage('');
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not available in this browser.');
      return;
    }

    setIsLocating(true);
    setLocationMessage('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setObserver({
          id: 'device',
          label: 'My location',
          latitude: coords.latitude,
          longitude: coords.longitude,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        });
        setIsLocating(false);
        setLocationMessage('Location ready. It stays in this browser.');
      },
      () => {
        setIsLocating(false);
        setLocationMessage('Location permission was not granted. Choose a city instead.');
      },
      { enableHighAccuracy: false, maximumAge: 3_600_000, timeout: 10_000 },
    );
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Luna home">
          <span className="brand-mark" aria-hidden="true">◐</span>
          <span>Luna</span>
        </a>
        <nav className="header-links" aria-label="Page sections">
          <a className="quiet-link" href="#your-sky">Your sky</a>
          <a className="quiet-link" href="#events">Events <span aria-hidden="true">↓</span></a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">A quiet guide to the night sky</div>
        <div className="hero-grid">
          <div className="hero-copy">
            <h1>Follow the moon.<br />Notice the sky.</h1>
            <p className="hero-intro">
              A simple lunar calendar for moon phases, meteor showers and the cosmic moments worth looking up for.
            </p>
            <a className="primary-link" href="#calendar">Explore this month <span aria-hidden="true">↘</span></a>
          </div>

          <div className="moon-orbit" aria-label={`${todayPhase.name}, ${todayPhase.illumination}% illuminated`}>
            <div className="orbit-line" />
            <div className="hero-moon" aria-hidden="true">
              <span>{phaseGlyphs[todayPhase.index]}</span>
            </div>
            <div className="phase-card">
              <span className="phase-label">Tonight</span>
              <strong>{todayPhase.name}</strong>
              <span>{todayPhase.illumination}% illuminated</span>
            </div>
          </div>
        </div>
      </section>

      <section className="phase-strip" aria-label="Upcoming moon phases">
        {upcomingPhases.map((phase) => (
          <article key={`${phase.name}-${phase.date.toISOString()}`}>
            <span className="mini-moon" aria-hidden="true">{majorPhaseGlyphs[phase.name]}</span>
            <div>
              <strong>{phase.name}</strong>
              <span>{phase.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="sky-lens" id="your-sky">
        <div className="sky-lens-copy">
          <div>
            <span className="section-number">01</span>
            <p className="eyebrow">Your sky tonight</p>
            <h2>Look up from<br />where you are.</h2>
          </div>
          <p>Moon times are calculated on your device. Choose a city or share your approximate location—nothing is sent to a weather service.</p>
        </div>

        <div className="location-controls">
          <label htmlFor="observer-location">Viewing from</label>
          <div className="location-actions">
            <select
              id="observer-location"
              value={observer.id}
              onChange={(event) => chooseLocation(event.target.value)}
            >
              {observer.id === 'device' ? <option value="device">My location</option> : null}
              {observerLocations.map((location) => (
                <option key={location.id} value={location.id}>{location.label}</option>
              ))}
            </select>
            <button type="button" onClick={useDeviceLocation} disabled={isLocating}>
              {isLocating ? 'Finding you…' : 'Use my location'}
            </button>
          </div>
          <p className="location-meta" aria-live="polite">
            {locationMessage || `${coordinatesLabel(observer)} · ${observer.timeZone.replaceAll('_', ' ')}`}
          </p>
        </div>

        <div className="sky-times" aria-label={`Tonight's sky times for ${observer.label}`}>
          <div><span>Moonrise</span><strong>{tonightSky.moonrise}</strong></div>
          <div><span>Moonset</span><strong>{tonightSky.moonset}</strong></div>
          <div><span>Dark skies</span><strong>{tonightSky.darknessBegins}</strong></div>
        </div>
        <p className="sky-guidance"><span aria-hidden="true">✦</span>{tonightSky.guidance}</p>
      </section>

      <section className="calendar-section" id="calendar">
        <div className="section-heading">
          <div>
            <span className="section-number">02</span>
            <p className="eyebrow">Lunar calendar</p>
            <h2>{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h2>
          </div>
          <div className="calendar-controls" aria-label="Calendar navigation">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">←</button>
            <button type="button" className="today-button" onClick={() => setViewDate(currentCalendarDate())}>Today</button>
            <button type="button" onClick={() => moveMonth(1)} aria-label="Next month">→</button>
          </div>
        </div>

        <div className="calendar-card">
          <div className="weekday-row" aria-hidden="true">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid">
            {monthDays.map((date, index) => {
              if (!date) return <div className="day empty" key={`empty-${index}`} />;
              const phase = moonPhase(date);
              const event = cosmicEvents.find((item) => item.date === dateKey(date));
              const isToday = dateKey(date) === dateKey(today);
              const isMajor = phase.index % 2 === 0;
              return (
                <button
                  type="button"
                  className={`day${isToday ? ' is-today' : ''}${event ? ' has-event' : ''}`}
                  key={dateKey(date)}
                  onClick={() => openDateDetails(date)}
                  aria-haspopup="dialog"
                  aria-label={`${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}: ${phase.name}, ${phase.illumination}% illuminated${event ? `, ${event.name}` : ''}`}
                >
                  <span className="day-number">{date.getUTCDate()}</span>
                  <span className={`day-moon${isMajor ? ' major' : ''}`} aria-hidden="true" title={phase.name}>
                    {phaseGlyphs[phase.index]}
                  </span>
                  {event ? <span className="event-chip">Explore event</span> : <span className="day-hint">View</span>}
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            <span><i className="legend-dot" /> Cosmic event</span>
            <span>Moon icons show the phase each day</span>
          </div>
        </div>
      </section>

      <section className="events-section" id="events">
        <div className="section-heading events-heading">
          <div>
            <span className="section-number">03</span>
            <p className="eyebrow">Cosmic events</p>
            <h2>Worth looking up for</h2>
          </div>
          <p>Dates are approximate and visibility depends on your location and local conditions.</p>
        </div>

        <div className="event-list">
          {upcomingEvents.map((event, index) => {
            const eventDate = calendarDateFromKey(event.date);
            return (
              <button
                type="button"
                className="event-row"
                key={event.date}
                onClick={() => openDateDetails(eventDate)}
                aria-haspopup="dialog"
                aria-label={`View ${event.name} details for ${eventDate.toLocaleDateString('en-US', { timeZone: 'UTC' })}`}
              >
                <span className="event-index">{String(index + 1).padStart(2, '0')}</span>
                <time dateTime={event.date}>
                  <strong>{eventDate.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'UTC' })}</strong>
                  <span>{eventDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span>
                </time>
                <div className="event-copy">
                  <span className="event-type">{event.type}</span>
                  <h3>{event.name}</h3>
                  <p>{event.note}</p>
                </div>
                <span className="event-arrow" aria-hidden="true">↗</span>
              </button>
            );
          })}
        </div>
      </section>

      <dialog
        className="detail-dialog"
        ref={dialogRef}
        onClose={() => setSelectedDate(null)}
        onCancel={(event) => {
          event.preventDefault();
          setSelectedDate(null);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedDate(null);
        }}
        aria-labelledby="detail-title"
      >
        {selectedDate && selectedPhase ? (
          <div className="detail-panel" ref={detailPanelRef}>
            <header className="detail-header">
              <div>
                <span className="eyebrow">Night sky details</span>
                <p>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</p>
              </div>
              <button className="dialog-close" type="button" onClick={() => setSelectedDate(null)} aria-label="Close details">×</button>
            </header>

            <div className="detail-moon-block">
              <span className="detail-moon" aria-hidden="true">{phaseGlyphs[selectedPhase.index]}</span>
              <div>
                <span className="detail-kicker">Moon phase</span>
                <h2 id="detail-title">{selectedPhase.name}</h2>
                <p>{phaseGuidance(selectedPhase.index)}</p>
              </div>
            </div>

            <div className="detail-stats" aria-label="Moon statistics">
              <div><strong>{selectedPhase.illumination}%</strong><span>Illuminated</span></div>
              <div><strong>{Math.round(selectedPhase.fraction * SYNODIC_MONTH)}</strong><span>Days into cycle</span></div>
              <div><strong>{selectedPhase.fraction < 0.5 ? 'Waxing' : 'Waning'}</strong><span>Direction</span></div>
            </div>

            {selectedSky ? (
              <section className="detail-sky" aria-label={`Local sky times for ${observer.label}`}>
                <header>
                  <div>
                    <span className="detail-kicker">Your sky · {observer.label}</span>
                    <h3>When to step outside</h3>
                  </div>
                  <a href="#your-sky" onClick={() => setSelectedDate(null)}>Change location</a>
                </header>
                <div className="detail-sky-times">
                  <div><span>Moonrise</span><strong>{selectedSky.moonrise}</strong></div>
                  <div><span>Moonset</span><strong>{selectedSky.moonset}</strong></div>
                  <div><span>Dark skies</span><strong>{selectedSky.darknessBegins}</strong></div>
                </div>
                <p>{selectedSky.guidance}</p>
              </section>
            ) : null}

            {selectedEvent ? (
              <section className="selected-event" aria-label="Cosmic event details">
                <span className="event-type">{selectedEvent.type}</span>
                <h3>{selectedEvent.name}</h3>
                <p className="event-lede">{selectedEvent.note}</p>
                <dl>
                  <div><dt>Best time</dt><dd>{selectedEvent.bestTime}</dd></div>
                  <div><dt>Look for</dt><dd>{selectedEvent.lookFor}</dd></div>
                  <div><dt>Viewing note</dt><dd>{selectedEvent.visibility}</dd></div>
                </dl>
              </section>
            ) : (
              <section className="quiet-night">
                <span className="event-type">A quiet lunar night</span>
                <h3>No major event is listed for this date.</h3>
                <p>The Moon still changes a little every night. Step outside, let your eyes adjust, and notice where it sits in the sky.</p>
              </section>
            )}

            <nav className="detail-nav" aria-label="Browse nearby dates">
              <button type="button" onClick={() => shiftSelectedDate(-1)}><span aria-hidden="true">←</span> Previous night</button>
              <button type="button" onClick={() => shiftSelectedDate(1)}>Next night <span aria-hidden="true">→</span></button>
            </nav>
          </div>
        ) : null}
      </dialog>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true">◐</span>Luna</a>
        <p>Make a little time for wonder.</p>
        <p className="source-note">
          Sky-event dates: <a href="https://science.nasa.gov/solar-system/meteors-meteorites/meteor-showers/" target="_blank" rel="noreferrer">NASA</a> · Lunar phases: astronomical estimate
        </p>
      </footer>
    </main>
  );
}
