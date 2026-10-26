// Notificaciones push (Web Push + VAPID): funcionan con la app cerrada.
// El servidor que las envía está en supabase/functions/enviar-recordatorios.
import { supabase } from '../services/supabase';
import { conTimeout } from '../offline/sync';

const VAPID_PUBLICA = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const zonaHoraria = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota';

export function estadoPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return { soportado: false, motivo: ios ? 'ios-sin-instalar' : 'navegador', permiso: 'default' };
  }
  return { soportado: true, motivo: null, permiso: Notification.permission, configurado: !!VAPID_PUBLICA && !VAPID_PUBLICA.includes('tu-clave') };
}

function aUint8(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...b].map((c) => c.charCodeAt(0)));
}

// Devuelve el Service Worker activo, o avisa claramente si no existe
// (en `npm run dev` no se registra: solo en la versión compilada o publicada).
async function swListo() {
  const registro = await navigator.serviceWorker.getRegistration();
  if (!registro) {
    throw new Error(
      'El Service Worker no está activo. Las notificaciones solo funcionan con la app compilada: ejecuta "npm run build" y luego "npm run preview" (o usa la versión publicada en Vercel), y recarga la página.'
    );
  }
  return conTimeout(navigator.serviceWorker.ready, 8000);
}

export async function suscripcionActual() {
  if (!estadoPush().soportado) return null;
  const registro = await navigator.serviceWorker.getRegistration();
  if (!registro) return null;
  return registro.pushManager.getSubscription();
}

/**
 * Diagnóstico completo de la cadena de notificaciones push, capa por capa. Como el envío
 * real ocurre en un servidor (Edge Function + pg_cron) al que este cliente no tiene ni debe
 * tener acceso directo (por seguridad, exige un secreto que nunca debe llegar al navegador),
 * este diagnóstico no puede "probar el envío" de punta a punta — pero sí puede confirmar,
 * con certeza, cuáles de los primeros pasos ya funcionan, para saber dónde seguir buscando.
 */
export async function diagnosticoCompleto(userId) {
  const est = estadoPush();
  const pasos = [
    { id: 'soportado', ok: est.soportado, detalle: est.soportado ? 'Este navegador admite notificaciones push.' : 'Este navegador o dispositivo no las admite (revisa si necesitas instalar la app primero).' },
    { id: 'permiso', ok: est.permiso === 'granted', detalle: est.permiso === 'granted' ? 'Le diste permiso a la app para notificarte.' : `Permiso: "${est.permiso}". Actívalo con el botón de arriba.` },
    { id: 'clave', ok: est.configurado, detalle: est.configurado ? 'Tu app tiene una clave VAPID configurada.' : 'Falta VITE_VAPID_PUBLIC_KEY en tu .env (ver el manual).' },
  ];
  if (!pasos.every((p) => p.ok)) return { pasos, siguiente: 'Resuelve lo de arriba primero (de arriba hacia abajo) y vuelve a intentar.' };

  const sub = await suscripcionActual().catch(() => null);
  pasos.push({ id: 'suscrito', ok: !!sub, detalle: sub ? 'Tu navegador está suscrito a las notificaciones.' : 'Tu navegador no está suscrito todavía: pulsa "Activar".' });
  if (!sub) return { pasos, siguiente: 'Pulsa "Activar" arriba para suscribirte.' };

  try {
    const { data, error } = await conTimeout(supabase.from('push_suscripciones').select('id, created_at').eq('user_id', userId).eq('endpoint', sub.endpoint), 6000);
    const guardada = !error && data && data.length > 0;
    pasos.push({ id: 'guardada', ok: guardada, detalle: guardada ? 'Tu suscripción está guardada en la base de datos: el servidor puede encontrarte.' : 'Tu suscripción no llegó a guardarse en la base de datos (revisa tu conexión e inténtalo de nuevo).' });
    if (!guardada) return { pasos, siguiente: 'Vuelve a pulsar "Activar" con buena conexión a internet.' };
  } catch {
    pasos.push({ id: 'guardada', ok: false, detalle: 'No se pudo confirmar contra la base de datos (revisa tu conexión).' });
    return { pasos, siguiente: 'Revisa tu conexión a internet e inténtalo de nuevo.' };
  }

  pasos.push({
    id: 'servidor',
    ok: null, // no verificable desde aquí, por diseño: enviarlas exige un secreto que nunca debe estar en el navegador
    detalle: 'Todo lo anterior está bien de tu lado. Que SÍ llegue una notificación con la app cerrada depende de un paso que se hace una sola vez en Supabase (no en esta app): desplegar la función "enviar-recordatorios" y programarla con pg_cron para que corra cada minuto. Si no la has desplegado, es justo por eso que "por fuera de la app" no llega nada — no es un error de la aplicación. Los pasos exactos están en MANUAL.md.',
  });
  return { pasos, siguiente: null };
}

export async function activarNotificaciones(userId) {
  const est = estadoPush();
  if (!est.soportado) throw new Error('Este navegador no permite notificaciones push. En iPhone, primero instala la app (Compartir → Añadir a pantalla de inicio).');
  if (!est.configurado) throw new Error('Falta la clave VITE_VAPID_PUBLIC_KEY en el archivo .env (ver el manual).');

  const reg = await swListo(); // primero se comprueba, para no pedir permiso en vano

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('Las notificaciones están bloqueadas. Actívalas en los permisos del sitio (candado junto a la dirección).');

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await conTimeout(reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aUint8(VAPID_PUBLICA) }), 20000);
    } catch (err) {
      throw new Error(`No se pudo registrar este dispositivo para las notificaciones (${err?.message || err}). Revisa que VITE_VAPID_PUBLIC_KEY sea la clave pública completa, sin espacios.`);
    }
  }

  const j = sub.toJSON();
  const { error } = await conTimeout(
    supabase.from('push_suscripciones').upsert(
      { user_id: userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 200) },
      { onConflict: 'endpoint' }
    )
  );
  if (error) throw error;
  return sub;
}

export async function desactivarNotificaciones() {
  const sub = await suscripcionActual();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await conTimeout(supabase.from('push_suscripciones').delete().eq('endpoint', endpoint)).catch(() => {});
}

// Notificación de prueba local (no pasa por el servidor): sirve para comprobar permisos.
export async function notificacionDePrueba() {
  const reg = await swListo();
  await reg.showNotification('🎉 ¡Las notificaciones funcionan!', {
    body: 'Así te avisaré antes de tus tareas, clases y reuniones.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/' },
    vibrate: [120, 60, 120],
  });
}
