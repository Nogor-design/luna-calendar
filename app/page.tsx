'use client';

import { useMemo, useState } from 'react';

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

const cosmicEvents = [
  {
    date: '2026-08-28',
    name: 'Partial lunar eclipse',
    type: 'Eclipse',
    note: 'Visible across the Americas, Europe and Africa.',
  },
  {
    date: '2026-10-21',
    name: 'Orionids peak',
    type: 'Meteor shower',
    note: 'Best viewed after midnight from a dark location.',
  },
  {
    date: '2026-11-16',
    name: 'Leonids peak',
    type: 'Meteor shower',
    note: 'Fast meteors radiating from the constellation Leo.',
  },
  {
    date: '2026-12-13',
    name: 'Geminids peak',
    type: 'Meteor shower',
    note: 'One of the strongest annual meteor showers.',
  },
  {
    date: '2027-02-06',
    name: 'Annular solar eclipse',
    type: 'Eclipse',
    note: 'The Moon leaves a bright ring around the Sun.',
  },
];

function moonPhase(date: Date) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / DAY_MS;
  const fraction = ((days / SYNODIC_MONTH) % 1 + 1) % 1;
  const index = Math.round(fraction * 8) % 8;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * fraction)) * 50);
  return { fraction, index, illumination, name: phaseNames[index] };
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function makeMonthDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = Array(firstWeekday).fill(null);

  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(new Date(year, month, day, 12));
  }

  while (cells.length % 7) cells.push(null);
  return cells;
}

function nextMajorPhases(from: Date) {
  const labels = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];
  const results: Array<{ name: string; date: Date }> = [];
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
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

export default function Home() {
  const [today] = useState(() => new Date());
  const [viewDate, setViewDate] = useState(() => new Date());
  const monthDays = useMemo(() => makeMonthDays(viewDate), [viewDate]);
  const todayPhase = moonPhase(today);
  const upcomingPhases = useMemo(() => nextMajorPhases(today), [today]);
  const futureEvents = cosmicEvents.filter((event) => event.date >= dateKey(today));
  const upcomingEvents = (futureEvents.length ? futureEvents : cosmicEvents.slice(-4)).slice(0, 4);

  const moveMonth = (amount: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Luna home">
          <span className="brand-mark" aria-hidden="true">◐</span>
          <span>Luna</span>
        </a>
        <a className="quiet-link" href="#events">Cosmic events <span aria-hidden="true">↓</span></a>
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
        {upcomingPhases.map((phase, index) => (
          <article key={`${phase.name}-${phase.date.toISOString()}`}>
            <span className="mini-moon" aria-hidden="true">{majorPhaseGlyphs[phase.name]}</span>
            <div>
              <strong>{phase.name}</strong>
              <span>{phase.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="calendar-section" id="calendar">
        <div className="section-heading">
          <div>
            <span className="section-number">01</span>
            <p className="eyebrow">Lunar calendar</p>
            <h2>{viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
          </div>
          <div className="calendar-controls" aria-label="Calendar navigation">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">←</button>
            <button type="button" className="today-button" onClick={() => setViewDate(new Date())}>Today</button>
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
                <div className={`day${isToday ? ' is-today' : ''}${event ? ' has-event' : ''}`} key={dateKey(date)}>
                  <span className="day-number">{date.getDate()}</span>
                  <span className={`day-moon${isMajor ? ' major' : ''}`} aria-label={phase.name} title={phase.name}>
                    {phaseGlyphs[phase.index]}
                  </span>
                  {event && <span className="event-dot" title={event.name} aria-label={event.name} />}
                </div>
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
            <span className="section-number">02</span>
            <p className="eyebrow">Cosmic events</p>
            <h2>Worth looking up for</h2>
          </div>
          <p>Dates are approximate and visibility depends on your location and local conditions.</p>
        </div>

        <div className="event-list">
          {upcomingEvents.map((event, index) => {
            const eventDate = new Date(`${event.date}T12:00:00`);
            return (
              <article className="event-row" key={event.date}>
                <span className="event-index">{String(index + 1).padStart(2, '0')}</span>
                <time dateTime={event.date}>
                  <strong>{eventDate.toLocaleDateString(undefined, { day: '2-digit' })}</strong>
                  <span>{eventDate.toLocaleDateString(undefined, { month: 'short' })}</span>
                </time>
                <div className="event-copy">
                  <span className="event-type">{event.type}</span>
                  <h3>{event.name}</h3>
                  <p>{event.note}</p>
                </div>
                <span className="event-arrow" aria-hidden="true">↗</span>
              </article>
            );
          })}
        </div>
      </section>

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
