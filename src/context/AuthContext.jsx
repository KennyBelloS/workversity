import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  iniciarSesion,
  registrarse,
  cerrarSesion,
  obtenerSesion,
  obtenerPerfil,
  asegurarPerfil,
  suscribirseACambiosDeSesion,
} from '../services/auth';
import {
  leerUsuarioLocal,
  guardarUsuarioLocal,
  prepararCopiaLocal,
  borrarCopiaLocal,
} from '../offline/sesionLocal';
import { iniciarSync, obtenerEstado, conTimeout } from '../offline/sync';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // Usuario recordado en el dispositivo: permite abrir la app SIN internet aunque
  // el token de Supabase haya vencido (no se puede renovar sin red).
  const [usuarioOffline, setUsuarioOffline] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const preparacionRef = useRef({ id: null, promesa: null });

  const cargarPerfil = async (user) => {
    if (!user?.id) {
      setPerfil(null);
      return;
    }
    try {
      let p = await obtenerPerfil(user.id);
      if (!p && navigator.onLine !== false) {
        await asegurarPerfil(user);
        p = await obtenerPerfil(user.id);
      }
      setPerfil(p);
    } catch (err) {
      console.warn('[perfil] No se pudo cargar:', err?.message || err);
      setPerfil(null);
    }
  };

  // Deja lista la copia local de este usuario. Si ya se hizo (o está en curso)
  // para el mismo usuario, reutiliza esa misma operación.
  const aplicarUsuario = (user) => {
    if (!user?.id) return Promise.resolve();
    if (preparacionRef.current.id === user.id && preparacionRef.current.promesa) {
      return preparacionRef.current.promesa;
    }
    const promesa = (async () => {
      guardarUsuarioLocal(user);
      await prepararCopiaLocal(user.id);
      iniciarSync();
      cargarPerfil(user); // en segundo plano: no bloquea la pantalla si la red va lenta
    })();
    preparacionRef.current = { id: user.id, promesa };
    return promesa;
  };

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        let s = null;
        let fallo = false;
        try {
          s = await conTimeout(obtenerSesion(), 8000);
        } catch (err) {
          fallo = true;
          console.warn('[auth] No se pudo leer la sesión:', err?.message || err);
        }
        if (!activo) return;

        if (s?.user) {
          setSession(s);
          await aplicarUsuario(s.user);
        } else {
          const recordado = leerUsuarioLocal();
          const sinRed = fallo || navigator.onLine === false;
          if (recordado && sinRed) {
            // Modo sin conexión: se entra con la cuenta recordada en este dispositivo.
            setUsuarioOffline(recordado);
            await aplicarUsuario(recordado);
          }
          // Con conexión y sin sesión válida: la persona realmente no ha iniciado sesión.
        }
      } catch (err) {
        console.error('[auth] Error al iniciar:', err);
      } finally {
        if (activo) setCargando(false);
      }
    })();

    // OJO: este callback NO debe hacer `await` de llamadas a Supabase (puede
    // bloquear la autenticación). Se difiere con setTimeout.
    const subscription = suscribirseACambiosDeSesion((evento, s) => {
      if (evento === 'SIGNED_OUT') {
        setSession(null);
        setUsuarioOffline(null);
        setPerfil(null);
        preparacionRef.current = { id: null, promesa: null };
        return;
      }
      if (!s?.user) return; // p. ej. INITIAL_SESSION vacío: lo maneja el arranque de arriba
      setSession(s);
      setUsuarioOffline(null);
      setTimeout(() => {
        if (activo) aplicarUsuario(s.user);
      }, 0);
    });

    // Al recuperar internet, se vuelve a intentar leer la sesión real.
    const alVolverInternet = async () => {
      try {
        const s = await obtenerSesion();
        if (activo && s?.user) {
          setSession(s);
          setUsuarioOffline(null);
        }
      } catch {
        /* se reintentará solo */
      }
    };
    window.addEventListener('online', alVolverInternet);

    return () => {
      activo = false;
      subscription?.unsubscribe();
      window.removeEventListener('online', alVolverInternet);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (correo, password) => {
    const datos = await iniciarSesion(correo, password);
    // Se prepara la copia local ANTES de entrar a la app, para no mostrar datos de otra cuenta.
    if (datos?.user) await aplicarUsuario(datos.user);
  };

  const signup = async (nombre, correo, password) => {
    await registrarse(nombre, correo, password);
  };

  const logout = async () => {
    const { pendientes } = obtenerEstado();
    if (pendientes > 0) {
      const seguir = window.confirm(
        `Tienes ${pendientes} cambio(s) sin sincronizar (hechos sin conexión). Si cierras sesión ahora se perderán.\n\n¿Cerrar sesión de todas formas?`
      );
      if (!seguir) return;
    }
    await cerrarSesion();
    await borrarCopiaLocal();
    preparacionRef.current = { id: null, promesa: null };
    setSession(null);
    setUsuarioOffline(null);
    setPerfil(null);
  };

  const usuario = session?.user || usuarioOffline || null;

  const value = {
    session,
    usuario,
    perfil,
    autenticado: !!usuario,
    modoOffline: !session?.user && !!usuarioOffline,
    cargando,
    login,
    signup,
    logout,
    refrescarPerfil: () => cargarPerfil(usuario),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

 
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
