import { crearRepositorio } from '../offline/repositorio';

const parciales = crearRepositorio({ tabla: 'parciales', comparar: (a, b) => new Date(a.fecha || '9999-12-31') - new Date(b.fecha || '9999-12-31') });
const fuentes = crearRepositorio({ tabla: 'parcial_fuentes', comparar: (a, b) => new Date(b.created_at) - new Date(a.created_at) });
const tarjetas = crearRepositorio({ tabla: 'parcial_tarjetas', comparar: (a, b) => new Date(a.created_at) - new Date(b.created_at) });
const resultados = crearRepositorio({ tabla: 'parcial_resultados', comparar: (a, b) => new Date(b.created_at) - new Date(a.created_at) });

export const listarParciales = () => parciales.listar();
export const crearParcial = (datos, userId) => parciales.crear(datos, userId);
export const actualizarParcial = (id, cambios) => parciales.actualizar(id, cambios);
export const eliminarParcial = (id) => parciales.eliminar(id);

export const listarFuentes = () => fuentes.listar();
export const crearFuente = (datos, userId) => fuentes.crear(datos, userId);
export const eliminarFuente = (id) => fuentes.eliminar(id);

export const listarTarjetas = () => tarjetas.listar();
export const crearTarjeta = (datos, userId) => tarjetas.crear(datos, userId);
export const actualizarTarjeta = (id, cambios) => tarjetas.actualizar(id, cambios);
export const eliminarTarjeta = (id) => tarjetas.eliminar(id);

export const listarResultados = () => resultados.listar();
export const crearResultado = (datos, userId) => resultados.crear(datos, userId);
