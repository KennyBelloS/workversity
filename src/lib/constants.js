export const CATEGORIES = {
  universidad: { label: 'Universidad', color: '#3B5BA9' },
  trabajo: { label: 'Trabajo', color: '#6B5FA8' },
};

export const PRIORITIES = {
  baja: { label: 'Baja', color: '#2F7A55' },
  media: { label: 'Media', color: '#A8732A' },
  alta: { label: 'Alta', color: '#B04A3E' },
};

export const TASK_STATUSES = {
  pendiente: { label: 'Por hacer', color: '#807F7A' },
  enProgreso: { label: 'En progreso', color: '#A8732A' },
  hecha: { label: 'Hecha', color: '#2F7A55' },
};

export const STATUS_ORDER = ['pendiente', 'enProgreso', 'hecha'];

export const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 180, label: '3 horas antes' },
  { value: 1440, label: '1 día antes' },
];

export const RECURRENCIAS = [
  { v: 1, t: 'Todos los días' },
  { v: 2, t: 'Cada 2 días' },
  { v: 7, t: 'Cada semana' },
  { v: 14, t: 'Cada 2 semanas' },
  { v: 30, t: 'Cada 30 días (mensual)' },
];
export const etiquetaRecurrencia = (n) => RECURRENCIAS.find((r) => r.v === Number(n))?.t || `Cada ${n} días`;

export const BLOCK_TYPES = {
  clase: { label: 'Clase', color: '#3B5BA9' },
  trabajo: { label: 'Trabajo', color: '#6B5FA8' },
  reunion: { label: 'Reunión', color: '#AD5A77' },
  almuerzo: { label: 'Almuerzo', color: '#A8732A' },
  otro: { label: 'Otro', color: '#3E7E7C' },
};

export const CATEGORIAS_GASTO = [
  'Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Educación', 'Suscripciones', 'Otro',
];
export const CATEGORIAS_INGRESO = ['Salario', 'Freelance', 'Regalo', 'Inversión', 'Otro'];
export const CATEGORIAS_AHORRO = ['Fondo de emergencia', 'Meta personal', 'Inversión', 'Otro'];

export const TRANSACTION_TYPES = {
  ingreso: { label: 'Ingreso', color: '#2F7A55' },
  gasto: { label: 'Gasto', color: '#B04A3E' },
  ahorro: { label: 'Ahorro', color: '#2E4BF0' },
};

// Paleta de pigmentos: colores de materia que conviven con el papel cálido y la tinta.
export const COLORES_SUGERIDOS = ['#3B5BA9', '#B04A3E', '#2F7A55', '#A8732A', '#6B5FA8', '#3E7E7C', '#AD5A77', '#7A6A58'];

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const currencyFormat = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
