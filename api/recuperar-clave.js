// Recuperar la contraseña (función de Vercel: POST /api/recuperar-clave con { email }).
//
// Supabase genera el enlace de recuperación (con la llave service_role, que vive SOLO aquí, en
// el servidor) y el correo sale por Resend con el diseño de Workversity. La respuesta es SIEMPRE
// la misma, exista o no la cuenta, para no revelar quién está registrado.
//
// Variables de entorno (Vercel → Settings → Environment Variables):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PROVEEDOR_CORREO=resend, RESEND_API_KEY,
//   CORREO_REMITENTE="Workversity <hola@tu-dominio.com>", URL_PUBLICA, CORREO_PRUEBAS (opcional),
//   LOGO_URL (opcional: si no está, se usa URL_PUBLICA/logo.png).
// El enlace lleva a URL_PUBLICA/nueva-clave: esa dirección debe estar en Supabase →
// Authentication → URL Configuration → Redirect URLs.
import { enviarCorreo, plantillaRecuperacion } from './_correo.js';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const env = process.env;
  try {
    const url = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
    const llave = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !llave) return res.status(500).json({ error: 'Falta configurar SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en Vercel.' });
    const proveedor = (env.PROVEEDOR_CORREO || 'resend').trim().toLowerCase();
    if ((proveedor === 'brevo' && !env.BREVO_API_KEY) || (proveedor !== 'brevo' && !env.RESEND_API_KEY)) {
      return res.status(503).json({ error: 'El envío de correos todavía no está configurado.' });
    }
    const cuerpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const email = String(cuerpo.email || '').trim().toLowerCase();
    if (!email || email.length > 254 || !CORREO.test(email)) return res.status(400).json({ error: 'Escribe un correo válido.' });

    const base = String(env.URL_PUBLICA || `https://${req.headers.host}`).replace(/\/+$/, '');
    const H = { apikey: llave, Authorization: `Bearer ${llave}`, 'Content-Type': 'application/json' };

    const g = await fetch(`${url}/auth/v1/admin/generate_link`, {
      method: 'POST', headers: H, body: JSON.stringify({ type: 'recovery', email, redirect_to: `${base}/nueva-clave` }),
    });
    const datos = g.ok ? await g.json().catch(() => null) : null;
    const enlace = datos?.action_link || datos?.properties?.action_link;
    if (enlace) {
      const p = await fetch(`${url}/rest/v1/perfiles?correo=eq.${encodeURIComponent(email)}&select=nombre`, { headers: H });
      const nombre = p.ok ? (await p.json().catch(() => []))[0]?.nombre : '';
      try {
        await enviarCorreo(env, {
          destinatarios: [email],
          asunto: 'Restablece tu contraseña · Workversity',
          html: plantillaRecuperacion({ nombre, enlace, logo: env.LOGO_URL || `${base}/logo.png`, app: base }),
        });
      } catch (err) {
        // Sin revelar nada a quien lo pidió; el detalle queda en los registros de Vercel.
        console.error('[recuperar-clave] No se pudo enviar el correo:', err.message);
      }
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[recuperar-clave]', err);
    return res.status(500).json({ error: 'Error inesperado del servidor.' });
  }
}
