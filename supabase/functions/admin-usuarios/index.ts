// Edge Function (requiere JWT): acciones de administrador sobre OTRAS cuentas — suspender,
// reactivar, eliminar, resetear contraseña. Corre con la service_role key (nunca expuesta al
// navegador) y siempre vuelve a comprobar por su cuenta que quien llama es administrador: nunca
// se confía en lo que el cliente diga de sí mismo. Ninguna acción puede dirigirse contra otra
// cuenta de administrador, ni siquiera llamando a la función directamente con otro cuerpo.
// Despliegue:  npx supabase functions deploy admin-usuarios
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': '*' };
const ACCIONES_VALIDAS = ['suspender', 'reactivar', 'eliminar', 'resetear_password'];

function error(status, mensaje) {
  return new Response(JSON.stringify({ error: mensaje }), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return error(405, 'Método no permitido.');

  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return error(401, 'Falta iniciar sesión.');

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: quienLlama, error: errUsuario } = await admin.auth.getUser(token);
  if (errUsuario || !quienLlama?.user) return error(401, 'Sesión no válida.');

  const { data: perfilLlamador } = await admin.from('perfiles').select('es_admin').eq('id', quienLlama.user.id).maybeSingle();
  if (!perfilLlamador?.es_admin) return error(403, 'Esta acción es solo para administradores.');

  let cuerpo;
  try { cuerpo = await req.json(); } catch { return error(400, 'Cuerpo inválido.'); }
  const { accion, userId, nuevaPassword } = cuerpo || {};
  if (!ACCIONES_VALIDAS.includes(accion)) return error(400, 'Acción no reconocida.');
  if (!userId || typeof userId !== 'string') return error(400, 'Falta indicar la cuenta.');

  const { data: perfilObjetivo } = await admin.from('perfiles').select('id, es_admin, correo').eq('id', userId).maybeSingle();
  if (!perfilObjetivo) return error(404, 'No se encontró esa cuenta.');

  // La protección clave: nada de esto puede tocar a otro administrador, sin importar quién
  // llame ni qué diga el cuerpo de la petición.
  if (perfilObjetivo.es_admin) return error(403, 'No se pueden hacer cambios sobre otra cuenta de administrador.');

  try {
    if (accion === 'suspender') {
      await admin.auth.admin.updateUserById(userId, { ban_duration: '87600h' }); // ~10 años
      await admin.from('perfiles').update({ suspendida: true }).eq('id', userId);
    } else if (accion === 'reactivar') {
      await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' });
      await admin.from('perfiles').update({ suspendida: false }).eq('id', userId);
    } else if (accion === 'eliminar') {
      await admin.auth.admin.deleteUser(userId); // el perfil se borra solo (on delete cascade)
    } else if (accion === 'resetear_password') {
      if (!nuevaPassword || String(nuevaPassword).length < 6) return error(400, 'La nueva contraseña debe tener al menos 6 caracteres.');
      await admin.auth.admin.updateUserById(userId, { password: nuevaPassword });
    }
  } catch (err) {
    return error(500, `No se pudo completar la acción: ${err?.message || err}`);
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
});
