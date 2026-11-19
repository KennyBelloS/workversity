// Envío de correos con Resend (o Brevo como alternativa). Lo usa /api/recuperar-clave.
// El diseño del mensaje vive en _plantilla.js, compartido con las plantillas de Supabase.
// Los archivos de /api que empiezan con "_" NO son rutas públicas en Vercel: son módulos internos.

/** Separa "Nombre <correo@dominio>" en sus dos partes. */
export function partirRemitente(texto) {
  const m = String(texto || '').match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { nombre: m[1] || 'Workversity', email: m[2].trim() };
  return { nombre: 'Workversity', email: String(texto || '').trim() };
}

/** Brevo: gratis hasta 300 correos al día; basta con verificar UNA dirección remitente (sirve Gmail). */
async function enviarConBrevo(env, { destinatarios, asunto, html }) {
  const de = partirRemitente(env.CORREO_REMITENTE);
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: { name: de.nombre, email: de.email }, to: destinatarios.map((email) => ({ email })), subject: asunto, htmlContent: html }),
  });
  if (r.ok) return;
  const texto = await r.text();
  if (r.status === 400 && /sender/i.test(texto)) {
    throw new Error(`Brevo no reconoce el remitente "${de.email}". Agrégalo en Brevo → Senders, Domains & Dedicated IPs → Senders y confirma el enlace que llega a esa bandeja.`);
  }
  if (r.status === 401) throw new Error('La BREVO_API_KEY no es válida o fue revocada.');
  throw new Error(`Brevo respondió ${r.status}: ${texto.slice(0, 250)}`);
}

/** Resend: exige un dominio propio verificado para escribir a cualquier persona. */
async function enviarConResend(env, { destinatarios, asunto, html }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.CORREO_REMITENTE || 'Workversity <onboarding@resend.dev>', to: destinatarios, subject: asunto, html }),
  });
  if (r.ok) return;
  const texto = await r.text();
  if (r.status === 401) throw new Error('La RESEND_API_KEY no es válida o fue revocada.');
  if (r.status === 403 && /testing emails|verify a domain|own email/i.test(texto)) {
    throw new Error('Resend está en modo prueba: sin un dominio verificado solo puede escribir al correo de tu cuenta de Resend. Verifica un dominio en resend.com/domains o usa CORREO_PRUEBAS.');
  }
  if ((r.status === 403 || r.status === 422) && /domain/i.test(texto)) {
    throw new Error(`Resend no acepta el remitente "${env.CORREO_REMITENTE}". Usa una dirección de un dominio verificado en resend.com/domains (o onboarding@resend.dev mientras pruebas).`);
  }
  throw new Error(`Resend respondió ${r.status}: ${texto.slice(0, 250)}`);
}

export async function enviarCorreo(env, { destinatarios, asunto, html }) {
  const proveedor = (env.PROVEEDOR_CORREO || 'resend').trim().toLowerCase();
  if (proveedor === 'brevo' && !env.BREVO_API_KEY) throw new Error('Falta configurar BREVO_API_KEY.');
  if (proveedor !== 'brevo' && !env.RESEND_API_KEY) throw new Error('Falta configurar RESEND_API_KEY.');
  // MODO PRUEBAS: si CORREO_PRUEBAS tiene una dirección, todo se desvía ahí.
  const prueba = (env.CORREO_PRUEBAS || '').trim();
  const datos = prueba
    ? { destinatarios: [prueba], asunto: `[PRUEBA] ${asunto}`, html: `<div style="font-family:Arial,sans-serif;background:#FAF1DE;border:1px solid #EBD9A8;color:#8A6410;padding:12px 16px;font-size:13px;"><strong>Modo pruebas.</strong> En producción se habría enviado a: ${destinatarios.join(', ')}</div>${html}` }
    : { destinatarios, asunto, html };
  return proveedor === 'brevo' ? enviarConBrevo(env, datos) : enviarConResend(env, datos);
}

export { plantillaRecuperacion } from './_plantilla.js';
