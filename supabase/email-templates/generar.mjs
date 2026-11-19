// Genera las plantillas de correo de Supabase a partir del mismo diseño que usa la app.
// Uso:  node supabase/email-templates/generar.mjs
// Después se pega cada archivo en Supabase → Authentication → Emails → Templates.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { correoBase } from '../../api/_plantilla.js';

const aqui = dirname(fileURLToPath(import.meta.url));
mkdirSync(aqui, { recursive: true });

// {{ .ConfirmationURL }} y {{ .Token }} son las variables de Supabase: se escriben tal cual.
const URL_SUPABASE = '{{ .ConfirmationURL }}';

const PLANTILLAS = [
  {
    archivo: 'recuperar-clave.html',
    campo: 'Reset Password',
    asunto: 'Tu enlace para entrar otra vez a Workversity',
    html: correoBase({
      rotulo: 'Workversity · Cuenta',
      titulo: 'Elige una contraseña <b style="font-weight:bold;color:#9AA8FF;">nueva</b>.',
      entrada: 'Pediste recuperar el acceso a tu cuenta.',
      parrafos: [
        'Hola.',
        'Toca el botón y escribe la contraseña que vas a usar de ahora en adelante. El enlace sirve una sola vez.',
      ],
      meta: [['Vence', 'en 60 minutos'], ['Usos', 'uno solo'], ['Origen', 'workversity']],
      boton: { texto: 'Cambiar mi contraseña', url: URL_SUPABASE },
      enlaceCrudo: URL_SUPABASE,
      avisos: [
        'El enlace vence en una hora por seguridad.',
        'Si no pediste esto, puedes ignorar el correo: tu contraseña sigue igual.',
      ],
    }),
  },
  {
    archivo: 'confirmar-cuenta.html',
    campo: 'Confirm signup',
    asunto: 'Confirma tu correo y empieza a organizar tu semana',
    html: correoBase({
      rotulo: 'Workversity · Bienvenida',
      titulo: 'Tu semana <b style="font-weight:bold;color:#9AA8FF;">empieza aquí</b>.',
      entrada: 'Solo falta confirmar que este correo es tuyo.',
      parrafos: [
        'Hola.',
        'Gracias por crear tu cuenta. Toca el botón para confirmar el correo; después podrás entrar con tu contraseña.',
        'Adentro te esperan tus materias, el horario de la semana, las tareas y tus finanzas, todo en un solo lugar y también sin conexión.',
      ],
      meta: [['Paso', '1 de 1'], ['Vence', 'en 24 horas'], ['Origen', 'workversity']],
      boton: { texto: 'Confirmar mi correo', url: URL_SUPABASE },
      enlaceCrudo: URL_SUPABASE,
      avisos: ['Si no creaste ninguna cuenta, ignora este mensaje.'],
    }),
  },
  {
    archivo: 'enlace-magico.html',
    campo: 'Magic Link',
    asunto: 'Tu enlace de acceso a Workversity',
    html: correoBase({
      rotulo: 'Workversity · Acceso',
      titulo: 'Entra <b style="font-weight:bold;color:#9AA8FF;">sin contraseña</b>.',
      entrada: 'Un enlace de un solo uso para esta sesión.',
      parrafos: ['Hola.', 'Toca el botón y entrarás directo a tu cuenta en este dispositivo.'],
      meta: [['Vence', 'en 60 minutos'], ['Usos', 'uno solo'], ['Origen', 'workversity']],
      boton: { texto: 'Entrar a Workversity', url: URL_SUPABASE },
      enlaceCrudo: URL_SUPABASE,
      avisos: ['El enlace vence en una hora y solo funciona una vez.', 'Si no lo pediste, ignora el correo.'],
    }),
  },
  {
    archivo: 'cambio-de-correo.html',
    campo: 'Change Email Address',
    asunto: 'Confirma tu correo nuevo en Workversity',
    html: correoBase({
      rotulo: 'Workversity · Cuenta',
      titulo: 'Confirma tu <b style="font-weight:bold;color:#9AA8FF;">correo nuevo</b>.',
      entrada: 'Pediste cambiar la dirección de tu cuenta.',
      parrafos: [
        'Hola.',
        'Para terminar el cambio, confirma que esta dirección es tuya. Hasta entonces tu cuenta sigue con el correo anterior.',
      ],
      meta: [['Acción', 'cambio de correo'], ['Vence', 'en 24 horas']],
      boton: { texto: 'Confirmar el cambio', url: URL_SUPABASE },
      enlaceCrudo: URL_SUPABASE,
      avisos: ['Si no pediste el cambio, ignora este correo y revisa tu contraseña.'],
    }),
  },
  {
    archivo: 'invitacion.html',
    campo: 'Invite user',
    asunto: 'Te invitaron a Workversity',
    html: correoBase({
      rotulo: 'Workversity · Invitación',
      titulo: 'Te están <b style="font-weight:bold;color:#9AA8FF;">esperando</b>.',
      entrada: 'Alguien te invitó a organizar la semana en equipo.',
      parrafos: [
        'Hola.',
        'Acepta la invitación para crear tu contraseña y entrar. Vas a poder compartir el horario con tu grupo y ver de quién es cada bloque de la semana.',
      ],
      meta: [['Tipo', 'invitación'], ['Vence', 'en 7 días']],
      boton: { texto: 'Aceptar la invitación', url: URL_SUPABASE },
      enlaceCrudo: URL_SUPABASE,
      avisos: ['Si no esperabas esta invitación, puedes ignorarla.'],
    }),
  },
];

const indice = ['# Plantillas de correo para Supabase', '',
  'Se generan con `node supabase/email-templates/generar.mjs` (no las edites a mano: edita `api/_plantilla.js`).',
  '', 'Dónde se pegan: **Supabase → Authentication → Emails → Templates**.', '',
  '| Archivo | Plantilla en Supabase | Asunto sugerido |', '| --- | --- | --- |'];

for (const p of PLANTILLAS) {
  writeFileSync(join(aqui, p.archivo), p.html);
  indice.push(`| \`${p.archivo}\` | ${p.campo} | ${p.asunto} |`);
  console.log('escrito', p.archivo);
}
writeFileSync(join(aqui, 'README.md'), `${indice.join('\n')}\n`);
