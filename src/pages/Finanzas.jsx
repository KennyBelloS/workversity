import { useEffect, useState } from 'react';
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
      setError(err.message || String(err));
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
        <p className="text-sm text-textSecondary">Resumen de este mes</p>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primaryDark"
        >
          <Plus size={18} /> Nuevo movimiento
        </button>
      </div>

      <ErrorCarga mensaje={error} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-md2 bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 text-success"><TrendingUp size={16} /><span className="text-xs font-bold">Ingresos</span></div>
          <p className="mt-1 text-xl font-extrabold">{currencyFormat.format(ingresos)}</p>
        </div>
        <div className="rounded-md2 bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 text-danger"><TrendingDown size={16} /><span className="text-xs font-bold">Gastos</span></div>
          <p className="mt-1 text-xl font-extrabold">{currencyFormat.format(gastos)}</p>
        </div>
        <div className="rounded-md2 bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 text-info"><PiggyBank size={16} /><span className="text-xs font-bold">Ahorro</span></div>
          <p className="mt-1 text-xl font-extrabold">{currencyFormat.format(ahorros)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-md2 bg-white p-4 shadow-card">
        <p className="text-sm font-bold">Balance del mes</p>
        <p className={`mt-1 text-2xl font-extrabold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>{currencyFormat.format(balance)}</p>
      </div>

      <div className="mt-3 rounded-md2 bg-white p-4 shadow-card">
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
                <p className={`mt-1 text-[11px] font-semibold ${e.nivel === 'excedido' ? 'text-danger' : e.nivel === 'ok' ? 'text-textSecondary' : 'text-warning'}`}>
                  {e.nivel === 'excedido' ? `Te pasaste por ${$(-e.restante)}.` : `Te quedan ${$(e.restante)} para ${e.diasRestantes} días (≈ ${$(e.sugeridoPorDia)} por día). A este ritmo cerrarás el mes en ${$(e.proyeccion)}.`}
                </p>
              );
            })()}
          </>
        ) : (
          <p className="text-xs text-textSecondary">Toca aquí para definir un presupuesto mensual</p>
        )}
      </div>

      <div className="mt-3 rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-bold">Gastos por categoría</p>
        <GastosDonutChart movimientos={movimientosDelMes} />
      </div>

      <div className="mt-3">
        <p className="mb-2 text-sm font-bold">Movimientos recientes</p>
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
