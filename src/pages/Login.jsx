import { useEffect, useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, User, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { solicitarRecuperacionPorCorreo } from '../services/auth';
import Arana from '../components/decoracion/Arana';
import KoiEstanque from '../components/decoracion/KoiEstanque';

// ---------------------------------------------------------------------------------------------
// Inicio de sesión. Los dos formularios (entrar / crear cuenta) están siempre montados, uno a
// cada lado. Encima pasa UNA sola franja sesgada (la "cuchilla"), más ancha que la tarjeta, que
// cruza de un lado al otro con un único translateX: a mitad de camino lo cubre todo y, al salir,
// deja descubierto el otro formulario. Nunca hay un fundido de pantalla completa. El texto de la
// cuchilla se mueve en sentido contrario para quedarse quieto mientras ella pasa por encima.
// La araña vive en la esquina del lado claro: es la que lanza el hilo y "jala" la cuchilla.
// ---------------------------------------------------------------------------------------------

const TITULARES = {
  login: { linea1: 'De vuelta', linea2: 'a tu semana.', texto: 'Tus materias, tareas y finanzas siguen justo donde las dejaste.' },
  recuperar: { linea1: 'Te ayudamos', linea2: 'a volver.', texto: 'Escribe tu correo y te enviamos un enlace para elegir una contraseña nueva.' },
  registro: { linea1: 'Empieza la', linea2: 'primera página.', texto: 'Una sola cuenta para la universidad, el trabajo y cada dispositivo que uses.' },
};

function Campo({ etiqueta, tipo = 'text', valor, onCambiar, icono: Icono, autoComplete, i = 0, minLength, children }) {
  const [ver, setVer] = useState(false);
  const esClave = tipo === 'password';
  return (
    <div className="auth-entra" style={{ '--i': i }}>
      <label className="auth-campo">
        <input
          type={esClave && ver ? 'text' : tipo}
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          placeholder=" "
          autoComplete={autoComplete}
          required
          minLength={minLength}
        />
        <span className="auth-etiqueta">{etiqueta}</span>
        <span className="auth-linea" aria-hidden="true" />
        {esClave ? (
          <button type="button" className="auth-icono auth-icono--boton" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            {ver ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        ) : (
          Icono && <span className="auth-icono" aria-hidden="true"><Icono size={15} /></span>
        )}
      </label>
      {children}
    </div>
  );
}

function FuerzaClave({ clave }) {
  const nivel = clave.length === 0 ? 0 : clave.length < 6 ? 1 : clave.length < 9 ? 2 : /[^a-zA-Z]/.test(clave) ? 4 : 3;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => <span key={n} className="h-[2px] flex-1 rounded-full transition-colors duration-300" style={{ background: n <= nivel ? (nivel === 1 ? '#D9534F' : 'rgb(var(--primary))') : 'rgb(var(--textPrimary) / 0.1)' }} />)}
      </div>
      <span className="text-t-nota text-textSecondary">Mínimo 6 caracteres</span>
    </div>
  );
}

function Panel({ activo, className, children }) {
  const ref = useRef(null);
  // El formulario que está debajo de la cuchilla no debe recibir foco ni clics.
  useEffect(() => { ref.current?.toggleAttribute('inert', !activo); }, [activo]);
  return <div ref={ref} data-activo={activo} className={className}>{children}</div>;
}

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
  const [cruzando, setCruzando] = useState(false);
  const tarjeta = useRef(null);
  const aranaIzq = useRef(null);
  const aranaDer = useRef(null);

  if (!cargando && autenticado) return <Navigate to="/" replace />;

  const traducirError = (msg) => {
    if (msg?.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (msg?.includes('User already registered')) return 'Ya existe una cuenta con ese correo.';
    if (msg?.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg?.includes('Email not confirmed')) return 'Primero confirma tu correo: revisa tu bandeja de entrada.';
    if (msg?.includes('banned') || msg?.includes('User is banned')) return 'Esta cuenta está suspendida. Habla con el administrador.';
    if (navigator.onLine === false) return 'No tienes conexión a internet. Para entrar necesitas estar en línea.';
    if (/failed to fetch|network|timeout|load failed/i.test(msg || '')) return 'No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.';
    return 'Ocurrió un error. Intenta de nuevo.';
  };

  // Cambiar entre entrar y crear cuenta: la araña del lado visible lanza el hilo hacia el filo
  // de la cuchilla y, cuando el hilo llega, la cuchilla cruza. Luego la otra araña se asoma.
  const cambiarModo = async (nuevo) => {
    if (cruzando || nuevo === modo) return;
    setError('');
    setMensaje('');
    const cruza = (modo === 'registro') !== (nuevo === 'registro');
    if (!cruza) { setModo(nuevo); return; }
    setCruzando(true);
    const caja = tarjeta.current?.getBoundingClientRect();
    const escritorio = caja && caja.width >= 768;
    if (escritorio) {
      const W = caja.width;
      const H = caja.height;
      const S = 118;
      const y = H * 0.56;
      // Coordenadas dentro del contenedor de cada araña (cada una ocupa una mitad de la tarjeta).
      if (modo !== 'registro') await aranaIzq.current?.buscar({ x: 0.47 * W + (S * y) / H - 6, y });
      else await aranaDer.current?.buscar({ x: 0.53 * W - S + (S * y) / H + 6 - W / 2, y });
    } else if (caja) {
      await aranaDer.current?.buscar({ x: caja.width * 0.3, y: 2 });
    }
    setModo(nuevo);
    setTimeout(() => {
      (nuevo === 'registro' ? aranaDer : aranaIzq).current?.entrar();
      setCruzando(false);
    }, escritorio ? 900 : 420);
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
        setPassword('');
        await cambiarModo('login');
        setMensaje('¡Cuenta creada! Si te pedimos confirmar el correo, revisa tu bandeja antes de entrar.');
      } else {
        await solicitarRecuperacionPorCorreo(correo.trim());
        setMensaje('Listo: te enviamos un correo con el enlace para cambiar tu contraseña.');
      }
    } catch (err) {
      setError(traducirError(err?.message));
    } finally {
      setEnviando(false);
    }
  };

  const avisos = (
    <div className="auth-entra min-h-[18px]" style={{ '--i': 6 }} aria-live="polite">
      {error && <p className="text-t-micro font-semibold text-[#B04A3E]">{error}</p>}
      {mensaje && <p className="text-t-micro font-semibold text-[#2F7A55]">{mensaje}</p>}
    </div>
  );
  const boton = (texto, i) => (
    <button type="submit" disabled={enviando || cruzando} className="auth-boton auth-entra" style={{ '--i': i }}>
      {enviando ? <><Loader2 size={15} className="animate-spin" /> Un momento…</> : texto}
    </button>
  );

  return (
    <div className="auth-fondo">
      <div ref={tarjeta} className="auth" data-modo={modo}>
        <div className="auth-paneles">
          {/* Lado izquierdo: entrar (o recuperar contraseña) */}
          <Panel activo={modo !== 'registro'} className="auth-panel auth-panel--izq">
            <div className="auth-vistas">
              <Panel activo={modo === 'login'} className="auth-vista">
                <form onSubmit={enviar} className="auth-form">
                  <h1 className="auth-titulo auth-entra" style={{ '--i': 0 }}>Iniciar sesión</h1>
                  <Campo i={1} etiqueta="Correo electrónico" tipo="email" valor={correo} onCambiar={setCorreo} icono={Mail} autoComplete="email" />
                  <Campo i={2} etiqueta="Contraseña" tipo="password" valor={password} onCambiar={setPassword} autoComplete="current-password" minLength={6} />
                  <div className="auth-entra flex justify-end" style={{ '--i': 3 }}>
                    <button type="button" onClick={() => cambiarModo('recuperar')} className="auth-enlace">¿Olvidaste tu contraseña?</button>
                  </div>
                  {boton('Entrar', 4)}
                  {avisos}
                  <p className="auth-pie auth-entra" style={{ '--i': 7 }}>
                    ¿Nuevo en Workversity? <button type="button" onClick={() => cambiarModo('registro')} className="auth-enlace auth-enlace--fuerte">Crear una cuenta</button>
                  </p>
                </form>
              </Panel>
              <Panel activo={modo === 'recuperar'} className="auth-vista">
                <form onSubmit={enviar} className="auth-form">
                  <h1 className="auth-titulo auth-entra" style={{ '--i': 0 }}>Recuperar acceso</h1>
                  <p className="auth-entra mb-1 text-t-pie leading-relaxed text-textSecondary" style={{ '--i': 1 }}>Te enviaremos un enlace a tu correo para que elijas una contraseña nueva.</p>
                  <Campo i={2} etiqueta="Correo electrónico" tipo="email" valor={correo} onCambiar={setCorreo} icono={Mail} autoComplete="email" />
                  {boton('Enviar enlace', 3)}
                  {avisos}
                  <p className="auth-pie auth-entra" style={{ '--i': 7 }}>
                    <button type="button" onClick={() => cambiarModo('login')} className="auth-enlace auth-enlace--fuerte inline-flex items-center gap-1"><ArrowLeft size={13} /> Volver a iniciar sesión</button>
                  </p>
                </form>
              </Panel>
            </div>
          </Panel>

          {/* Lado derecho: crear cuenta */}
          <Panel activo={modo === 'registro'} className="auth-panel auth-panel--der">
            <form onSubmit={enviar} className="auth-form">
              <h1 className="auth-titulo auth-entra" style={{ '--i': 0 }}>Crear cuenta</h1>
              <Campo i={1} etiqueta="Nombre completo" valor={nombre} onCambiar={setNombre} icono={User} autoComplete="name" />
              <Campo i={2} etiqueta="Correo electrónico" tipo="email" valor={correo} onCambiar={setCorreo} icono={Mail} autoComplete="email" />
              <Campo i={3} etiqueta="Contraseña" tipo="password" valor={password} onCambiar={setPassword} autoComplete="new-password" minLength={6}>
                <FuerzaClave clave={password} />
              </Campo>
              {boton('Crear cuenta', 4)}
              {avisos}
              <p className="auth-pie auth-entra" style={{ '--i': 7 }}>
                ¿Ya tienes cuenta? <button type="button" onClick={() => cambiarModo('login')} className="auth-enlace auth-enlace--fuerte">Inicia sesión</button>
              </p>
            </form>
          </Panel>

          {/* Las arañas: cada una en la esquina exterior de su lado (debajo de la cuchilla). */}
          <div className="auth-arana auth-arana--izq"><Arana ref={aranaIzq} esquina="sup-izq" escala={1.12} /></div>
          <div className="auth-arana auth-arana--der"><Arana ref={aranaDer} esquina="sup-der" escala={1.12} /></div>
        </div>

        {/* La cuchilla */}
        <div className="auth-cuchilla-sombra" aria-hidden="true">
          <div className="auth-cuchilla">
            <div className="auth-estanque"><KoiEstanque cuantos={11} celda={7} tema="oscuro" intensidad={0.5} /></div>
            <span className="auth-costura auth-costura--izq" />
            <span className="auth-costura auth-costura--der" />
            <div className="auth-cuchilla-interior">
              {Object.entries(TITULARES).map(([clave, t]) => (
                <div key={clave} className={`auth-titular auth-titular--${clave === 'registro' ? 'izq' : 'der'}`} data-visible={modo === clave}>
                  <div className="auth-marca">
                    <span className="auth-marca-logo"><img src="/logo.png" alt="" width="46" height="46" /></span>
                    <span>
                      <span className="auth-marca-nombre">Workversity</span>
                      <span className="auth-marca-lema">Tu semana, en orden</span>
                    </span>
                  </div>
                  <p className="auth-grande">{t.linea1}<br /><em>{t.linea2}</em></p>
                  <p className="auth-bajada">{t.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
