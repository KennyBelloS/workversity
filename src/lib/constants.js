export const CATEGORIES = {
  universidad: { label: 'Universidad', color: '#5B8DEF' },
  trabajo: { label: 'Trabajo', color: '#8B7FD1' },
};

export const PRIORITIES = {
  baja: { label: 'Baja', color: '#17C964' },
  media: { label: 'Media', color: '#F5A524' },
  alta: { label: 'Alta', color: '#E5484D' },
};

export const TASK_STATUSES = {
  pendiente: { label: 'Por hacer', color: '#6E7180' },
  enProgreso: { label: 'En progreso', color: '#F5A524' },
  hecha: { label: 'Hecha', color: '#17C964' },
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
  clase: { label: 'Clase', color: '#5B8DEF' },
  trabajo: { label: 'Trabajo', color: '#8B7FD1' },
  reunion: { label: 'Reunión', color: '#E5789C' },
  almuerzo: { label: 'Almuerzo', color: '#F5A524' },
  otro: { label: 'Otro', color: '#7FD1C3' },
};

export const CATEGORIAS_GASTO = [
  'Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Educación', 'Suscripciones', 'Otro',
];
export const CATEGORIAS_INGRESO = ['Salario', 'Freelance', 'Regalo', 'Inversión', 'Otro'];
export const CATEGORIAS_AHORRO = ['Fondo de emergencia', 'Meta personal', 'Inversión', 'Otro'];

export const TRANSACTION_TYPES = {
  ingreso: { label: 'Ingreso', color: '#17C964' },
  gasto: { label: 'Gasto', color: '#E5484D' },
  ahorro: { label: 'Ahorro', color: '#3E7BFA' },
};

export const COLORES_SUGERIDOS = ['#5B8DEF', '#7FD1C3', '#8B7FD1', '#F5A524', '#E5789C', '#6FA8DC'];

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const currencyFormat = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
