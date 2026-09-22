const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_CORTOS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

export function formatearFechaHora(fechaIso) {
  const d = new Date(fechaIso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} · ${h}:${m}`;
}

// Convierte a Date respetando la zona horaria local. Una fecha "YYYY-MM-DD"
// (columna tipo date) NO debe pasar por new Date('2026-09-01'), que la toma
// como medianoche UTC y en Colombia la muestra como el día anterior.
export function aFechaLocal(valor) {
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [y, m, d] = valor.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(valor);
}

export function formatearFechaCorta(fechaIso) {
  const d = aFechaLocal(fechaIso);
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatearFechaLarga(fecha) {
  const idx = (fecha.getDay() + 6) % 7;
  return `${DIAS[idx]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

export function nombreMes(fecha) {
  const m = MESES[fecha.getMonth()];
  return `${m[0].toUpperCase()}${m.slice(1)} ${fecha.getFullYear()}`;
}

export function esMismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function inicioSemana(fecha) {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function diasDelMesConRelleno(fecha) {
  const year = fecha.getFullYear();
  const month = fecha.getMonth();
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const relleno = (primerDia.getDay() + 6) % 7;
  const dias = [];
  for (let i = 0; i < relleno; i++) dias.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(year, month, d));
  return dias;
}

export function minutosAHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// Fecha "YYYY-MM-DD" según la hora LOCAL del usuario. (toISOString() usa UTC y
// en Colombia, después de las 7 p. m., devolvería el día siguiente.)
export function fechaLocalISO(fecha = new Date()) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Mes "YYYY-MM" de una fecha, según la hora local del usuario.
export function claveMesDe(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function claveMesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export { DIAS, MESES };
