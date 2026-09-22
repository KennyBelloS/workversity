import { describe, it, expect } from 'vitest';
import { esAdmin, normalizarCodigo, codigoValido, nombreDeMiembro, combinarAgendas, seCruzaConAlgo, tablaPosiciones, ordenarSolicitudes, destinatarioTexto } from '../src/lib/espacios.js';

const perfiles = [{ id: 'u1', nombre: 'Ana', puntos: 40 }, { id: 'u2', nombre: 'Luis', puntos: 90 }];
const admin = { user_id: 'u1', rol: 'admin', color: '#5B8DEF', esYo: true };
const miembro = { user_id: 'u2', rol: 'miembro', color: '#E5789C' };

describe('espacios compartidos', () => {
  it('roles', () => {
    expect(esAdmin(admin)).toBe(true);
    expect(esAdmin(miembro)).toBe(false);
    expect(esAdmin(null)).toBe(false);
  });
  it('códigos de invitación', () => {
    expect(normalizarCodigo(' ab-12 3 ')).toBe('AB123');
    expect(codigoValido('AB12CD')).toBe(true);
    expect(codigoValido('ab')).toBe(false);
    expect(codigoValido('')).toBe(false);
  });
  it('nombre para mostrar', () => {
    expect(nombreDeMiembro(admin, perfiles)).toBe('Tú');
    expect(nombreDeMiembro(miembro, perfiles)).toBe('Luis');
    expect(nombreDeMiembro({ user_id: 'x' }, perfiles)).toBe('Alguien del espacio');
  });
  it('combina las agendas de todos, ordenadas y con quién es cada evento', () => {
    const r = combinarAgendas([
      { miembro: admin, eventos: [{ inicio: new Date(2026, 8, 22, 10), fin: new Date(2026, 8, 22, 11), titulo: 'Cálculo' }] },
      { miembro, eventos: [{ inicio: new Date(2026, 8, 22, 9), fin: new Date(2026, 8, 22, 9, 30), titulo: 'Gimnasio' }] },
    ], perfiles);
    expect(r.map((e) => e.titulo)).toEqual(['Gimnasio', 'Cálculo']);
    expect(r[0]).toMatchObject({ persona: 'Luis', personaId: 'u2', colorPersona: '#E5789C' });
    expect(r[1]).toMatchObject({ persona: 'Tú' });
  });
  it('detecta choques de horario', () => {
    const ocupado = [{ inicio: new Date(2026, 8, 22, 10), fin: new Date(2026, 8, 22, 11) }];
    expect(seCruzaConAlgo(new Date(2026, 8, 22, 10, 30), new Date(2026, 8, 22, 11, 30), ocupado)).toHaveLength(1);
    expect(seCruzaConAlgo(new Date(2026, 8, 22, 11), new Date(2026, 8, 22, 12), ocupado)).toHaveLength(0);
    expect(seCruzaConAlgo(new Date(2026, 8, 22, 8), new Date(2026, 8, 22, 9), ocupado)).toHaveLength(0);
  });
  it('tabla de posiciones por puntos', () => {
    const t = tablaPosiciones([admin, miembro], perfiles);
    expect(t.map((m) => m.nombre)).toEqual(['Luis', 'Tú']);
    expect(t[0].puntos).toBe(90);
  });
  it('ordena solicitudes: pendientes primero, luego más recientes', () => {
    const s = [
      { id: 1, estado: 'aceptada', created_at: '2026-09-20T10:00:00Z' },
      { id: 2, estado: 'pendiente', created_at: '2026-09-19T10:00:00Z' },
      { id: 3, estado: 'pendiente', created_at: '2026-09-21T10:00:00Z' },
    ];
    expect(ordenarSolicitudes(s).map((x) => x.id)).toEqual([3, 2, 1]);
  });
  it('destinatario de una solicitud', () => {
    expect(destinatarioTexto({ para_user_id: null }, [admin, miembro], perfiles)).toBe('Para todo el espacio');
    expect(destinatarioTexto({ para_user_id: 'u2' }, [admin, miembro], perfiles)).toBe('Para Luis');
  });
});
