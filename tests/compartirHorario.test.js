import { describe, it, expect, vi, beforeEach } from 'vitest';

// La tabla puede existir sin la columna `alcance` si todavía no corrieron el SQL nuevo.
const upsert = vi.fn();
vi.mock('../src/services/supabase', () => ({
  supabase: { from: () => ({ upsert: (...a) => upsert(...a) }) },
}));

const { publicarMiHorario } = await import('../src/services/espacios');

describe('publicar mi horario cuando la base de datos está atrasada', () => {
  beforeEach(() => upsert.mockReset());

  it('guarda el alcance cuando la columna existe', async () => {
    upsert.mockResolvedValueOnce({ error: null });
    await publicarMiHorario('e1', 'u1', [], 'tareas');
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0]).toMatchObject({ alcance: 'tareas' });
  });

  it('si falta la columna, reintenta sin ella en vez de fallar', async () => {
    upsert.mockResolvedValueOnce({ error: { code: 'PGRST204', message: "Could not find the 'alcance' column of 'horarios_compartidos' in the schema cache" } });
    upsert.mockResolvedValueOnce({ data: null, error: null });
    await expect(publicarMiHorario('e1', 'u1', [], 'tareas')).resolves.toBeUndefined();
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert.mock.calls[1][0]).not.toHaveProperty('alcance');
  });

  it('cualquier otro error sí se reporta', async () => {
    upsert.mockResolvedValueOnce({ error: { message: 'permiso denegado' } });
    await expect(publicarMiHorario('e1', 'u1', [], 'todo')).rejects.toThrow();
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
