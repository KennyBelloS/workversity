import { useEffect, useState, useSyncExternalStore } from 'react';
import { WifiOff, RefreshCw, CloudUpload, Download, X, CheckCircle2, AlertTriangle, Share } from 'lucide-react';
import { useSyncEstado } from '../../hooks/useSyncEstado';
import { vaciarCola } from '../../offline/sync';
import { copiarSqlActualizacion, enlaceSqlEditor } from '../../lib/sqlActualizacion';
import {
  obtenerEstadoPwa,
  suscribirPwa,
  instalarApp,
  aplicarActualizacion,
  descartarAvisoOffline,
} from '../../pwa/pwa';

const CLAVE_AVISO_IOS = 'workversity:aviso-ios-cerrado';

function esIosSafari() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
}

function Barra({ color, icono: Icono, children, accion, onCerrar }) {
  return (
    <div
      className="pointer-events-auto flex w-full max-w-md items-center gap-2.5 rounded-md2 px-3.5 py-2.5 text-white shadow-lg"
      style={{ backgroundColor: color }}
      role="status"
    >
      <Icono size={17} className="shrink-0" />
      <p className="min-w-0 flex-1 text-xs font-semibold leading-snug">{children}</p>
      {accion}
      {onCerrar && (
        <button onClick={onCerrar} aria-label="Cerrar" className="shrink-0 rounded-full p-1 hover:bg-white/20">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

const botonAccion = 'shrink-0 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-textPrimary';

export default function EstadoApp() {
  const sync = useSyncEstado();
  const pwa = useSyncExternalStore(suscribirPwa, obtenerEstadoPwa);
  const [avisoIosCerrado, setAvisoIosCerrado] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_AVISO_IOS) === '1';
    } catch {
      return true;
    }
  });

  // El aviso "lista para usar sin conexión" se oculta solo.
  useEffect(() => {
    if (!pwa.listoOffline) return undefined;
    const t = setTimeout(descartarAvisoOffline, 6000);
    return () => clearTimeout(t);
  }, [pwa.listoOffline]);

  const mostrarAvisoIos = esIosSafari() && !pwa.instalada && !avisoIosCerrado;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex flex-col items-center gap-2 px-3 pb-24 sm:pb-28">
      {pwa.necesitaActualizar && (
        <Barra
          color="#3E7BFA"
          icono={RefreshCw}
          accion={
            <span className="flex shrink-0 gap-1.5">
              <button onClick={() => window.dispatchEvent(new CustomEvent('workversity:novedades', { detail: { modo: 'pendiente' } }))} className={botonAccion}>Ver cambios</button>
              <button onClick={aplicarActualizacion} className={botonAccion}>Actualizar ya</button>
            </span>
          }
        >
          {pwa.bloqueada
            ? `Hay una versión nueva${pwa.versionNueva ? ` (${pwa.versionNueva.version})` : ''}. Termina lo que estás escribiendo y se actualizará sola.`
            : `Versión nueva${pwa.versionNueva ? ` ${pwa.versionNueva.version}` : ''} lista${pwa.cuentaAtras != null ? `: se actualiza sola en ${pwa.cuentaAtras} s` : ''}.`}
        </Barra>
      )}

      {!sync.enLinea && sync.probableProblemaServidor && (
        <Barra color="#E5484D" icono={AlertTriangle} accion={<button onClick={() => vaciarCola()} className={botonAccion}>Reintentar</button>}>
          Tu internet funciona, pero la app no logra comunicarse con tu base de datos ({sync.pendientes} por subir). Es probable que tu proyecto de Supabase esté pausado, borrado, o que la dirección en tu archivo .env no sea la correcta. Revisa tu panel de Supabase.
        </Barra>
      )}
      {!sync.enLinea && !sync.probableProblemaServidor && (
        <Barra color="#6E7180" icono={WifiOff}>
          Sin conexión. Puedes seguir usando la app: tus cambios se guardan en este dispositivo
          {sync.pendientes > 0 ? ` (${sync.pendientes} por subir)` : ''} y se sincronizan solos al volver el internet.
        </Barra>
      )}

      {sync.enLinea && sync.pendientes > 0 && (
        <Barra
          color="#F5A524"
          icono={sync.sincronizando ? CloudUpload : AlertTriangle}
          accion={
            !sync.sincronizando && (
              <button onClick={() => vaciarCola()} className={botonAccion}>Reintentar</button>
            )
          }
        >
          {sync.sincronizando ? 'Sincronizando' : 'Pendiente de sincronizar'}: {sync.pendientes} cambio(s).
        </Barra>
      )}

      {sync.ultimoError && sync.enLinea && (
        <Barra
          color="#E5484D"
          icono={AlertTriangle}
          accion={
            sync.esquema && (
              <span className="flex shrink-0 flex-col gap-1.5">
                <button onClick={() => copiarSqlActualizacion().catch(() => {})} className={botonAccion}>Copiar SQL</button>
                <a href={enlaceSqlEditor()} target="_blank" rel="noreferrer" className={`${botonAccion} text-center`}>Abrir Supabase</a>
              </span>
            )
          }
        >
          {sync.ultimoError}
        </Barra>
      )}

      {pwa.listoOffline && (
        <Barra color="#17C964" icono={CheckCircle2} onCerrar={descartarAvisoOffline}>
          Listo: Workversity ya funciona sin conexión.
        </Barra>
      )}

      {pwa.puedeInstalar && !pwa.instalada && (
        <Barra
          color="#4A7FB5"
          icono={Download}
          accion={<button onClick={instalarApp} className={botonAccion}>Instalar</button>}
        >
          Instala Workversity en tu dispositivo para abrirla como una app.
        </Barra>
      )}

      {mostrarAvisoIos && (
        <Barra
          color="#4A7FB5"
          icono={Share}
          onCerrar={() => {
            setAvisoIosCerrado(true);
            try {
              localStorage.setItem(CLAVE_AVISO_IOS, '1');
            } catch {
              /* nada */
            }
          }}
        >
          Para instalarla: toca Compartir y luego “Añadir a pantalla de inicio”.
        </Barra>
      )}
    </div>
  );
}
