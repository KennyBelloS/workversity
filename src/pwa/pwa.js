// ---------------------------------------------------------------------------
// PWA: Service Worker, instalación y ACTUALIZACIONES AUTOMÁTICAS.
//
// Cuando hay una versión nueva:
//   1. el navegador la descarga en segundo plano (queda "en espera");
//   2. la app avisa con una cuenta regresiva y la instala sola (si abriste la app y ya
//      estaba lista, o si la mandas al fondo, se instala de inmediato);
//   3. si estás escribiendo o tienes cambios sin guardar, espera a que termines;
//   4. al volver a cargar se muestra el reporte de cambios (components/layout/Novedades.jsx).
// El Service Worker en sí lo genera vite-plugin-pwa a partir de src/sw.js.
// ---------------------------------------------------------------------------

import { Workbox } from 'workbox-window';
import { VERSION, compararVersiones } from '../version';
import { haySinGuardar } from './bloqueo';

const ESPERA_S = 12; // segundos entre el aviso y la instalación automática
const REVISION_CADA_MS = 30 * 60 * 1000;

let estado = {
  necesitaActualizar: false, // hay una versión nueva descargada esperando
  versionNueva: null, // { version, fecha, release } leído de /version.json
  cuentaAtras: null, // segundos que faltan para instalarla sola
  bloqueada: false, // espera porque estás escribiendo o tienes cambios sin guardar
  revisando: false,
  ultimaRevision: null,
  listoOffline: false,
  puedeInstalar: false,
  instalada: false,
};
const oyentes = new Set();
let promptDiferido = null;
let wb = null;
let registro = null;
let temporizador = null;
let aplicando = false;
let iniciada = false;
let ultimaSilenciosa = 0;

function cambiar(parcial) {
  estado = { ...estado, ...parcial };
  oyentes.forEach((fn) => fn());
}

export const obtenerEstadoPwa = () => estado;
export function suscribirPwa(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

// Evita bucles: si acabamos de recargar por una actualización, no se vuelve a hacer de inmediato.
const recargaReciente = () => {
  try { return Date.now() - Number(sessionStorage.getItem('wv-recarga') || 0) < 20000; } catch { return false; }
};

function ocupado() {
  const el = document.activeElement;
  const escribiendo = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && String(el.value ?? '') !== '';
  return haySinGuardar() || escribiendo;
}

async function leerVersionRemota() {
  try {
    const r = await fetch('/version.json', { cache: 'no-store' });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** Instala ya la versión que está esperando y recarga. */
export function aplicarActualizacion() {
  if (!wb || aplicando) return;
  aplicando = true;
  try { sessionStorage.setItem('wv-recarga', String(Date.now())); } catch { /* nada */ }
  wb.addEventListener('controlling', () => window.location.reload());
  wb.messageSkipWaiting();
  setTimeout(() => window.location.reload(), 6000); // por si el navegador tarda
}

function programarAuto(inmediato) {
  if (temporizador || !wb) return;
  if ((inmediato || document.visibilityState === 'hidden') && !ocupado() && !recargaReciente()) {
    aplicarActualizacion();
    return;
  }
  cambiar({ cuentaAtras: recargaReciente() ? null : ESPERA_S, bloqueada: false });
  temporizador = setInterval(() => {
    if (recargaReciente()) return; // solo queda el botón manual
    if (ocupado()) {
      if (!estado.bloqueada) cambiar({ bloqueada: true, cuentaAtras: null });
      return;
    }
    const n = (estado.bloqueada || estado.cuentaAtras == null ? ESPERA_S : estado.cuentaAtras) - 1;
    if (n <= 0) {
      clearInterval(temporizador);
      temporizador = null;
      aplicarActualizacion();
    } else cambiar({ cuentaAtras: n, bloqueada: false });
  }, 1000);
}

async function revisarSilencioso() {
  if (Date.now() - ultimaSilenciosa < 10 * 60 * 1000) return;
  ultimaSilenciosa = Date.now();
  try { await registro?.update(); } catch { /* sin conexión */ }
}

/** Botón "Buscar actualizaciones". */
export async function buscarActualizacion() {
  if (!wb) return { ok: false };
  cambiar({ revisando: true });
  try { await registro?.update(); } catch { /* sin conexión */ }
  const v = await leerVersionRemota();
  const hayNueva = !!v && compararVersiones(v.version, VERSION) > 0;
  cambiar({ revisando: false, ultimaRevision: Date.now(), ...(hayNueva ? { versionNueva: v } : {}) });
  return { ok: true, hayNueva, version: v?.version || null, sinDatos: !v }; // sinDatos: no se pudo leer version.json (sin conexión)
}

export function iniciarPwa() {
  if (iniciada || typeof window === 'undefined') return;
  iniciada = true;

  cambiar({
    instalada: window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true,
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptDiferido = e;
    cambiar({ puedeInstalar: true });
  });
  window.addEventListener('appinstalled', () => {
    promptDiferido = null;
    cambiar({ puedeInstalar: false, instalada: true });
  });

  // El Service Worker solo se registra en la versión compilada (build/preview/publicada), nunca en `npm run dev`.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    wb = new Workbox('/sw.js');
    wb.addEventListener('waiting', (e) => {
      cambiar({ necesitaActualizar: true });
      leerVersionRemota().then((v) => v && cambiar({ versionNueva: v }));
      programarAuto(!!e.wasWaitingBeforeRegister); // si ya estaba lista al abrir la app, se instala de inmediato
    });
    wb.addEventListener('installed', (e) => {
      if (!e.isUpdate) cambiar({ listoOffline: true });
    });
    wb.register()
      .then((r) => {
        registro = r;
        setInterval(() => registro?.update().catch(() => {}), REVISION_CADA_MS);
      })
      .catch((err) => console.warn('[pwa] No se pudo registrar el Service Worker:', err));

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        if (estado.necesitaActualizar && !ocupado() && !recargaReciente()) aplicarActualizacion();
      } else revisarSilencioso();
    });
    window.addEventListener('online', revisarSilencioso);
  }
}

export async function instalarApp() {
  if (!promptDiferido) return false;
  promptDiferido.prompt();
  const { outcome } = await promptDiferido.userChoice;
  promptDiferido = null;
  cambiar({ puedeInstalar: false });
  return outcome === 'accepted';
}

export function descartarAvisoOffline() {
  cambiar({ listoOffline: false });
}
