import { useSyncExternalStore } from 'react';
import { aplicarAcento, aplicarTexto, leerAcento, leerTexto, CLAVE_ACENTO, CLAVE_TEXTO } from '../lib/acento';

const CLAVE = 'workversity:tema'; // 'claro' | 'oscuro' | 'sistema'
const oyentes = new Set();
const consultaOscuro = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function leerPreferencia() {
  try {
    return localStorage.getItem(CLAVE) || 'sistema';
  } catch {
    return 'sistema';
  }
}

function esOscuro(pref) {
  return pref === 'oscuro' || (pref === 'sistema' && !!consultaOscuro?.matches);
}

let estado = { preferencia: leerPreferencia(), oscuro: esOscuro(leerPreferencia()) };

function aplicar() {
  document.documentElement.classList.toggle('dark', estado.oscuro);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', estado.oscuro ? '#0C121E' : '#6FA8DC');
  aplicarAcento(leerAcento(), estado.oscuro);
}

function actualizar(preferencia) {
  estado = { preferencia, oscuro: esOscuro(preferencia) };
  aplicar();
  oyentes.forEach((f) => f());
}

export function elegirTema(preferencia) {
  try {
    localStorage.setItem(CLAVE, preferencia);
  } catch {
    /* nada */
  }
  actualizar(preferencia);
}

export function elegirAcento(nombre) {
  try { localStorage.setItem(CLAVE_ACENTO, nombre); } catch { /* nada */ }
  aplicar();
}
export function elegirTexto(nombre) {
  try { localStorage.setItem(CLAVE_TEXTO, nombre); } catch { /* nada */ }
  aplicarTexto(nombre);
}

if (typeof window !== 'undefined') {
  aplicarTexto(leerTexto());
  aplicar();
  consultaOscuro?.addEventListener?.('change', () => {
    if (estado.preferencia === 'sistema') actualizar('sistema');
  });
}

/** { preferencia: 'claro'|'oscuro'|'sistema', oscuro: boolean } */
export function useTema() {
  return useSyncExternalStore(
    (fn) => {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
    () => estado,
    () => estado
  );
}
