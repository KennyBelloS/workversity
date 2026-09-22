// Edge Function pública (sin JWT): entrega tu agenda como calendario .ics para SUSCRIBIRTE desde
// Google Calendar o el iPhone/Mac. Se protege con un token secreto en el enlace (perfiles.calendario_token).
// Despliegue:  npx supabase functions deploy calendario --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2';
import { generarICS } from '../_shared/ics.js';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const token = new URL(req.url).searchParams.get('token') || '';
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response('Enlace no válido', { status: 400, headers: CORS });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: perfil } = await supabase.from('perfiles').select('id, zona_horaria').eq('calendario_token', token).maybeSingle();
  if (!perfil) return new Response('Enlace no válido', { status: 404, headers: CORS });

  const ahora = new Date();
  const desde = new Date(ahora.getTime() - 86400000).toISOString();
  const [materias, bloques, tareas] = await Promise.all([
    supabase.from('materias').select('*').eq('user_id', perfil.id),
    supabase.from('bloques_horario').select('*').eq('user_id', perfil.id),
    supabase.from('tareas').select('*').eq('user_id', perfil.id).neq('status', 'hecha').gte('due_date', desde),
  ]);

  const ics = generarICS({
    ahora, zona: perfil.zona_horaria || 'America/Bogota', semanas: 20,
    materias: materias.data || [], bloques: bloques.data || [], tareas: tareas.data || [],
  });
  return new Response(ics, {
    headers: { ...CORS, 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="workversity.ics"', 'Cache-Control': 'no-cache' },
  });
});
