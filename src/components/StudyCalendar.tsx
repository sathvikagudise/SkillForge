import React, { useMemo, useState } from 'react';

type Props = {
  dailyTotals: Record<string, number>;
  onChange?: (map: Record<string, number>) => void;
};

function monthMatrix(year: number, month: number) {
  // month: 0-based
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0 Sun .. 6 Sat
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

export default function StudyCalendar({ dailyTotals, onChange }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const weeks = useMemo(() => monthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);

  const keyFor = (d: number) => {
    const y = viewYear;
    const m = (viewMonth + 1).toString().padStart(2, '0');
    const day = d.toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{new Date(viewYear, viewMonth).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded border" onClick={() => {
            const m = viewMonth - 1;
            if (m < 0) { setViewMonth(11); setViewYear(viewYear -1); } else setViewMonth(m);
          }}>Prev</button>
          <button className="px-2 py-1 rounded border" onClick={() => {
            const m = viewMonth + 1;
            if (m > 11) { setViewMonth(0); setViewYear(viewYear +1); } else setViewMonth(m);
          }}>Next</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="font-semibold">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mt-2">
        {weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.map((d, di) => {
              if (d === 0) return <div key={di} className="h-20 border rounded bg-gray-50" />;
              const k = `${viewYear}-${(viewMonth+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
              const minutes = dailyTotals?.[k] || 0;
              return (
                <div key={di} className="h-20 border rounded p-1 flex flex-col justify-between">
                  <div className="text-sm font-medium">{d}</div>
                  <div className="text-xs text-muted-foreground">{minutes} min</div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
