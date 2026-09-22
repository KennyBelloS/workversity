import { crearRepositorio } from '../offline/repositorio';

// --- Movimientos (ingreso / gasto / ahorro) ---

const movimientos = crearRepositorio({
  tabla: 'movimientos',
  comparar: (a, b) => new Date(b.date) - new Date(a.date),
});

export const listarMovimientos = () => movimientos.listar();
export const crearMovimiento = (mov, userId) => movimientos.crear(mov, userId);
export const actualizarMovimiento = (id, cambios) => movimientos.actualizar(id, cambios);
export const eliminarMovimiento = (id) => movimientos.eliminar(id);

// --- Metas de ahorro ---

const metas = crearRepositorio({
  tabla: 'metas',
  comparar: (a, b) => new Date(b.created_at) - new Date(a.created_at),
});

export const listarMetas = () => metas.listar();
export const crearMeta = (meta, userId) => metas.crear(meta, userId);
export const actualizarMeta = (id, cambios) => metas.actualizar(id, cambios);
export const eliminarMeta = (id) => metas.eliminar(id);

// --- Presupuesto mensual (uno por mes) ---

const presupuestos = crearRepositorio({
  tabla: 'presupuestos_mensuales',
  conflicto: 'user_id,mes',
});

export const listarPresupuestos = () => presupuestos.listar();
export const crearPresupuesto = (p, userId) => presupuestos.crear(p, userId);

export async function obtenerPresupuesto(mes) {
  const todos = await presupuestos.listar();
  return todos.find((p) => p.mes === mes) || null;
}

export async function guardarPresupuesto(mes, amount, userId) {
  const existente = (await presupuestos.listar()).find((p) => p.mes === mes);
  if (existente) return presupuestos.actualizar(existente.id, { amount });
  return presupuestos.crear({ mes, amount }, userId);
}
