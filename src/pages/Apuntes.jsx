import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NotebookPen, Plus, Star, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from '../hooks/useSyncEstado';
import { listarApuntes, crearApunte, actualizarApunte, eliminarApunte } from '../services/apuntes';
import { listarMaterias } from '../services/materias';
import { TIPOS_APUNTE, etiquetaTipo, colorTipo } from '../lib/apuntes';

const FILTROS = [{ id: 'todos', t: 'Todos' }, ...TIPOS_APUNTE];

export default function Apuntes() {
  const { usuario } = useAuth();
  const nav = useNavigate();
  const { version } = useSyncEstado();
  const [apuntes, setApuntes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [buscar, setBuscar] = useState('');

  const cargar = () => Promise.all([listarApuntes(), listarMaterias()]).then(([a, m]) => { setApuntes(a); setMaterias(m); });
  useEffect(() => { cargar(); }, [version]);

  const crear = async () => {
    const fila = await crearApunte({ titulo: 'Apunte sin título', tipo: filtro === 'todos' ? 'clase' : filtro, contenido: '', materia_id: null }, usuario.id);
    nav(`/apuntes/${fila.id}`);
  };
  const favorito = async (a, e) => { e.preventDefault(); await actualizarApunte(a.id, { favorito: !a.favorito }); cargar(); };
  const borrar = async (id, e) => { e.preventDefault(); if (window.confirm('¿Eliminar este apunte?')) { await eliminarApunte(id); cargar(); } };

  const filtrados = useMemo(() => apuntes
    .filter((a) => filtro === 'todos' || a.tipo === filtro)
    .filter((a) => !buscar.trim() || `${a.titulo} ${a.contenido}`.toLowerCase().includes(buscar.toLowerCase()))
    .sort((a, b) => Number(b.favorito) - Number(a.favorito) || new Date(b.updated_at) - new Date(a.updated_at)), [apuntes, filtro, buscar]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-textSecondary">Tu cuaderno digital: apuntes de clase, de tareas o de proyectos, con mapas mentales y conceptuales.</p>
        <button onClick={crear} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white"><Plus size={18} /> Nuevo apunte</button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar en tus apuntes…" className="w-full rounded-full bg-white py-2 pl-8 pr-3 text-sm shadow-card outline-none" aria-label="Buscar apuntes" />
        </div>
        {FILTROS.map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filtro === f.id ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}>{f.t}</button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md2 bg-white py-16 shadow-card">
          <NotebookPen size={32} className="text-textSecondary/40" />
          <p className="text-sm text-textSecondary">{apuntes.length === 0 ? 'Crea tu primer apunte para empezar' : 'Nada por aquí con ese filtro'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((a) => {
            const materia = materias.find((m) => m.id === a.materia_id);
            return (
              <Link key={a.id} to={`/apuntes/${a.id}`} className="rounded-md2 bg-white p-4 shadow-card transition hover:shadow-md">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white" style={{ backgroundColor: colorTipo(a.tipo) }}>{etiquetaTipo(a.tipo)}</span>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={(e) => favorito(a, e)} aria-label="Favorito" className={a.favorito ? 'text-warning' : 'text-textSecondary/40 hover:text-warning'}><Star size={15} fill={a.favorito ? 'currentColor' : 'none'} /></button>
                    <button onClick={(e) => borrar(a.id, e)} aria-label="Eliminar" className="text-textSecondary/40 hover:text-danger"><Trash2 size={15} /></button>
                  </div>
                </div>
                <p className="truncate font-bold text-textPrimary">{a.titulo || 'Sin título'}</p>
                {materia && <p className="text-xs text-textSecondary">{materia.nombre}</p>}
                <p className="mt-1.5 line-clamp-2 text-xs text-textSecondary">{a.contenido?.replace(/[#*`-]/g, '').slice(0, 120) || 'Vacío por ahora.'}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
