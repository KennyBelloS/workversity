import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { solicitarRecuperacionPorCorreo } from '../services/auth';

export default function Login() {
  const { login, signup, autenticado, cargando } = useAuth();
  const navigate = useNavigate();

  const [modo, setModo] = useState('login'); // 'login' | 'registro' | 'recuperar'
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [diagnostico, setDiagnostico] = useState('');

  if (!cargando && autenticado) return <Navigate to="/" replace />;

  const traducirError = (msg) => {
    if (msg?.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (msg?.includes('User already registered')) return 'Ya existe una cuenta con ese correo.';
    if (msg?.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (navigator.onLine === false)
      return 'Tu dispositivo no tiene internet. Para iniciar sesión necesitas conexión; después podrás usar la app sin conexión.';
    if (/failed to fetch|network|timeout|load failed/i.test(msg || '')) {
      let host = 'Supabase';
      try {
        host = new URL(import.meta.env.VITE_SUPABASE_URL).host;
      } catch {
        /* URL inválida */
      }
      return `Tienes internet, pero no se pudo conectar con el servidor (${host}). Puede que esté caído temporalmente, o que algo en tu red (una extensión o un antivirus) esté bloqueando la conexión. Intenta de nuevo en un momento.`;
    }
    // No se adivina qué más podría ser "técnico": si no es ninguno de los casos de
    // arriba, se asume que sí lo es y se muestra algo genérico, nunca el mensaje crudo.
    return 'Ocurrió un error. Intenta de nuevo.';
  };

  // Prueba directa (sin supabase-js) para saber si el navegador alcanza el servidor.
  const probarConexion = async () => {
    setDiagnostico('Probando…');
    const url = import.meta.env.VITE_SUPABASE_URL;
    const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const lineas = [`navigator.onLine: ${navigator.onLine}`, `Página: ${window.location.origin}`, `Supabase: ${url}`];
    try {
      const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: clave } });
      lineas.push(`Respuesta: HTTP ${r.status} ${r.ok ? '(el servidor SÍ responde)' : ''}`);
      if (!r.ok) lineas.push((await r.text()).slice(0, 200));
    } catch (err) {
      lineas.push(`FALLÓ: ${err.name}: ${err.message}`);
      lineas.push('El navegador no logró llegar al servidor (proyecto pausado/eliminado, DNS, bloqueo o CORS).');
    }
    setDiagnostico(lineas.join('\n'));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setEnviando(true);
    try {
      if (modo === 'login') {
        await login(correo.trim(), password);
        navigate('/');
      } else if (modo === 'registro') {
        await signup(nombre.trim(), correo.trim(), password);
        setMensaje('Cuenta creada. Si tu proyecto de Supabase pide confirmar el correo, revisa tu bandeja antes de entrar.');
        setModo('login');
      } else {
        await solicitarRecuperacionPorCorreo(correo.trim());
        setMensaje('Te enviamos un correo para restablecer tu contraseña.');
      }
    } catch (err) {
      setError(traducirError(err.message));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary to-primaryDark px-4">
      <div className="w-full max-w-sm rounded-lg2 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 w-fit"><Logo tam={64} /></div>
          <h1 className="text-xl font-extrabold text-textPrimary">Workversity</h1>
          <p className="mt-1 text-sm text-textSecondary">
            {modo === 'login' && 'Organiza tu vida entre trabajo y universidad'}
            {modo === 'registro' && 'Crea tu cuenta gratis'}
            {modo === 'recuperar' && 'Recupera el acceso a tu cuenta'}
          </p>
        </div>

        <form onSubmit={enviar} className="space-y-3">
          {modo === 'registro' && (
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="Correo electrónico"
            required
            className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {modo !== 'recuperar' && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              minLength={6}
              className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          {error && <p className="text-xs font-semibold text-danger">{error}</p>}
          {mensaje && <p className="text-xs font-semibold text-success">{mensaje}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-sm2 bg-primary py-3 text-sm font-bold text-white transition hover:bg-primaryDark disabled:opacity-60"
          >
            {enviando
              ? 'Un momento…'
              : modo === 'login'
              ? 'Entrar'
              : modo === 'registro'
              ? 'Crear cuenta'
              : 'Enviar correo de recuperación'}
          </button>
        </form>

        {(error || diagnostico) && (
          <div className="mt-3">
            <button type="button" onClick={probarConexion} className="text-xs font-semibold text-textSecondary underline">
              Probar conexión con Supabase
            </button>
            {diagnostico && (
              <pre className="mt-2 whitespace-pre-wrap break-words rounded-sm2 bg-bg p-2 text-[11px] text-textPrimary">{diagnostico}</pre>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col items-center gap-2 text-xs font-semibold">
          {modo === 'login' && (
            <>
              <button onClick={() => setModo('recuperar')} className="text-textSecondary hover:text-primary">
                Olvidé mi contraseña
              </button>
              <button onClick={() => setModo('registro')} className="text-primary">
                ¿No tienes cuenta? Regístrate
              </button>
            </>
          )}
          {modo !== 'login' && (
            <button onClick={() => setModo('login')} className="text-primary">
              Volver a iniciar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
