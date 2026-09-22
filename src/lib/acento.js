// Color de acento y tamaño de texto (preferencias guardadas en el dispositivo).
export const ACENTOS = {
  azul: { nombre: 'Azul', claro: { primary: '111 168 220', dark: '74 127 181', soft: '234 243 251' }, oscuro: { primary: '111 168 220', dark: '88 146 203', soft: '30 46 72' } },
  verde: { nombre: 'Verde', claro: { primary: '52 178 123', dark: '36 143 95', soft: '229 246 238' }, oscuro: { primary: '74 200 143', dark: '52 168 116', soft: '20 52 40' } },
  violeta: { nombre: 'Violeta', claro: { primary: '139 127 209', dark: '112 98 190', soft: '240 237 251' }, oscuro: { primary: '165 155 230', dark: '139 127 209', soft: '38 34 66' } },
  rosa: { nombre: 'Rosa', claro: { primary: '229 120 156', dark: '204 90 128', soft: '252 236 242' }, oscuro: { primary: '240 145 176', dark: '220 110 148', soft: '62 30 44' } },
  ambar: { nombre: 'Ámbar', claro: { primary: '230 154 30', dark: '190 120 10', soft: '253 244 227' }, oscuro: { primary: '245 176 65', dark: '220 150 40', soft: '62 48 20' } },
  turquesa: { nombre: 'Turquesa', claro: { primary: '46 174 176', dark: '30 140 142', soft: '226 246 246' }, oscuro: { primary: '80 200 202', dark: '50 165 168', soft: '18 52 54' } },
};
export const TAMANOS_TEXTO = { normal: { etiqueta: 'Normal', px: 16 }, grande: { etiqueta: 'Grande', px: 18 }, enorme: { etiqueta: 'Muy grande', px: 20 } };
export const CLAVE_ACENTO = 'workversity:acento';
export const CLAVE_TEXTO = 'workversity:texto';

const leer = (clave, valido, defecto) => { try { const v = localStorage.getItem(clave); return valido(v) ? v : defecto; } catch { return defecto; } };
export const leerAcento = () => leer(CLAVE_ACENTO, (v) => v in ACENTOS, 'azul');
export const leerTexto = () => leer(CLAVE_TEXTO, (v) => v in TAMANOS_TEXTO, 'normal');

export function aplicarAcento(nombre, oscuro) {
  if (typeof document === 'undefined') return;
  const v = (ACENTOS[nombre] || ACENTOS.azul)[oscuro ? 'oscuro' : 'claro'];
  const s = document.documentElement.style;
  s.setProperty('--primary', v.primary);
  s.setProperty('--primaryDark', v.dark);
  s.setProperty('--primarySoft', v.soft);
}
export function aplicarTexto(nombre) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.fontSize = `${(TAMANOS_TEXTO[nombre] || TAMANOS_TEXTO.normal).px}px`;
}
