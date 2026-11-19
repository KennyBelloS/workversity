import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { PanelLeftClose, PanelLeftOpen, LogOut, Sun, Moon } from 'lucide-react';
import { TODOS } from './DockNav';
import { useAuth } from '../../context/AuthContext';
import { useTema, elegirTema } from '../../hooks/useTema';
import Logo from '../Logo';
import { NATURAL, RAPIDO, sinMovimiento } from '../../lib/movimiento';

// ---------------------------------------------------------------------------------------------
// Barra lateral (solo computador, ≥1024 px).
//
// En el celular la navegación es una barra abajo, al alcance del pulgar. En el computador eso
// desperdicia el recurso que sobra —el ancho— y obliga a mirar al centro-abajo para cambiar de
// sección. Aquí la navegación se vuelve una columna fija a la izquierda, agrupada por para qué
// sirve cada cosa (Organiza / Estudia / Tu cuenta), con la sección activa marcada por una
// pastilla de tinta que SE DESLIZA de una opción a otra en vez de aparecer y desaparecer.
//
// Se puede encoger a solo íconos (se recuerda), para quien quiera todo el ancho para el trabajo.
// El ancho vive en la variable --bl, que es la que usa el contenido para no quedar debajo.
// ---------------------------------------------------------------------------------------------

const CLAVE = 'workversity:barra';
const ANCHO = { abierta: '16.5rem', cerrada: '4.75rem' };

const GRUPOS = [
  { titulo: null, rutas: ['/'] },
  { titulo: 'Organiza', rutas: ['/tareas', '/horario', '/materias', '/apuntes'] },
  { titulo: 'Estudia', rutas: ['/parciales', '/analitica', '/resumen', '/metas'] },
  { titulo: 'Tu cuenta', rutas: ['/finanzas', '/grupo', '/configuracion', '/ayuda'] },
];

const porRuta = new Map(TODOS.map((i) => [i.to, i]));

function leer() {
  try { return localStorage.getItem(CLAVE) !== 'cerrada'; } catch { return true; }
}

export default function BarraLateral() {
  const [abierta, setAbierta] = useState(leer);
  const { perfil, usuario, logout } = useAuth();
  const { oscuro } = useTema();
  const quieto = sinMovimiento();

  // El contenido se corre según el ancho de la barra: una sola fuente de verdad.
  useEffect(() => {
    document.documentElement.style.setProperty('--bl', abierta ? ANCHO.abierta : ANCHO.cerrada);
    return () => document.documentElement.style.removeProperty('--bl');
  }, [abierta]);

  const alternar = useCallback(() => {
    setAbierta((a) => {
      try { localStorage.setItem(CLAVE, a ? 'cerrada' : 'abierta'); } catch { /* modo privado */ }
      return !a;
    });
  }, []);

  const nombre = perfil?.nombre || usuario?.email || '';
  const inicial = (nombre.trim()[0] || '?').toUpperCase();

  return (
    <aside className="bl" data-cerrada={abierta ? undefined : '1'} aria-label="Navegación principal">
      <div className="bl-cab">
        <NavLink to="/" end aria-label="Ir al inicio" className="bl-marca">
          <Logo tam={28} />
          <span className="bl-marca-t">Workversity</span>
        </NavLink>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={RAPIDO}
          onClick={alternar}
          aria-label={abierta ? 'Encoger la barra' : 'Ampliar la barra'}
          title={abierta ? 'Encoger la barra' : 'Ampliar la barra'}
          className="bl-plegar"
        >
          {abierta ? <PanelLeftClose size={16} strokeWidth={1.8} /> : <PanelLeftOpen size={16} strokeWidth={1.8} />}
        </motion.button>
      </div>

      <nav className="bl-cuerpo">
        {GRUPOS.map((g) => (
          <div key={g.titulo || 'raiz'} className="bl-grupo">
            {g.titulo && <p className="bl-grupo-t">{g.titulo}</p>}
            {g.rutas.map((ruta) => {
              const i = porRuta.get(ruta);
              if (!i) return null;
              const Icono = i.icon;
              return (
                <NavLink key={ruta} to={ruta} end={i.end} title={abierta ? undefined : i.label} className="bl-enlace">
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId={quieto ? undefined : 'bl-activo'}
                          transition={NATURAL}
                          className="bl-tinta"
                          aria-hidden="true"
                        />
                      )}
                      <span className="bl-icono"><Icono size={18} strokeWidth={isActive ? 2 : 1.7} /></span>
                      <span className="bl-texto">{i.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="bl-pie">
        <div className="bl-yo" title={nombre}>
          <span className="bl-avatar" aria-hidden="true">{inicial}</span>
          <span className="bl-yo-t">{nombre}</span>
        </div>
        <div className="bl-acciones">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            transition={RAPIDO}
            onClick={() => elegirTema(oscuro ? 'claro' : 'oscuro')}
            aria-label="Cambiar tema"
            title={oscuro ? 'Modo claro' : 'Modo oscuro'}
            className="bl-mini"
          >
            {oscuro ? <Sun size={15} /> : <Moon size={15} />}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            transition={RAPIDO}
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="bl-mini bl-mini--salir"
          >
            <LogOut size={15} />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
