import { useEffect, useMemo, useState } from 'react';
import { Users, UserCheck, UserPlus, Repeat, ShieldOff, ShieldCheck, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listarUsuarios } from '../services/admin';
import { calcularEstadisticasUsuarios, ordenarPorUltimoIngreso } from '../lib/admin';
import { formatearFechaHora } from '../lib/dateUtils';
import { mensajeAmigable } from '../lib/erroresAmigables';
import ErrorCarga from '../components/ErrorCarga';

function Kpi({ icono: Icono, color, etiqueta, valor }) {
  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color }}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1F` }}><Icono size={15} /></span>
        {etiqueta}
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{valor}</p>
    </div>
  );
}

export default function Admin() {
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!perfil?.es_admin) { setCargando(false); return; }
    let vivo = true;
    listarUsuarios()
      .then((filas) => { if (vivo) setUsuarios(filas); })
      .catch((err) => { if (vivo) setError(mensajeAmigable(err, 'cargar los usuarios')); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [perfil?.es_admin]);

  const stats = useMemo(() => calcularEstadisticasUsuarios(usuarios), [usuarios]);
  const ordenados = useMemo(() => ordenarPorUltimoIngreso(usuarios), [usuarios]);

  if (!perfil?.es_admin) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md2 bg-white p-10 text-center shadow-card">
        <ShieldOff size={28} className="text-textSecondary/50" />
        <p className="font-bold">Esta pantalla es solo para administradores</p>
        <p className="max-w-sm text-sm text-textSecondary">Tu cuenta no tiene ese rol. Si crees que deberías tenerlo, pídele a quien administra la app que te lo active.</p>
      </div>
    );
  }

  if (cargando) return <p className="py-10 text-center text-sm text-textSecondary">Cargando usuarios…</p>;

  return (
    <div>
      {error && <ErrorCarga mensaje={error} />}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi icono={Users} color="#5B8DEF" etiqueta="Usuarios registrados" valor={stats.total} />
        <Kpi icono={UserCheck} color="#17C964" etiqueta="Activos (7 días)" valor={stats.activos7d} />
        <Kpi icono={Repeat} color="#8B7FD1" etiqueta="Activos (30 días)" valor={stats.activos30d} />
        <Kpi icono={UserPlus} color="#F5A524" etiqueta="Nuevos (7 días)" valor={stats.nuevos7d} />
        <Kpi icono={ShieldCheck} color="#E5789C" etiqueta="Promedio de entradas" valor={stats.promedioIngresos} />
      </div>

      <div className="overflow-x-auto rounded-md2 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-bold uppercase tracking-wide text-textSecondary">
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Registrado</th>
              <th className="px-4 py-3">Último ingreso</th>
              <th className="px-4 py-3 text-center">Veces que ha entrado</th>
              <th className="px-4 py-3 text-center">Puntos</th>
              <th className="px-4 py-3 text-center">Rol</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((u) => (
              <tr key={u.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-bold">{u.nombre || '—'}</p>
                  <p className="text-xs text-textSecondary">{u.correo}</p>
                </td>
                <td className="px-4 py-3 text-textSecondary">{u.created_at ? formatearFechaHora(u.created_at) : '—'}</td>
                <td className="px-4 py-3 text-textSecondary">{u.ultimo_ingreso ? formatearFechaHora(u.ultimo_ingreso) : 'Nunca'}</td>
                <td className="px-4 py-3 text-center font-bold">{u.total_ingresos || 0}</td>
                <td className="px-4 py-3 text-center text-textSecondary">{u.puntos || 0}</td>
                <td className="px-4 py-3 text-center">
                  {u.es_admin ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primarySoft px-2 py-0.5 text-[11px] font-extrabold text-primary"><Crown size={11} /> Admin</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-extrabold text-textSecondary">Normal</span>
                  )}
                </td>
              </tr>
            ))}
            {ordenados.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-textSecondary">Todavía no hay usuarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-[11px] text-textSecondary">Este panel solo muestra datos de la cuenta (nombre, correo, ingresos). Nunca muestra tareas, finanzas ni apuntes de nadie.</p>
    </div>
  );
}
