// Base de los correos de Workversity. Una sola fuente para todo lo que sale por correo:
// la función /api/recuperar-clave (Resend) y las plantillas que se pegan en Supabase.
//
// Reglas del medio: los clientes de correo no entienden CSS moderno. Por eso todo va en
// estilos en línea, la estructura es de tablas, no hay imágenes externas (Gmail las bloquea
// por defecto) y la "cinta de píxeles" de la cabecera está hecha con celdas de color, así que
// se ve igual en Gmail, Outlook y Apple Mail sin descargar nada.

export const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const TINTA = '#141412';
const PAPEL = '#ECEAE6';
const CARTA = '#F8F7F5';
const LINEA = '#E0DED9';
const TEXTO = '#3A3A37';
const SUAVE = '#7E7D77';
const ACENTO = '#2E4BF0';
const ACENTO_CLARO = '#9AA8FF';
const MONO = "'Courier New', Courier, monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/**
 * Cinta de píxeles de la cabecera: el mismo gesto del estanque de koi de la app, pero hecho
 * con celdas de tabla para que sobreviva a cualquier cliente de correo.
 */
function cinta(semilla = 7) {
  const tonos = [ACENTO, ACENTO, ACENTO_CLARO, '#2A2A27', '#2A2A27', '#3C3C38', ACENTO, '#2A2A27', ACENTO_CLARO, '#3C3C38'];
  let celdas = '';
  for (let i = 0; i < 26; i++) {
    const t = tonos[(i * semilla + (i % 3)) % tonos.length];
    const alto = i % 4 === 0 ? 10 : 6;
    celdas += `<td width="10" style="padding:0 2px 0 0;"><div style="width:8px;height:${alto}px;background-color:${t};border-radius:2px;font-size:0;line-height:0;">&nbsp;</div></td>`;
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr style="vertical-align:bottom;">${celdas}</tr></table>`;
}

/**
 * Arma un correo completo.
 * @param {object} o
 * @param {string} o.rotulo      Texto pequeño en mayúsculas de la cabecera.
 * @param {string} o.titulo      Titular grande (puede traer <b> para resaltar una palabra).
 * @param {string} [o.entrada]   Línea bajo el titular, dentro del bloque oscuro.
 * @param {string[]} o.parrafos  Cuerpo del mensaje.
 * @param {{texto:string,url:string}} [o.boton]
 * @param {string} [o.enlaceCrudo] El mismo enlace en texto, por si el botón no funciona.
 * @param {string[]} [o.avisos]  Letra chica al final (vencimiento, "si no fuiste tú"...).
 * @param {string} [o.pie]       Línea del pie.
 */
export function correoBase({ rotulo, titulo, entrada, parrafos = [], boton, enlaceCrudo, avisos = [], meta = [], pie = 'Workversity · tu semana, en orden' }) {
  const metaHtml = meta.length ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-top:1px solid ${LINEA};border-bottom:1px solid ${LINEA};">
            <tr>${meta.map((m) => `<td style="padding:11px 0;font-family:${MONO};font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;color:${SUAVE};">${esc(m[0])}<br><span style="color:${TINTA};letter-spacing:0.04em;">${esc(m[1])}</span></td>`).join('')}</tr>
          </table>` : '';
  const cuerpo = parrafos.map((p) => `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.6;color:${TEXTO};">${p}</p>`).join('');
  const botonHtml = boton ? `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px;">
            <tr>
              <td bgcolor="${ACENTO}" style="border-radius:999px;">
                <a href="${esc(boton.url)}" style="display:inline-block;padding:14px 30px;font-family:${SANS};font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(boton.texto)}</a>
              </td>
            </tr>
          </table>` : '';
  const crudo = enlaceCrudo ? `
          <p style="margin:18px 0 6px;font-family:${MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${SUAVE};">O copia este enlace</p>
          <div style="padding:12px 14px;background-color:#EFEDE9;border:1px solid ${LINEA};border-radius:10px;font-family:${MONO};font-size:12px;line-height:1.5;color:${TINTA};word-break:break-all;">${esc(enlaceCrudo)}</div>` : '';
  const chica = avisos.length ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;border-top:1px solid ${LINEA};">
            <tr><td style="padding-top:16px;">
              ${avisos.map((a) => `<p style="margin:0 0 6px;font-family:${SANS};font-size:12.5px;line-height:1.55;color:${SUAVE};">${a}</p>`).join('')}
            </td></tr>
          </table>` : '';

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(rotulo)}</title></head>
<body style="margin:0;padding:0;background-color:${PAPEL};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPEL};">
    <tr><td align="center" style="padding:36px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;background-color:${CARTA};border:1px solid ${LINEA};border-radius:20px;overflow:hidden;">

        <tr><td bgcolor="${TINTA}" style="padding:32px 34px 28px;">
          <p style="margin:0 0 18px;font-family:${MONO};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8B8A83;">${esc(rotulo)}</p>
          ${cinta()}
          <h1 style="margin:20px 0 0;font-family:${SANS};font-size:31px;line-height:1.12;letter-spacing:-0.9px;font-weight:normal;color:#ffffff;">${titulo}</h1>
          ${entrada ? `<p style="margin:10px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:#A3A29A;">${entrada}</p>` : ''}
        </td></tr>

        <tr><td style="padding:26px 34px 34px;">
          ${metaHtml}
          ${cuerpo}
          ${botonHtml}
          ${crudo}
          ${chica}
        </td></tr>

        <tr><td bgcolor="#EFEDE9" style="padding:16px 34px;border-top:1px solid ${LINEA};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${SUAVE};">${esc(pie)}</td>
            <td align="right" style="font-family:${MONO};font-size:10.5px;color:#A6A49E;">W</td>
          </tr></table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Correo de recuperación que envía /api/recuperar-clave con Resend. */
export function plantillaRecuperacion({ nombre, enlace, app }) {
  const saludo = nombre ? `Hola, ${esc(nombre)}.` : 'Hola.';
  return correoBase({
    rotulo: 'Workversity · Cuenta',
    titulo: 'Elige una contraseña <b style="font-weight:bold;color:' + ACENTO_CLARO + ';">nueva</b>.',
    entrada: 'Pediste recuperar el acceso a tu cuenta.',
    parrafos: [
      saludo,
      'Toca el botón y escribe la contraseña que vas a usar de ahora en adelante. El enlace sirve una sola vez.',
    ],
    meta: [['Para', nombre || 'tu cuenta'], ['Vence', 'en 60 minutos'], ['Usos', 'uno solo']],
    boton: { texto: 'Cambiar mi contraseña', url: enlace },
    enlaceCrudo: enlace,
    avisos: [
      'El enlace vence en una hora por seguridad.',
      'Si no pediste esto, puedes ignorar el correo: tu contraseña sigue igual.',
    ],
    pie: app ? String(app).replace(/^https?:\/\//, '') : 'Workversity · tu semana, en orden',
  });
}
