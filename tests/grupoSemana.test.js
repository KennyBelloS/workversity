import { describe, it, expect } from 'vitest';
import { resumirMiSemana, semanaDelGrupo, huecosDelGrupo, iniciales } from '../src/lib/espacios';

const miembros = [
  { user_id: 'u1', color: '#3B5BA9' },
  { user_id: 'u2', color: '#B04A3E' },
];
const perfiles = [
  { id: 'u1', nombre: 'Kenny Bello' },
  { id: 'u2', nombre: 'Laura Gómez' },
];

describe('resumirMiSemana', () => {
  it('convierte materias y compromisos en bloques simples y ordenados', () => {
    const r = resumirMiSemana({
      materias: [{ day_of_week: 3, start_minutes: 600, end_minutes: 720, nombre: 'Cálculo', salon: 'B-204' }],
      bloques: [{ day_of_week: 1, start_minutes: 540, end_minutes: 600, title: 'Turno', type: 'trabajo', location: 'Tienda' }],
    });
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ dia: 1, tipo: 'trabajo', titulo: 'Turno' });
    expect(r[1]).toMatchObject({ dia: 3, tipo: 'clase', lugar: 'B-204' });
  });

  it('descarta bloques imposibles y marca las clases virtuales', () => {
    const r = resumirMiSemana({
      materias: [{ day_of_week: 2, start_minutes: 600, end_minutes: 660, nombre: 'Bases', es_virtual: true }, { day_of_week: 9, start_minutes: 1, end_minutes: 2, nombre: 'X' }],
      bloques: [{ day_of_week: 2, start_minutes: 700, end_minutes: 700, title: 'Vacío', type: 'otro' }],
    });
    expect(r).toHaveLength(1);
    expect(r[0].lugar).toBe('Virtual');
  });
});

describe('semanaDelGrupo', () => {
  const horarios = [
    { user_id: 'u1', bloques: [{ dia: 1, inicio: 600, fin: 720, titulo: 'Cálculo', tipo: 'clase' }] },
    { user_id: 'u2', bloques: [{ dia: 1, inicio: 540, fin: 600, titulo: 'Turno', tipo: 'trabajo' }] },
  ];

  it('cada bloque dice de quién es, con sus iniciales y su color', () => {
    const dias = semanaDelGrupo({ horarios, miembros, perfiles });
    expect(dias[0]).toHaveLength(2);
    expect(dias[0][0]).toMatchObject({ persona: 'Laura Gómez', iniciales: 'LG', color: '#B04A3E' });
    expect(dias[0][1]).toMatchObject({ persona: 'Kenny Bello', iniciales: 'KB' });
  });

  it('agrega las reuniones aceptadas con quién va', () => {
    const inicio = new Date('2026-11-16T18:00:00');
    const fin = new Date('2026-11-16T19:00:00');
    const dias = semanaDelGrupo({
      horarios: [], miembros, perfiles,
      reuniones: [{ id: 'r1', de_user_id: 'u1', para_user_id: 'u2', titulo: 'Repasar parcial', inicio: inicio.toISOString(), fin: fin.toISOString() }],
    });
    const lunes = dias[0];
    expect(lunes).toHaveLength(1);
    expect(lunes[0].esReunion).toBe(true);
    expect(lunes[0].persona).toBe('Kenny Bello');
    expect(lunes[0].con[0].persona).toBe('Laura Gómez');
  });
});

describe('huecosDelGrupo', () => {
  it('encuentra las franjas libres de al menos 45 minutos', () => {
    const h = huecosDelGrupo([{ inicio: 600, fin: 720 }, { inicio: 740, fin: 800 }], { desde: 540, hasta: 900 });
    expect(h).toEqual([{ inicio: 540, fin: 600 }, { inicio: 800, fin: 900 }]);
  });
  it('sin nada ocupado, el día entero es un hueco', () => {
    expect(huecosDelGrupo([], { desde: 420, hasta: 1320 })).toEqual([{ inicio: 420, fin: 1320 }]);
  });
});

describe('iniciales', () => {
  it('toma la primera letra de los dos primeros nombres', () => {
    expect(iniciales('Kenny Bello')).toBe('KB');
    expect(iniciales('Ana')).toBe('A');
    expect(iniciales('')).toBe('··');
  });
});
