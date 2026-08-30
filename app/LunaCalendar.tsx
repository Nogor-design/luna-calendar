'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  coordinatesLabel,
  getSkyDetails,
  observerLocations,
  type ObserverLocation,
} from './sky';

const DAY_MS = 86_400_000;
const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const phaseNames = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const;

type EventCategory = 'Moon' | 'Eclipse' | 'Meteor shower';
type EventFilter = 'All events' | EventCategory;
type CalendarFilter = 'All' | 'Phases' | 'Eclipses' | 'Meteors';

type CosmicEvent = {
  date: string;
  name: string;
  category: EventCategory;
  short: string;
  note: string;
  bestTime: string;
  lookFor: string;
};

const cosmicEvents: CosmicEvent[] = [
  {
    date: '2026-09-04',
    name: 'Third Quarter',
    category: 'Moon',
    short: 'Morning detail',
    note: 'A half-lit morning Moon with long shadows along the terminator.',
    bestTime: 'After midnight through late morning',
    lookFor: 'Crater relief where lunar day meets lunar night.',
  },
  {
    date: '2026-09-10',
    name: 'New Moon',
    category: 'Moon',
    short: 'Dark-sky window',
    note: 'Little moonlight interferes with faint galaxies and star fields.',
    bestTime: 'After astronomical twilight',
    lookFor: 'The Milky Way and faint deep-sky targets.',
  },
  {
    date: '2026-09-18',
    name: 'First Quarter',
    category: 'Moon',
    short: 'Terminator detail',
    note: 'A superb evening phase for exploring crater rims and mountain shadows.',
    bestTime: 'Sunset to around midnight',
    lookFor: 'The Apennine Mountains and the edge of Mare Imbrium.',
  },
  {
    date: '2026-09-26',
    name: 'Harvest Moon',
    category: 'Moon',
    short: 'Full Moon',
    note: 'The full Moon nearest the September equinox brightens the whole night.',
    bestTime: 'From moonrise through dawn',
    lookFor: 'Tycho’s ray system and the contrast between bright highlands and dark maria.',
  },
  {
    date: '2026-10-08',
    name: 'Draconids peak',
    category: 'Meteor shower',
    short: 'Meteor peak',
    note: 'A modest shower that is unusual because it is often best before midnight.',
    bestTime: 'Nightfall through late evening',
    lookFor: 'Slow meteors tracing back toward Draco in the northern sky.',
  },
  {
    date: '2026-10-21',
    name: 'Orionids peak',
    category: 'Meteor shower',
    short: 'Fast meteors',
    note: 'Earth crosses debris shed by Halley’s Comet.',
    bestTime: 'After midnight through dawn',
    lookFor: 'Fast streaks radiating from the direction of Orion.',
  },
  {
    date: '2026-11-17',
    name: 'Leonids peak',
    category: 'Meteor shower',
    short: 'Swift trails',
    note: 'Fast meteors can leave brief glowing trains behind them.',
    bestTime: 'Late night through dawn',
    lookFor: 'Streaks that trace back toward Leo.',
  },
  {
    date: '2026-12-14',
    name: 'Geminids peak',
    category: 'Meteor shower',
    short: 'Major shower',
    note: 'One of the year’s richest, most reliable meteor showers.',
    bestTime: 'Late evening through 2 a.m.',
    lookFor: 'Bright, sometimes colorful meteors anywhere in the sky.',
  },
  {
    date: '2027-02-06',
    name: 'Annular solar eclipse',
    category: 'Eclipse',
    short: 'Ring of fire',
    note: 'The Moon passes in front of the Sun without covering it completely.',
    bestTime: 'Location dependent',
    lookFor: 'Use certified eclipse viewers; never look directly at the Sun unprotected.',
  },
];

const atlasPlaces = [
  {
    name: 'Sea of Tranquility',
    title: 'The plain where humans first stepped onto another world.',
    body: 'Mare Tranquillitatis is an ancient impact basin filled by dark basalt. Apollo 11 landed near its southwestern edge in 1969.',
    factA: 'Span', valueA: '873 km', factB: 'Best light', valueB: 'First quarter', x: 67, y: 44,
  },
  {
    name: 'Copernicus',
    title: 'A young crater with terraces, peaks, and a brilliant ray system.',
    body: 'Copernicus is easy to identify west of the Moon’s center. Low-angle sunlight reveals its stepped walls and central mountains.',
    factA: 'Diameter', valueA: '93 km', factB: 'Depth', valueB: '3.8 km', x: 42, y: 39,
  },
  {
    name: 'Tycho',
    title: 'The crater that draws rays across a world.',
    body: 'Tycho is young by lunar standards—about 108 million years old. Near full Moon, its bright ejecta rays can span much of the visible face.',
    factA: 'Diameter', valueA: '85 km', factB: 'Depth', valueB: '4.8 km', x: 55, y: 72,
  },
  {
    name: 'Mare Imbrium',
    title: 'A colossal basin filled with frozen lava seas.',
    body: 'Mare Imbrium dominates the northwest face. Its mountain rim and wrinkle ridges reveal a history of impact, flooding, and cooling.',
    factA: 'Span', valueA: '1,145 km', factB: 'Best light', valueB: 'Waxing crescent', x: 40, y: 26,
  },
  {
    name: 'Earthshine',
    title: 'The old Moon resting in the new Moon’s arms.',
    body: 'Sunlight reflected by Earth softly illuminates the Moon’s night side. It is most striking around a thin crescent.',
    factA: 'Cause', valueA: 'Reflected Earthlight', factB: 'Best light', valueB: 'Thin crescent', x: 22, y: 54,
  },
  {
    name: 'The terminator',
    title: 'A moving frontier where relief becomes visible.',
    body: 'Near the day-night boundary, low sunlight stretches shadows across crater floors and mountain ranges, making the surface appear three-dimensional.',
    factA: 'Moves', valueA: 'Across each lunation', factB: 'Best light', valueB: 'Any partial phase', x: 18, y: 34,
  },
];

function dateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function dateFromKey(key: string) { return new Date(`${key}T12:00:00Z`); }
function addDays(date: Date, amount: number) { return new Date(date.getTime() + amount * DAY_MS); }

function currentUtcDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
}

function moonPhase(date: Date) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / DAY_MS;
  const fraction = ((days / SYNODIC_MONTH) % 1 + 1) % 1;
  const index = Math.round(fraction * 8) % 8;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * fraction)) * 50);
  return { age: Math.round(fraction * SYNODIC_MONTH), fraction, illumination, index, name: phaseNames[index] };
}

function shadowShift(fraction: number) { return fraction <= 0.5 ? fraction * -200 : (1 - fraction) * 200; }

function makeMonthDays(viewDate: Date) {
  const first = new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), 1, 12));
  const gridStart = addDays(first, -first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
}

function observationNote(phaseIndex: number) {
  return [
    'Use the dark, moonless sky for galaxies, nebulae, and meteor watching.',
    'Look low in the west just after sunset; earthshine may reveal the dark side.',
    'Trace the terminator through the lunar highlands in the early evening.',
    'Compare the brightening ray systems around Copernicus and Tycho.',
    'Look for the contrast between dark maria and the bright southern highlands.',
    'Follow the shrinking terminator late at night and into the morning.',
    'Look south before sunrise for dramatic shadows across the western craters.',
    'Catch the slim crescent low in the east before the sky brightens.',
  ][phaseIndex];
}

function ArrowIcon({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={direction === 'left' ? 'is-left' : ''}><path d="M5 12h14M14 6l6 6-6 6" /></svg>;
}

function PhaseIcon({ fraction, size = 'small' }: { fraction: number; size?: 'tiny' | 'small' | 'large' }) {
  return <span className={`phase-icon phase-icon-${size}`} style={{ '--shadow-shift': `${shadowShift(fraction)}%` } as React.CSSProperties} aria-hidden="true" />;
}

function MoonDisc({ fraction, priority = false, className = '' }: { fraction: number; priority?: boolean; className?: string }) {
  return (
    <div className={`moon-disc ${className}`} style={{ '--shadow-shift': `${shadowShift(fraction)}%` } as React.CSSProperties} aria-hidden="true">
      <Image src="/luna-moon.png" alt="" fill priority={priority} sizes="(max-width: 700px) 92vw, 58vw" />
      <span className="moon-disc-shadow" />
    </div>
  );
}

export default function LunaCalendar({ initialDateKey }: { initialDateKey: string }) {
  const initialDate = dateFromKey(initialDateKey);
  const [today, setToday] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [viewDate, setViewDate] = useState(new Date(Date.UTC(initialDate.getUTCFullYear(), initialDate.getUTCMonth(), 1, 12)));
  const [observer, setObserver] = useState<ObserverLocation>(observerLocations[0]);
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilter>('All');
  const [eventFilter, setEventFilter] = useState<EventFilter>('All events');
  const [atlasIndex, setAtlasIndex] = useState(2);
  const [savedNights, setSavedNights] = useState<Set<string>>(() => new Set());
  const [locationMessage, setLocationMessage] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const phase = useMemo(() => moonPhase(selectedDate), [selectedDate]);
  const monthDays = useMemo(() => makeMonthDays(viewDate), [viewDate]);
  const selectedEvent = cosmicEvents.find((event) => event.date === dateKey(selectedDate));
  const sky = useMemo(() => getSkyDetails(selectedDate, observer, phase.illumination, selectedEvent?.category), [observer, phase.illumination, selectedDate, selectedEvent?.category]);
  const cycleOffset = Math.min(29, Math.max(0, Math.round((selectedDate.getTime() - today.getTime()) / DAY_MS)));
  const visibleEvents = cosmicEvents.filter((event) => eventFilter === 'All events' || event.category === eventFilter);
  const atlas = atlasPlaces[atlasIndex];
  const isSaved = savedNights.has(dateKey(selectedDate));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const localToday = currentUtcDate();
      setToday(localToday);
      setSelectedDate(localToday);
      setViewDate(new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth(), 1, 12)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialDateKey]);

  const chooseDate = (date: Date) => {
    const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
    setSelectedDate(normalized);
    setViewDate(new Date(Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth(), 1, 12)));
  };

  const moveMonth = (amount: number) => setViewDate((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + amount, 1, 12)));

  const jumpToCalendar = (date = selectedDate) => {
    chooseDate(date);
    document.querySelector('#calendar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chooseLocation = (id: string) => {
    const next = observerLocations.find((location) => location.id === id);
    if (next) { setObserver(next); setLocationMessage(''); }
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) { setLocationMessage('Location is unavailable in this browser.'); return; }
    setIsLocating(true);
    setLocationMessage('Finding your sky…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setObserver({ id: 'device', label: 'My location', latitude: coords.latitude, longitude: coords.longitude, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' });
        setLocationMessage('Location ready. It stays in this browser.');
        setIsLocating(false);
      },
      () => { setLocationMessage('Location permission was not granted. Choose a city instead.'); setIsLocating(false); },
      { enableHighAccuracy: false, maximumAge: 3_600_000, timeout: 10_000 },
    );
  };

  const toggleSavedNight = () => {
    const key = dateKey(selectedDate);
    setSavedNights((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const eventMatchesCalendarFilter = (event?: CosmicEvent) => {
    if (!event || calendarFilter === 'All') return Boolean(event);
    if (calendarFilter === 'Eclipses') return event.category === 'Eclipse';
    if (calendarFilter === 'Meteors') return event.category === 'Meteor shower';
    return event.category === 'Moon';
  };

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Luna home">LUNA</a>
        <nav aria-label="Main navigation">
          <a href="#observe">Observe</a><a href="#calendar">Calendar</a><a href="#knowledge">Field notes</a><a href="#events">Events</a>
        </nav>
        <label className="header-location">
          <span className="sr-only">Observing location</span><span aria-hidden="true" className="location-pin">⌖</span>
          <select value={observer.id} onChange={(event) => chooseLocation(event.target.value)}>
            {observer.id === 'device' ? <option value="device">My location</option> : null}
            {observerLocations.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}
          </select>
        </label>
      </header>

      <section className="hero" id="observe">
        <div className="hero-orbit orbit-one" aria-hidden="true" /><div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <h1>Know the Moon<br />before you look up.</h1>
          <p>Phase, timing, and what to notice—brought together for tonight and every night.</p>
          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={() => jumpToCalendar(today)}>Explore tonight</button>
            <button type="button" className="text-action" onClick={() => jumpToCalendar()}>Open calendar</button>
          </div>
        </div>
        <div className="hero-moon-wrap">
          <MoonDisc fraction={phase.fraction} priority className="hero-moon" />
          <span className="orbit-label orbit-label-one" aria-hidden="true">60°</span><span className="orbit-label orbit-label-two" aria-hidden="true">30°</span><span className="orbit-label orbit-label-three" aria-hidden="true">0°</span>
        </div>
        <div className="observation-rail" aria-label={`Observation details for ${formatDate(selectedDate, { month: 'long', day: 'numeric' })}`}>
          <div><PhaseIcon fraction={phase.fraction} size="small" /><span><b>{phase.name}</b><small>{formatDate(selectedDate, { month: 'short', day: 'numeric' })}</small></span></div>
          <div><span className="rail-symbol">◌</span><span><b>{phase.illumination}% illuminated</b><small>{phase.age} days into cycle</small></span></div>
          <div><span className="rail-symbol">↟</span><span><b>Moonrise {sky.moonrise}</b><small>{observer.label}</small></span></div>
          <div><span className="rail-symbol">□</span><span><b>Dark after {sky.darknessBegins}</b><small>Moonset {sky.moonset}</small></span></div>
        </div>
        <div className="cycle-control">
          <span>{formatDate(today, { month: 'short', day: 'numeric' })}</span>
          <div className="cycle-track">
            <div className="phase-stops">{Array.from({ length: 8 }, (_, index) => { const stopDate = addDays(today, Math.round(index * 29 / 7)); return <button type="button" key={index} onClick={() => chooseDate(stopDate)} aria-label={`Select ${formatDate(stopDate, { month: 'long', day: 'numeric' })}`}><PhaseIcon fraction={moonPhase(stopDate).fraction} size="tiny" /></button>; })}</div>
            <input type="range" min="0" max="29" value={cycleOffset} onChange={(event) => chooseDate(addDays(today, Number(event.target.value)))} aria-label="Explore the next lunar cycle by date" />
          </div>
          <span>{formatDate(addDays(today, 29), { month: 'short', day: 'numeric' })}</span>
        </div>
      </section>

      <section className="section-intro paper-band"><h2>One date. The whole sky story.</h2><p>Choose a night. Luna connects the phase, the sky clock, and the details worth noticing.</p></section>

      <section className="calendar-workspace" id="calendar">
        <div className="calendar-main">
          <div className="calendar-heading">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month"><ArrowIcon direction="left" /></button>
            <h2>{formatDate(viewDate, { month: 'long', year: 'numeric' })}</h2>
            <div className="calendar-heading-actions"><button type="button" onClick={() => moveMonth(1)} aria-label="Next month"><ArrowIcon /></button><button type="button" className="today-control" onClick={() => chooseDate(today)}>Today</button></div>
          </div>
          <div className="filter-tabs" role="group" aria-label="Calendar markers">
            {(['All', 'Phases', 'Eclipses', 'Meteors'] as CalendarFilter[]).map((filter) => <button type="button" className={calendarFilter === filter ? 'is-active' : ''} onClick={() => setCalendarFilter(filter)} key={filter}>{filter}</button>)}
          </div>
          <div className="weekday-row" aria-hidden="true">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {monthDays.map((date) => {
              const itemPhase = moonPhase(date);
              const event = cosmicEvents.find((item) => item.date === dateKey(date));
              const inMonth = date.getUTCMonth() === viewDate.getUTCMonth();
              const selected = dateKey(date) === dateKey(selectedDate);
              const todayCell = dateKey(date) === dateKey(today);
              const showEvent = eventMatchesCalendarFilter(event);
              const showPhase = calendarFilter === 'All' || calendarFilter === 'Phases';
              return (
                <button type="button" key={dateKey(date)} className={`calendar-day${inMonth ? '' : ' is-adjacent'}${selected ? ' is-selected' : ''}${todayCell ? ' is-today' : ''}`} onClick={() => chooseDate(date)} aria-pressed={selected} aria-label={`${formatDate(date, { month: 'long', day: 'numeric', year: 'numeric' })}, ${itemPhase.name}, ${itemPhase.illumination}% illuminated${event ? `, ${event.name}` : ''}`}>
                  <span className="calendar-day-number">{date.getUTCDate()}</span>{showPhase ? <PhaseIcon fraction={itemPhase.fraction} size="tiny" /> : null}{showEvent && event ? <span className={`calendar-event-mark category-${event.category.toLowerCase().replace(' ', '-')}`}>{event.name}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        <aside className="date-inspector" aria-live="polite">
          <p className="inspector-date">{formatDate(selectedDate, { month: 'short', day: 'numeric', year: 'numeric' })}</p><h2>{selectedEvent?.name ?? phase.name}</h2><p className="illumination">{phase.illumination}% illuminated</p>
          <MoonDisc fraction={phase.fraction} className="inspector-moon" />
          <dl className="sky-rows"><div><dt>Moonrise</dt><dd>{sky.moonrise}</dd></div><div><dt>Moonset</dt><dd>{sky.moonset}</dd></div><div><dt>Dark after</dt><dd>{sky.darknessBegins}</dd></div><div><dt>Location</dt><dd>{observer.label}</dd></div></dl>
          <div className="notice-copy"><h3>What to notice</h3><p>{selectedEvent?.lookFor ?? observationNote(phase.index)}</p><p className="sky-guidance">{sky.guidance}</p></div>
          <button type="button" className={`primary-action inspector-action${isSaved ? ' is-saved' : ''}`} onClick={toggleSavedNight}>{isSaved ? 'Night saved' : 'Plan this night'}</button>
          <div className="location-tools"><button type="button" onClick={useDeviceLocation} disabled={isLocating}>{isLocating ? 'Finding location…' : 'Use my location'}</button><span aria-live="polite">{locationMessage || coordinatesLabel(observer)}</span></div>
        </aside>
      </section>

      <section className="knowledge-section" id="knowledge">
        <div className="knowledge-heading"><h2>A Moon worth knowing.</h2><p>Six places and phenomena that turn a bright circle into a landscape.</p></div>
        <div className="atlas-layout">
          <div className="atlas-visual" aria-label="Interactive lunar landmark map">
            <Image src="/luna-moon.png" alt="Detailed lunar surface with selectable landmarks" fill sizes="(max-width: 800px) 100vw, 58vw" />
            {atlasPlaces.map((place, index) => <button type="button" key={place.name} className={`hotspot${atlasIndex === index ? ' is-active' : ''}`} style={{ left: `${place.x}%`, top: `${place.y}%` }} onClick={() => setAtlasIndex(index)} aria-label={`Explore ${place.name}`} aria-pressed={atlasIndex === index}>{String(index + 1).padStart(2, '0')}</button>)}
          </div>
          <article className="atlas-note" aria-live="polite">
            <p className="atlas-index">{String(atlasIndex + 1).padStart(2, '0')} <span>/</span> {atlas.name}</p><h3>{atlas.title}</h3><p className="atlas-body">{atlas.body}</p>
            <dl><div><dt>{atlas.factA}</dt><dd>{atlas.valueA}</dd></div><div><dt>{atlas.factB}</dt><dd>{atlas.valueB}</dd></div></dl>
            <div className="atlas-controls"><button type="button" onClick={() => setAtlasIndex((atlasIndex + atlasPlaces.length - 1) % atlasPlaces.length)}><ArrowIcon direction="left" /> Previous place</button><button type="button" className="next-place" onClick={() => setAtlasIndex((atlasIndex + 1) % atlasPlaces.length)}>Next place <ArrowIcon /></button></div>
          </article>
        </div>
        <div className="atlas-rail" role="tablist" aria-label="Lunar field notes">
          {atlasPlaces.map((place, index) => <button type="button" role="tab" aria-selected={atlasIndex === index} className={atlasIndex === index ? 'is-active' : ''} key={place.name} onClick={() => setAtlasIndex(index)}><span>{String(index + 1).padStart(2, '0')}</span>{place.name}</button>)}
        </div>
      </section>

      <section className="events-section" id="events">
        <div className="events-heading"><div><h2>The year, in motion.</h2><p>Phase changes, eclipses, and meteor peaks—filtered into a readable observing plan.</p></div><div className="event-filters" role="group" aria-label="Filter cosmic events">
          {(['All events', 'Moon', 'Eclipse', 'Meteor shower'] as EventFilter[]).map((filter) => <button type="button" className={eventFilter === filter ? 'is-active' : ''} key={filter} onClick={() => setEventFilter(filter)}>{filter === 'Meteor shower' ? 'Meteor showers' : filter === 'Eclipse' ? 'Eclipses' : filter}</button>)}
        </div></div>
        <div className="event-timeline">
          {visibleEvents.slice(0, 6).map((event) => { const eventDate = dateFromKey(event.date); return <article key={event.date}><p className="event-meta">{formatDate(eventDate, { month: 'short', day: 'numeric' })} · {event.name} · {event.short}</p><p>{event.note}</p><button type="button" onClick={() => jumpToCalendar(eventDate)}>View date <ArrowIcon /></button></article>; })}
        </div>
      </section>

      <footer><a className="brand" href="#top">LUNA</a><p>Built for looking up.</p><div className="footer-links"><a href="https://science.nasa.gov/moon/" target="_blank" rel="noreferrer">NASA Moon science</a><a href="https://svs.gsfc.nasa.gov/gallery/moonphase.html" target="_blank" rel="noreferrer">Phase imagery reference</a></div></footer>
    </main>
  );
}
