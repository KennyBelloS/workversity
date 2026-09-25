import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PenLine, Network, Share2, Star, Trash2, GraduationCap } from 'lucide-react';
import { listarApuntes, actualizarApunte, eliminarApunte } from '../services/apuntes';
import { listarMaterias } from '../services/materias';
import { TIPOS_APUNTE, colorTipo } from '../lib/apuntes';
import EditorApunte from '../components/apuntes/EditorApunte';
import LienzoMental from '../components/apuntes/LienzoMental';
import MapasYDiagramas from '../components/parciales/MapasYDiagramas';
import UsarParaParcial from '../components/apuntes/UsarParaParcial';

const PESTANAS = [
  { id: 'escribir', t: 'Escribir', icono: PenLine },
  { id: 'mental', t: 'Mapa mental', icono: Share2 },
  { id: 'mapas', t: 'Mapas y diagramas', icono: Network },
];

export default function Apunte() {
  const { id } = useParams();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = PESTANAS.some((p) => p.id === params.get('tab')) ? params.get('tab') : 'escribir';

  const [apunte, setApunte] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [guardado, setGuardado] = useState(true);
  const [modalParcial, setModalParcial] = useState(false);
  const temporizador = useRef(null);

  useEffect(() => {
    Promise.all([listarApuntes(), listarMaterias()]).then(([apuntes, m]) => {
      const a = apuntes.find((x) => x.id === id);
      if (!a) return nav('/apuntes');
      setApunte(a);
      setMaterias(m);
    });
  }, [id, nav]);

  const pendientes = useRef({});
  const guardar = (cambios) => {
    setApunte((a) => ({ ...a, ...cambios }));
    setGuardado(false);
    // Si se editan varios campos seguidos (título, luego contenido…) antes de que pase el
    // tiempo de espera, no se debe perder ninguno: se acumulan y se envían todos juntos.
    pendientes.current = { ...pendientes.current, ...cambios };
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      const aEnviar = pendientes.current;
      pendientes.current = {};
      await actualizarApunte(id, aEnviar);
      setGuardado(true);
    }, 600);
  };
  useEffect(() => {
    const flush = () => { clearTimeout(temporizador.current); if (Object.keys(pendientes.current).length > 0) { actualizarApunte(id, pendientes.current); pendientes.current = {}; } };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); flush(); };
  }, [id]);

  const borrar = async () => { if (window.confirm('¿Eliminar este apunte?')) { await eliminarApunte(id); nav('/apuntes'); } };

  if (!apunte) return <p className="py-10 text-center text-sm text-textSecondary">Cargando…</p>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <input value={apunte.titulo} onChange={(e) => guardar({ titulo: e.target.value })} placeholder="Título del apunte" className="min-w-0 flex-1 bg-transparent text-lg font-extrabold outline-none" aria-label="Título del apunte" />
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden text-[11px] text-textSecondary sm:inline">{guardado ? 'Guardado' : 'Guardando…'}</span>
          <button onClick={() => guardar({ favorito: !apunte.favorito })} aria-label="Favorito" className={apunte.favorito ? 'text-warning' : 'text-textSecondary/40 hover:text-warning'}><Star size={18} fill={apunte.favorito ? 'currentColor' : 'none'} /></button>
          <button onClick={borrar} aria-label="Eliminar apunte" className="text-textSecondary/40 hover:text-danger"><Trash2 size={18} /></button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TIPOS_APUNTE.map((t) => (
          <button key={t.id} onClick={() => guardar({ tipo: t.id })} className="rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: colorTipo(t.id), opacity: apunte.tipo === t.id ? 1 : 0.35 }}>{t.t}</button>
        ))}
        <select value={apunte.materia_id || ''} onChange={(e) => guardar({ materia_id: e.target.value || null })} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-textSecondary shadow-card outline-none" aria-label="Materia del apunte">
          <option value="">Sin materia</option>
          {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <button onClick={() => setModalParcial(true)} className="ml-auto flex items-center gap-1.5 rounded-full bg-primarySoft px-3 py-1.5 text-xs font-bold text-primary"><GraduationCap size={13} /> Usar para un parcial</button>
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {PESTANAS.map((p) => (
          <button key={p.id} onClick={() => setParams({ tab: p.id })} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${tab === p.id ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}>
            <p.icono size={13} /> {p.t}
          </button>
        ))}
      </div>

      {tab === 'escribir' && <EditorApunte contenido={apunte.contenido} onCambiar={(contenido) => guardar({ contenido })} />}
      {tab === 'mental' && <LienzoMental nodos={apunte.mapa_mental} onCambiar={(mapa_mental) => guardar({ mapa_mental })} texto={apunte.contenido} titulo={apunte.titulo} />}
      {tab === 'mapas' && <MapasYDiagramas texto={apunte.contenido} titulo={apunte.titulo} />}

      {modalParcial && <UsarParaParcial apunte={apunte} onCerrar={() => setModalParcial(false)} />}
    </div>
  );
}
