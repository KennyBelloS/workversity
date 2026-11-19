import { describe, it, expect } from 'vitest';
import { resumirMiSemana, ALCANCES, alcanceDe } from '../src/lib/espacios';

const materias = [{ day_of_week: 1, start_minutes: 480, end_minutes: 600, nombre: 'Cálculo II', salon: 'B-204' }];
const bloques = [
  { day_of_week: 1, start_minutes: 900, end_minutes: 1200, title: 'Turno', type: 'trabajo', location: 'Centro' },
  { day_of_week: 3, start_minutes: 660, end_minutes: 720, title: 'Asesoría', type: 'reunion', location: 'Sala 2' },
];
const tareas = [
  { status: 'pendiente', due_date: '2026-11-18T13:30:00', title: 'Guía de integrales' },
  { status: 'hecha', due_date: '2026-11-18T13:30:00', title: 'Ya entregada' },
];
const datos = { materias, bloques, tareas };

describe('alcances de lo que se comparte en el grupo', () => {
  it('«solo citas» no publica ningún bloque', () => {
    expect(resumirMiSemana(datos, 'citas')).toEqual([]);
  });

  it('«solo entregas» publica únicamente las tareas pendientes', () => {
    const r = resumirMiSemana(datos, 'tareas');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ tipo: 'tarea', titulo: 'Guía de integrales' });
  });

  it('«solo reuniones» deja fuera clases y turnos', () => {
    const r = resumirMiSemana(datos, 'reuniones');
    expect(r.map((x) => x.tipo)).toEqual(['reunion']);
  });

  it('«toda la semana» incluye clases, turnos, reuniones y entregas', () => {
    const tipos = new Set(resumirMiSemana(datos, 'todo').map((x) => x.tipo));
    expect(tipos).toEqual(new Set(['clase', 'trabajo', 'reunion', 'tarea']));
  });

  it('sin alcance conocido se comporta como «toda la semana»', () => {
    expect(alcanceDe('inventado').id).toBe('todo');
    expect(resumirMiSemana(datos).length).toBe(resumirMiSemana(datos, 'todo').length);
  });

  it('los bloques salen ordenados por día y hora', () => {
    const r = resumirMiSemana(datos, 'todo');
    const orden = r.map((x) => x.dia * 10000 + x.inicio);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
  });

  it('hay cuatro alcances y todos traen descripción', () => {
    expect(ALCANCES).toHaveLength(4);
    for (const a of ALCANCES) expect(a.detalle.length).toBeGreaterThan(20);
  });
});
