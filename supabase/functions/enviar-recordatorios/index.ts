// Edge Function: se ejecuta cada minuto (pg_cron) y envía las notificaciones push
// que correspondan (tareas por vencer, clases, reuniones, resumen diario).
//
// Secretos necesarios (Supabase → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:tu@correo.com), CRON_SECRET
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya vienen incluidos.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { calcularNotificaciones } from './logica.js';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('No autorizado', { status: 401 });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  const ahora = new Date();
  const { data: subs, error: errSubs } = await supabase.from('push_suscripciones').select('*');
  if (errSubs) return new Response(errSubs.message, { status: 500 });
  if (!subs?.length) return Response.json({ enviadas: 0, motivo: 'sin suscripciones' });

  const usuarios = [...new Set(subs.map((s) => s.user_id))];
  const hasta = new Date(ahora.getTime() + 26 * 3600 * 1000).toISOString();
  const desde = new Date(ahora.getTime() - 30 * 60000).toISOString();
  const hace3dias = new Date(ahora.getTime() - 3 * 86400000).toISOString();

  const [perfiles, tareas, materias, bloques, enviadas] = await Promise.all([
    supabase.from('perfiles').select('*').in('id', usuarios),
    supabase.from('tareas').select('*').in('user_id', usuarios).neq('status', 'hecha').gte('due_date', desde).lte('due_date', hasta),
    supabase.from('materias').select('*').in('user_id', usuarios),
    supabase.from('bloques_horario').select('*').in('user_id', usuarios),
    supabase.from('notificaciones_enviadas').select('user_id, clave').in('user_id', usuarios).gte('enviada_en', hace3dias),
  ]);

  let total = 0;
  for (const uid of usuarios) {
    const perfil = perfiles.data?.find((p) => p.id === uid);
    const ya = new Set((enviadas.data || []).filter((e) => e.user_id === uid).map((e) => e.clave));
    const pendientes = calcularNotificaciones({
      ahora,
      perfil,
      tareas: (tareas.data || []).filter((t) => t.user_id === uid),
      materias: (materias.data || []).filter((m) => m.user_id === uid),
      bloques: (bloques.data || []).filter((b) => b.user_id === uid),
      enviadas: ya,
    });
    if (!pendientes.length) continue;

    // Se registran primero (evita duplicados si dos ejecuciones se cruzan)
    await supabase
      .from('notificaciones_enviadas')
      .upsert(pendientes.map((n) => ({ user_id: uid, clave: n.clave })), { onConflict: 'user_id,clave', ignoreDuplicates: true });

    for (const n of pendientes.filter((x) => !x.silenciosa)) {
      const carga = JSON.stringify({ titulo: n.titulo, cuerpo: n.cuerpo, url: n.url, etiqueta: n.etiqueta, importante: n.importante });
      for (const s of subs.filter((x) => x.user_id === uid)) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, { TTL: 3600 });
          total++;
        } catch (e) {
          // 404/410: el dispositivo ya no existe → se elimina la suscripción
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await supabase.from('push_suscripciones').delete().eq('id', s.id);
          } else {
            console.error('Error enviando push:', e?.statusCode, e?.body || e?.message);
          }
        }
      }
    }
  }
  return Response.json({ enviadas: total });
});
