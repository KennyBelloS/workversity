import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Plus, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from '../hooks/useSyncEstado';
import { useEscape } from '../hooks/useEscape';
import { listarParciales, crearParcial, eliminarParcial } from '../services/parciales';
import { listarMaterias } from '../services/materias';
import { formatearFechaCorta } from '../lib/dateUtils';

function diasPara(fecha) {
  if (!fecha) return null;
  return Math.ceil((new Date(`${fecha}T23:59:59`) - new Date()) / 86400000);
}

function NuevoParcialModal({ materias, onGuardar, onCerrar }) {
  const [titulo, setTitulo] = useState('');
  const [materiaId, setMateriaId] = useState(materias[0]?.id || '');
  const [fecha, setFecha] = useState('');
  useEscape(onCerrar);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onCerrar}>
      <div className="w-full max-w-sm rounded-t-lg2 bg-bg p-5 sm:rounded-lg2" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-extrabold">Nuevo parcial</h2>
        <div className="space-y-3">
          <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Parcial 2 de Cálculo" className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" aria-label="Título del parcial" />
          {materias.length > 0 && (
            <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" aria-label="Materia">
              <option value="">Sin materia</option>
              {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          )}
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" aria-label="Fecha del parcial" />
          <div className="flex gap-3 pt-1">
            <button onClick={() => titulo.trim() && onGuardar({ titulo: titulo.trim(), materia_id: materiaId || null, fecha: fecha || null })} disabled={!titulo.trim()} className="flex-1 rounded-sm2 bg-primary py-3 text-sm font-bold text-white disabled:opacity-50">Crear</button>
            <button onClick={onCerrar} className="rounded-sm2 px-4 text-sm font-bold text-textSecondary">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Parciales() {
  const { usuario } = useAuth();
  const nav = useNavigate();
  const { version } = useSyncEstado();
  const [parciales, setParciales] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [modal, setModal] = useState(false);

  const cargar = () => Promise.all([listarParciales(), listarMaterias()]).then(([p, m]) => { setParciales(p); setMaterias(m); });
  useEffect(() => { cargar(); }, [version]);

  const crear = async (datos) => {
    const fila = await crearParcial(datos, usuario.id);
    await cargar();
    setModal(false);
    nav(`/parciales/${fila.id}`);
  };
  const borrar = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('¿Eliminar este parcial y sus tarjetas?')) return;
    await eliminarParcial(id);
    cargar();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-textSecondary">Sube tus apuntes o un archivo y prepárate con tarjetas, mini tests y una simulación de examen.</p>
        <button onClick={() => setModal(true)} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white"><Plus size={18} /> Nuevo parcial</button>
      </div>

      {parciales.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md2 bg-white py-16 shadow-card">
          <GraduationCap size={32} className="text-textSecondary/40" />
          <p className="text-sm text-textSecondary">Crea tu primer parcial para empezar a estudiar</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {parciales.map((p) => {
            const materia = materias.find((m) => m.id === p.materia_id);
            const dias = diasPara(p.fecha);
            return (
              <Link key={p.id} to={`/parciales/${p.id}`} className="rounded-md2 bg-white p-4 shadow-card transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-textPrimary">{p.titulo}</p>
                  <button onClick={(e) => borrar(p.id, e)} aria-label="Eliminar" className="shrink-0 text-textSecondary hover:text-danger"><Trash2 size={15} /></button>
                </div>
                {materia && <p className="mt-1 text-xs text-textSecondary">{materia.nombre}</p>}
                {p.fecha && (
                  <p className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${dias <= 2 ? 'text-danger' : dias <= 7 ? 'text-warning' : 'text-textSecondary'}`}>
                    <Calendar size={13} /> {formatearFechaCorta(p.fecha)} {dias >= 0 ? `· faltan ${dias} día${dias === 1 ? '' : 's'}` : '· ya pasó'}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
      {modal && <NuevoParcialModal materias={materias} onGuardar={crear} onCerrar={() => setModal(false)} />}
    </div>
  );
}
