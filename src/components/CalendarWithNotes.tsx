import React, { useMemo, useState, useEffect } from 'react';

type NoteItem = { id: string; text: string; created_at: string; color: string; completed?: boolean };

const NOTE_COLORS = ['bg-yellow-100', 'bg-blue-100', 'bg-pink-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100'];
const NOTE_TEXT_COLORS = ['text-yellow-900', 'text-blue-900', 'text-pink-900', 'text-green-900', 'text-purple-900', 'text-orange-900'];
const NOTE_BORDER_COLORS = ['border-yellow-300', 'border-blue-300', 'border-pink-300', 'border-green-300', 'border-purple-300', 'border-orange-300'];

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: number[][] = [];
  let week: number[] = [];
  for (let i = 0; i < startDay; i++) week.push(0);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(0);
    weeks.push(week);
  }
  return weeks;
}

export default function CalendarWithNotes() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const [notesMap, setNotesMap] = useState<Record<string, NoteItem[]>>({});
  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('study_calendar_notes');
      if (raw) setNotesMap(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (m: Record<string, NoteItem[]>) => {
    try {
      localStorage.setItem('study_calendar_notes', JSON.stringify(m));
    } catch {}
  };

  const weeks = useMemo(() => monthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);

  const keyFor = (day: number) => `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  const addNote = () => {
    if (!selectedDay) return;
    const key = keyFor(selectedDay);
    const items = notesMap[key] || [];
    const note: NoteItem = { id: String(Date.now()), text: text.trim(), created_at: new Date().toISOString(), color: NOTE_COLORS[selectedColor] };
    const next = { ...notesMap, [key]: [...items, note] };
    setNotesMap(next);
    persist(next);
    setText('');
  };

  const removeNote = (key: string, id: string) => {
    const items = (notesMap[key] || []).filter((n) => n.id !== id);
    const next = { ...notesMap, [key]: items };
    setNotesMap(next);
    persist(next);
  };

  const toggleNoteComplete = (key: string, id: string) => {
    const items = (notesMap[key] || []).map((n) => (n.id === id ? { ...n, completed: !n.completed } : n));
    const next = { ...notesMap, [key]: items };
    setNotesMap(next);
    persist(next);
  };

  const minutesFor = (day: number) => {
    try {
      const raw = localStorage.getItem('tools_timer_daily_totals');
      const map = raw ? JSON.parse(raw) : {};
      const k = `${viewYear}-${(viewMonth + 1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
      return map[k] || 0;
    } catch { return 0; }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">{new Date(viewYear, viewMonth).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <div className="flex gap-2">
            <button className="px-2 py-1 rounded border" onClick={() => { const m = viewMonth - 1; if (m < 0) { setViewMonth(11); setViewYear(viewYear-1); } else setViewMonth(m); }}>Prev</button>
            <button className="px-2 py-1 rounded border" onClick={() => { const m = viewMonth + 1; if (m > 11) { setViewMonth(0); setViewYear(viewYear+1); } else setViewMonth(m); }}>Next</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="font-semibold">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 mt-2">
          {weeks.map((week, wi) => (
            <React.Fragment key={wi}>
              {week.map((d, di) => {
                if (d === 0) return <div key={di} className="h-24 border rounded bg-gray-50" />;
                const k = keyFor(d);
                const minutes = minutesFor(d);
                const selected = selectedDay === d && viewMonth === today.getMonth() && viewYear === today.getFullYear() ? 'ring-2 ring-primary' : '';
                const notesForDay = notesMap[k] || [];
                const noteCount = notesForDay.length;
                  const dayNotes = notesForDay;
                  const firstColor = dayNotes.length ? dayNotes[0].color : null;
                  const colorIndex = firstColor ? NOTE_COLORS.indexOf(firstColor) : -1;
                  const badgeTextClass = colorIndex >= 0 ? NOTE_TEXT_COLORS[colorIndex] : 'text-muted-foreground';
                  const badgeBgClass = colorIndex >= 0 ? firstColor : '';

                  return (
                    <div key={di} className={`h-24 border rounded p-2 flex flex-col justify-between cursor-pointer ${selected}`} onClick={() => setSelectedDay(d)}>
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-medium">{d}</div>
                        {minutes > 0 && <div className="text-xs text-muted-foreground">{minutes}m</div>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">{dayNotes.length} note(s)</div>
                        {dayNotes.length > 0 && (
                          <div className={`px-2 py-0.5 rounded-full text-[10px] ${badgeBgClass} ${badgeTextClass}`}>{dayNotes.length}</div>
                        )}
                      </div>
                    </div>
                  );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2">
          <div className="text-sm text-muted-foreground">Notes for</div>
          <div className="font-medium">{viewYear}-{(viewMonth+1).toString().padStart(2,'0')}-{(selectedDay || 0).toString().padStart(2,'0')}</div>
        </div>

        <div className="mb-2">
          <textarea className="w-full rounded border p-2" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a note for this day" />
          <div className="mt-2 mb-2">
            <div className="text-sm text-muted-foreground mb-1">Color:</div>
            <div className="flex gap-2">
              {NOTE_COLORS.map((c, i) => (
                <button key={i} title={`Color ${i + 1}`} className={`w-8 h-8 rounded ${c} ${selectedColor === i ? 'ring-2 ring-offset-2 ring-black' : ''}`} onClick={() => setSelectedColor(i)} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 rounded bg-primary text-white" onClick={addNote}>Add Note</button>
            <button className="px-3 py-1 rounded border" onClick={() => setText('')}>Clear</button>
          </div>
        </div>

        <div>
          {(selectedDay ? (notesMap[keyFor(selectedDay)] || []) : []).map(n => (
            <div key={n.id} className={`p-3 border rounded mb-2 ${n.color || 'bg-white'} ${NOTE_BORDER_COLORS[NOTE_COLORS.indexOf(n.color || NOTE_COLORS[0])]} ${n.completed ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 cursor-pointer" 
                  checked={n.completed || false} 
                  onChange={() => toggleNoteComplete(keyFor(selectedDay || 0), n.id)}
                  title="Mark as done"
                />
                <div className="flex-1">
                  <div className={`text-sm ${NOTE_TEXT_COLORS[NOTE_COLORS.indexOf(n.color || NOTE_COLORS[0])]} ${n.completed ? 'line-through' : ''}`}>{n.text}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-2">
                <button className="text-sm text-destructive" onClick={() => removeNote(keyFor(selectedDay || 0), n.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
