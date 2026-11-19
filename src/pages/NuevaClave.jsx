import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabase';
import KoiEstanque from '../components/decoracion/KoiEstanque';

// Pantalla a la que lleva el enlace del correo de recuperación. Supabase lee el enlace (viene en
// la dirección) y abre una sesión temporal de recuperación; aquí se elige la contraseña nueva.

function CampoClave({ etiqueta, valor, onCambiar, autoFocus }) {
  const [ver, setVer] = useState(false);
  return (
    <label className="auth-campo">
      <input type={ver ? 'text' : 'password'} value={valor} onChange={(e) => onCambiar(e.target.value)} placeholder=" " autoComplete="new-password" required minLength={6} autoFocus={autoFocus} />
      <span className="auth-etiqueta">{etiqueta}</span>
      <span className="auth-linea" aria-hidden="true" />
      <button type="button" className="auth-icono auth-icono--boton" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
        {ver ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </label>
  );
}

export default function NuevaClave() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('verificando'); // verificando | lista | invalida | hecho
  const [clave, setClave] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    // Un enlace vencido o ya usado llega con el error en la dirección.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('error') || hash.get('error_code')) { setEstado('invalida'); return undefined; }
    let vivo = true;
    const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (vivo && sesion && (evento === 'PASSWORD_RECOVERY' || evento === 'SIGNED_IN')) setEstado('lista');
    });
    supabase.auth.getSession().then(({ data: d }) => {
      if (!vivo) return;
      if (d?.session) setEstado('lista');
      else setTimeout(() => vivo && setEstado((e) => (e === 'verificando' ? 'invalida' : e)), 2500);
    });
    return () => { vivo = false; data?.subscription?.unsubscribe(); };
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    if (clave.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (clave !== repetir) return setError('Las dos contraseñas no coinciden.');
    setGuardando(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: clave });
      if (err) throw err;
      setEstado('hecho');
    } catch (err) {
      setError(/same|different/i.test(err?.message || '') ? 'La contraseña nueva debe ser distinta de la anterior.' : 'No se pudo guardar. Pide un enlace nuevo e inténtalo otra vez.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="auth-fondo">
      <div className="auth-sola">
        <div className="auth-sola-cabecera">
          <div className="auth-estanque"><KoiEstanque cuantos={4} celda={9} tema="oscuro" /></div>
          <div className="auth-marca" style={{ marginBottom: 0 }}>
            <span className="auth-marca-logo"><img src="/logo.png" alt="" width="46" height="46" /></span>
            <span><span className="auth-marca-nombre">Workversity</span><span className="auth-marca-lema">Tu semana, en orden</span></span>
          </div>
        </div>
        <div className="auth-sola-cuerpo">
          {estado === 'verificando' && (
            <p className="flex items-center gap-2 text-sm text-textSecondary"><Loader2 size={16} className="animate-spin" /> Revisando tu enlace…</p>
          )}
          {estado === 'invalida' && (
            <div className="space-y-4">
              <h1 className="auth-titulo">Este enlace ya no sirve</h1>
              <p className="flex gap-2 text-t-pie leading-relaxed text-textSecondary"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-primary" /> Los enlaces de recuperación vencen en 1 hora y solo se pueden usar una vez. Pide uno nuevo desde el inicio de sesión.</p>
              <Link to="/login" className="auth-boton">Volver a iniciar sesión</Link>
            </div>
          )}
          {estado === 'lista' && (
            <form onSubmit={guardar} className="auth-form" style={{ width: '100%' }}>
              <h1 className="auth-titulo">Elige tu nueva contraseña</h1>
              <CampoClave etiqueta="Contraseña nueva" valor={clave} onCambiar={setClave} autoFocus />
              <CampoClave etiqueta="Repítela" valor={repetir} onCambiar={setRepetir} />
              <button type="submit" disabled={guardando} className="auth-boton">
                {guardando ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Guardar contraseña'}
              </button>
              {error && <p className="text-t-micro font-semibold text-[#B04A3E]">{error}</p>}
            </form>
          )}
          {estado === 'hecho' && (
            <div className="space-y-4">
              <h1 className="auth-titulo">¡Listo!</h1>
              <p className="flex gap-2 text-t-pie leading-relaxed text-textSecondary"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#2F7A55]" /> Tu contraseña quedó cambiada. Ya puedes seguir con tu semana.</p>
              <button onClick={() => navigate('/', { replace: true })} className="auth-boton w-full">Ir a Workversity</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
