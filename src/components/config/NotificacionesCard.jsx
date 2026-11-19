import { useEffect, useState } from 'react';
import { mensajeAmigable } from '../../lib/erroresAmigables';
import { Bell, BellOff, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { actualizarPerfil } from '../../services/auth';
import { estadoPush, suscripcionActual, activarNotificaciones, desactivarNotificaciones, notificacionDePrueba, zonaHoraria } from '../../pwa/push';

export default function NotificacionesCard() {
  const { usuario, perfil, refrescarPerfil } = useAuth();
  const [activa, setActiva] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const est = estadoPush();

  useEffect(() => {
    suscripcionActual().then((s) => setActiva(!!s && Notification.permission === 'granted')).catch(() => {});
  }, []);

  const activar = async () => {
    setError(''); setMensaje(''); setTrabajando(true);
    try {
      await activarNotificaciones(usuario.id);
      await actualizarPerfil(usuario.id, { zona_horaria: zonaHoraria() });
      setActiva(true);
      setMensaje('¡Listo! Recibirás avisos aunque la app esté cerrada.');
    } catch (err) {
      setError(mensajeAmigable(err, 'activar los avisos'));
    } finally {
      setTrabajando(false);
    }
  };

  const desactivar = async () => {
    setTrabajando(true);
    try {
      await desactivarNotificaciones();
      setActiva(false);
      setMensaje('Notificaciones desactivadas en este dispositivo.');
    } finally {
      setTrabajando(false);
    }
  };

  const cambiar = async (cambios) => {
    await actualizarPerfil(usuario.id, cambios);
    await refrescarPerfil();
  };

  return (
    <section className="ficha">
      <p className="ficha-cabecera !mb-3 !justify-start gap-2 rotulo">{activa ? <Bell size={16} /> : <BellOff size={16} />} Notificaciones</p>
      <p className="mb-3 text-xs text-textSecondary">
        Te aviso antes de que venza una tarea, empiece una clase, reunión o turno de trabajo, y cada mañana te mando un resumen del día.
        Funciona incluso con la app cerrada.
      </p>

      {!est.soportado ? (
        <p className="rounded-sm2 bg-warningSoft p-3 text-xs font-semibold text-warning">
          {est.motivo === 'ios-sin-instalar'
            ? 'En iPhone/iPad las notificaciones solo funcionan con la app instalada: toca Compartir → “Añadir a pantalla de inicio”, ábrela desde ahí y vuelve aquí.'
            : 'Este navegador no permite notificaciones push. Prueba con Chrome, Edge o Safari actualizado.'}
        </p>
      ) : (
        <>
          <div className="flex gap-2">
            {activa ? (
              <>
                <button onClick={() => notificacionDePrueba().catch((e) => setError(e.message))} className="boton-secundario flex-1 justify-center">
                  <Send size={14} /> Enviar prueba
                </button>
                <button onClick={desactivar} disabled={trabajando} className="boton-secundario !text-textSecondary">
                  Desactivar
                </button>
              </>
            ) : (
              <button onClick={activar} disabled={trabajando} className="boton-ppal flex-1 justify-center">
                {trabajando ? 'Activando…' : 'Activar notificaciones'}
              </button>
            )}
          </div>

          {activa && (
            <div className="mt-3 space-y-2.5 border-t border-black/5 pt-3">
              <label className="flex items-center justify-between text-sm font-semibold">
                Resumen diario
                <input
                  type="checkbox"
                  checked={perfil?.notif_resumen_diario !== false}
                  onChange={(e) => cambiar({ notif_resumen_diario: e.target.checked })}
                  className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-black/15 transition checked:bg-primary relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4"
                />
              </label>
              <label className="flex items-center justify-between text-sm font-semibold">
                Hora del resumen
                <input
                  type="time"
                  value={perfil?.notif_hora_resumen || '07:30'}
                  onChange={(e) => cambiar({ notif_hora_resumen: e.target.value })}
                  className="rounded-sm2 bg-primarySoft/60 px-3 py-1.5 text-sm outline-none"
                />
              </label>
              <p className="text-t-micro text-textSecondary">Zona horaria: {perfil?.zona_horaria || zonaHoraria()}</p>
            </div>
          )}
        </>
      )}

      {mensaje && <p className="mt-3 text-xs font-semibold text-success">{mensaje}</p>}
      {error && <p className="mt-3 text-xs font-semibold text-danger">{error}</p>}
    </section>
  );
}
