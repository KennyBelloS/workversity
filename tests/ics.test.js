import { describe, it, expect } from 'vitest';
import { generarICS, enlaceGoogle } from '../supabase/functions/_shared/ics.js';

const ahora = new Date('2026-09-21T15:00:00Z');
const ics = generarICS({
  ahora, zona: 'America/Bogota', semanas: 16,
  materias: [
    { id: 'm1', nombre: 'Cálculo II, grupo 3', day_of_week: 1, start_minutes: 480, end_minutes: 570, salon: 'B-204', profesor: 'Pérez', nrc: '123', tiene_recordatorio: true, recordatorio_minutos_antes: 60 },
    { id: 'm2', nombre: 'Web', day_of_week: 2, start_minutes: 600, end_minutes: 720, es_virtual: true, enlace_virtual: 'https://meet.google.com/abc', tiene_recordatorio: true },
  ],
  bloques: [{ id: 'b1', title: 'Reunión de equipo', type: 'reunion', day_of_week: 3, start_minutes: 900, end_minutes: 960, location: 'Meet' }],
  tareas: [{ id: 't1', title: 'Parcial: ¡Cálculo; entrega, final!', due_date: '2026-09-25T20:00:00Z', has_reminder: true, reminder_minutes_before: 60, priority: 'alta', materia_id: 'm1', description: 'Llevar calculadora' }],
});

describe('exportar al calendario (.ics)', () => {
  it('estructura válida con alarmas y zona horaria', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(4);
    expect(ics).toContain('BEGIN:VTIMEZONE');
    expect(ics).toContain('DTSTART;TZID=America/Bogota:20260921T080000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;COUNT=16');
  });
  it('escapa caracteres especiales y respeta el límite de 75 bytes por línea', () => {
    expect(ics).toContain('Cálculo II\\, grupo 3');
    expect(ics).toContain('Parcial: ¡Cálculo\\; entrega\\, final!');
    const enc = new TextEncoder();
    ics.split('\r\n').forEach((l) => expect(enc.encode(l).length).toBeLessThanOrEqual(75));
    expect(/[^\r]\n/.test(ics)).toBe(false);
  });
  it('enlace de Google Calendar con repetición', () => {
    const g = enlaceGoogle({ titulo: 'Clase', inicio: new Date('2026-09-21T13:00:00Z'), fin: new Date('2026-09-21T14:30:00Z'), semanas: 16 });
    expect(g).toContain('dates=20260921T130000Z%2F20260921T143000Z');
    expect(g).toContain('recur=RRULE');
  });
});
