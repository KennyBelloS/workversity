import { useEffect, useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { estadoPresupuesto } from '../lib/presupuesto';
import { Plus, TrendingUp, TrendingDown, PiggyBank, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from '../hooks/useSyncEstado';
import ErrorCarga from '../components/ErrorCarga';
import {
  listarMovimientos,
  crearMovimiento,
  actualizarMovimiento,
  eliminarMovimiento,
  obtenerPresupuesto,
  guardarPresupuesto,
} from '../services/finanzas';
import { currencyFormat, TRANSACTION_TYPES } from '../lib/constants';
import { formatearFechaCorta, claveMesActual, claveMesDe } from '../lib/dateUtils';
import TransactionModal from '../components/finanzas/TransactionModal';
import GastosDonutChart from '../components/finanzas/GastosDonutChart';

export default function Finanzas() {
  const { usuario } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [presupuesto, setPresupuesto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [editandoPresupuesto, setEditandoPresupuesto] = useState(false);
  const [montoPresupuesto, setMontoPresupuesto] = useState('');

  const mes = claveMesActual();

  const [error, setError] = useState('');
  const { version } = useSyncEstado();

  const cargar = async () => {
    try {
      const [movs, presu] = await Promise.all([listarMovimientos(), obtenerPresupuesto(mes)]);
      setMovimientos(movs);
      setPresupuesto(presu);
      setError('');
    } catch (err) {
      setError(mensajeAmigable(err, 'cargar tus finanzas'));
    } finally {
      setCargando(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, [version]);

  const movimientosDelMes = movimientos.filter((m) => claveMesDe(m.date) === mes);
  const ingresos = movimientosDelMes.filter((m) => m.type === 'ingreso').reduce((s, m) => s + Number(m.amount), 0);
  const gastos = movimientosDelMes.filter((m) => m.type === 'gasto').reduce((s, m) => s + Number(m.amount), 0);
  const ahorros = movimientosDelMes.filter((m) => m.type === 'ahorro').reduce((s, m) => s + Number(m.amount), 0);
  const balance = ingresos - gastos - ahorros;

  const guardar = async (mov) => {
    if (mov.id) {
      const { id, user_id, created_at, ...cambios } = mov;
      await actualizarMovimiento(id, cambios);
    } else {
      await crearMovimiento(mov, usuario.id);
    }
    await cargar();
    setModalAbierto(false);
    setEditando(null);
  };

  const eliminar = async (mov) => {
    await eliminarMovimiento(mov.id);
    await cargar();
  };

  const guardarPresu = async () => {
    const monto = Number(montoPresupuesto);
    if (!monto) return;
    await guardarPresupuesto(mes, monto, usuario.id);
    setEditandoPresupuesto(false);
    await cargar();
  };

  const porcentajePresupuesto = presupuesto ? Math.min((gastos / Number(presupuesto.amount)) * 100, 100) : 0;

  if (cargando) return <p className="py-10 text-center text-sm text-textSecondary">Cargando…</p>;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="rotulo">Este mes</p>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="boton-ppal"
        >
          <Plus size={18} /> Nuevo movimiento
        </button>
      </div>

      <ErrorCarga mensaje={error} />

      {/* Balance como pieza principal (oscura) y las tres cifras del mes a su lado. */}
      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <div className="bento-pieza relative overflow-hidden !rounded-[20px] !bg-[#141412] !p-5 text-white ring-1 ring-white/5 sm:!p-6 !min-h-[220px]" style={{ '--i': 0 }}>
          <p className="flex items-center gap-2 font-mono text-t-micro uppercase tracking-[0.14em] text-white/50"><span className={`h-1.5 w-1.5 rounded-full ${balance >= 0 ? 'bg-success' : 'bg-danger'}`} /> Balance del mes</p>
          <p className="font-display mt-6 text-[clamp(2.6rem,7vw,4.4rem)] leading-none">{currencyFormat.format(balance)}</p>
          <div className="mt-6 flex h-1.5 overflow-hidden rounded-full bg-white/10">
            {ingresos > 0 && <span className="h-full bg-white/85" style={{ width: `${Math.max(0, Math.min(100, ((ingresos - gastos - ahorros) / ingresos) * 100))}%` }} />}
            {ingresos > 0 && <span className="h-full bg-primary" style={{ width: `${Math.min(100, (ahorros / ingresos) * 100)}%` }} />}
          </div>
          <p className="mt-2 flex gap-4 font-mono text-t-micro text-white/45"><span>disponible</span><span className="text-primary">ahorro</span></p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[['Ingresos', ingresos, TrendingUp, 'rgb(var(--success))'], ['Gastos', gastos, TrendingDown, 'rgb(var(--danger))'], ['Ahorro', ahorros, PiggyBank, 'rgb(var(--primary))']].map(([t, v, Icono, c], i) => (
            <div key={t} className="bento-pieza flex items-center justify-between gap-3 !min-h-0 !rounded-[18px] !px-4 !py-3.5" style={{ '--i': i + 1 }}>
              <span className="rotulo" style={{ '--punto': c }}>{t}</span>
              <span className="flex items-center gap-2"><span className="font-display text-[1.6rem] leading-none">{currencyFormat.format(v)}</span><Icono size={14} strokeWidth={1.8} style={{ color: c }} /></span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 ficha">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold">Presupuesto mensual</p>
          <button onClick={() => { setMontoPresupuesto(presupuesto ? String(presupuesto.amount) : ''); setEditandoPresupuesto(true); }} className="text-xs font-bold text-primary">
            {presupuesto ? 'Editar' : 'Definir'}
          </button>
        </div>
        {editandoPresupuesto ? (
          <div className="flex gap-2">
            <input
              type="number"
              value={montoPresupuesto}
              onChange={(e) => setMontoPresupuesto(e.target.value)}
              placeholder="Monto mensual"
              className="flex-1 rounded-sm2 bg-primarySoft/60 px-3 py-2 text-sm outline-none"
            />
            <button onClick={guardarPresu} className="rounded-sm2 bg-primary px-4 text-sm font-bold text-white">Guardar</button>
          </div>
        ) : presupuesto ? (
          <>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/5">
              <div
                className={`h-full rounded-full ${porcentajePresupuesto >= 90 ? 'bg-danger' : 'bg-primary'}`}
                style={{ width: `${porcentajePresupuesto}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-textSecondary">
              {currencyFormat.format(gastos)} de {currencyFormat.format(presupuesto.amount)} ({Math.round(porcentajePresupuesto)}%)
            </p>
            {(() => {
              const e = estadoPresupuesto({ movimientos, presupuestos: [presupuesto] });
              if (!e) return null;
              const $ = (n) => currencyFormat.format(Math.round(n));
              return (
                <p className={`mt-1 text-t-micro font-semibold ${e.nivel === 'excedido' ? 'text-danger' : e.nivel === 'ok' ? 'text-textSecondary' : 'text-warning'}`}>
                  {e.nivel === 'excedido' ? `Te pasaste por ${$(-e.restante)}.` : `Te quedan ${$(e.restante)} para ${e.diasRestantes} días (≈ ${$(e.sugeridoPorDia)} por día). A este ritmo cerrarás el mes en ${$(e.proyeccion)}.`}
                </p>
              );
            })()}
          </>
        ) : (
          <p className="text-xs text-textSecondary">Toca aquí para definir un presupuesto mensual</p>
        )}
      </div>

      <div className="mt-3 ficha">
        <p className="rotulo mb-3">Gastos por categoría</p>
        <GastosDonutChart movimientos={movimientosDelMes} />
      </div>

      <div className="mt-3">
        <p className="rotulo mb-3">Movimientos recientes</p>
        {movimientos.length === 0 ? (
          <p className="rounded-md2 bg-white py-10 text-center text-sm text-textSecondary shadow-card">Aún no has registrado movimientos</p>
        ) : (
          <div className="space-y-2">
            {movimientos.slice(0, 30).map((m) => {
              const info = TRANSACTION_TYPES[m.type];
              return (
                <div key={m.id} className="flex items-center justify-between rounded-md2 bg-white p-3.5 shadow-card">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{m.category}</p>
                    <p className="text-xs text-textSecondary">{formatearFechaCorta(m.date)}{m.note ? ` · ${m.note}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold" style={{ color: info.color }}>
                      {m.type === 'gasto' ? '-' : '+'}{currencyFormat.format(m.amount)}
                    </span>
                    <button onClick={() => { setEditando(m); setModalAbierto(true); }} className="text-textSecondary hover:text-primary"><Pencil size={15} /></button>
                    <button onClick={() => eliminar(m)} className="text-textSecondary hover:text-danger"><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalAbierto && (
        <TransactionModal
          movExistente={editando}
          onGuardar={guardar}
          onEliminar={async (m) => { await eliminar(m); setModalAbierto(false); setEditando(null); }}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
