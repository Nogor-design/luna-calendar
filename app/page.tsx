import LunaCalendar from './LunaCalendar';

export default function Home() {
  const initialDateKey = new Date().toISOString().slice(0, 10);

  return <LunaCalendar initialDateKey={initialDateKey} />;
}
