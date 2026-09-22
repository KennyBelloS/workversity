import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Layers, ListChecks, Timer, Network, Lightbulb, FolderPlus, Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listarParciales, listarFuentes, crearFuente, eliminarFuente, listarTarjetas, crearTarjeta, actualizarTarjeta, eliminarTarjeta, listarResultados, crearResultado } from '../services/parciales';
import { generarTarjetas, combinarTarjetas, dominioGeneral, ordenarParaRepasar } from '../lib/parciales';
import SubirFuente from '../components/parciales/SubirFuente';
import ListaTarjetas from '../components/parciales/ListaTarjetas';
import EstudiarTarjetas from '../components/parciales/EstudiarTarjetas';
import MiniTest from '../components/parciales/MiniTest';
import MapasYDiagramas from '../components/parciales/MapasYDiagramas';
import ConsejosParcial from '../components/parciales/ConsejosParcial';

const PESTANAS = [
  { id: 'fuentes', t: 'Fuentes', icono: FolderPlus },
  { id: 'tarjetas', t: 'Tarjetas', icono: Layers },
  { id: 'test', t: 'Mini test', icono: ListChecks },
  { id: 'simulacro', t: 'Simulación', icono: Timer },
  { id: 'mapas', t: 'Mapas y diagramas', icono: Network },
  { id: 'consejos', t: 'Consejos', icono: Lightbulb },
];

export default function Parcial() {
  const { id } = useParams();
  const nav = useNavigate();
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = PESTANAS.some((p) => p.id === params.get('tab')) ? params.get('tab') : 'fuentes';

  const [parcial, setParcial] = useState(null);
  const [fuentes, setFuentes] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [progreso, setProgreso] = useState({});

  const cargar = async () => {
    const [parciales, f, t, r] = await Promise.all([listarParciales(), listarFuentes(), listarTarjetas(), listarResultados()]);
    const p = parciales.find((x) => x.id === id);
    if (!p) return nav('/parciales');
    setParcial(p);
    setFuentes(f.filter((x) => x.parcial_id === id));
    const propias = t.filter((x) => x.parcial_id === id);
    setTarjetas(propias);
    setProgreso(Object.fromEntries(propias.map((x) => [x.id, { nivel: x.nivel, racha: x.racha }])));
    setResultados(r.filter((x) => x.parcial_id === id));
  };
  useEffect(() => { cargar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const irA = (t) => setParams({ tab: t });

  const agregarFuente = async ({ nombre, texto }) => {
    await crearFuente({ parcial_id: id, nombre, texto }, usuario.id);
    const generadas = generarTarjetas(texto);
    for (const g of combinarTarjetas([tarjetas.map((t) => ({ pregunta: t.pregunta, respuesta: t.respuesta })), generadas]).filter((g) => !tarjetas.some((t) => t.pregunta.toLowerCase() === g.pregunta.toLowerCase()))) {
      await crearTarjeta({ parcial_id: id, pregunta: g.pregunta, respuesta: g.respuesta }, usuario.id);
    }
    await cargar();
    irA('tarjetas');
  };
  const borrarFuente = async (fid) => { await eliminarFuente(fid); await cargar(); };

  const crearTarjetaManual = async (datos) => { await crearTarjeta({ parcial_id: id, ...datos }, usuario.id); await cargar(); };
  const actualizarTarjetaManual = async (tid, cambios) => { await actualizarTarjeta(tid, cambios); await cargar(); };
  const borrarTarjeta = async (tid) => { await eliminarTarjeta(tid); await cargar(); };

  const marcarResultadoTarjeta = async (tid, acertaste) => {
    const actual = progreso[tid]?.nivel || 0;
    const nivel = acertaste ? Math.min(4, actual + 1) : 0;
    setProgreso((p) => ({ ...p, [tid]: { nivel, racha: acertaste ? (p[tid]?.racha || 0) + 1 : 0 } }));
    await actualizarTarjeta(tid, { nivel, racha: acertaste ? (progreso[tid]?.racha || 0) + 1 : 0, visto_el: new Date().toISOString() });
  };

  const guardarResultado = async (tipo, resultado) => {
    await crearResultado({ parcial_id: id, tipo, aciertos: resultado.aciertos, total: resultado.total, porcentaje: resultado.porcentaje }, usuario.id);
    await cargar();
  };

  const textoCombinado = useMemo(() => fuentes.map((f) => f.texto).join('\n\n'), [fuentes]);
  const dominio = tarjetas.length ? dominioGeneral(tarjetas, progreso) : null;
  const tarjetasDificiles = useMemo(() => ordenarParaRepasar(tarjetas, progreso).slice(0, 3), [tarjetas, progreso]);
  const diasRestantes = parcial?.fecha ? Math.ceil((new Date(`${parcial.fecha}T23:59:59`) - new Date()) / 86400000) : null;
  const ultimoPorcentaje = resultados[0]?.porcentaje ?? null;

  if (!parcial) return <p className="py-10 text-center text-sm text-textSecondary">Cargando…</p>;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2"><Sparkles size={16} className="text-primary" /><h1 className="text-lg font-extrabold">{parcial.titulo}</h1></div>
      <p className="mb-4 text-xs text-textSecondary">{tarjetas.length} tarjeta{tarjetas.length === 1 ? '' : 's'} · {diasRestantes != null ? (diasRestantes >= 0 ? `faltan ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}` : 'ya pasó') : 'sin fecha'}</p>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {PESTANAS.map((p) => (
          <button key={p.id} onClick={() => irA(p.id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${tab === p.id ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}>
            <p.icono size={13} /> {p.t}
          </button>
        ))}
      </div>

      {tab === 'fuentes' && (
        <div className="space-y-3">
          <SubirFuente onExtraido={agregarFuente} />
          {fuentes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-textSecondary">Fuentes agregadas</p>
              {fuentes.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-2 rounded-sm2 bg-white p-2.5 shadow-card">
                  <span className="min-w-0 truncate text-sm">{f.nombre}</span>
                  <button onClick={() => borrarFuente(f.id)} aria-label="Eliminar fuente" className="shrink-0 text-textSecondary hover:text-danger"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === 'tarjetas' && <EstudiarTarjetasConLista tarjetas={tarjetas} progreso={progreso} onResultado={marcarResultadoTarjeta} onCrear={crearTarjetaManual} onActualizar={actualizarTarjetaManual} onEliminar={borrarTarjeta} />}
      {tab === 'test' && <MiniTest tarjetas={tarjetas} cuantas={Math.min(8, tarjetas.length)} titulo="Mini test" onTerminar={(r) => guardarResultado('test', r)} />}
      {tab === 'simulacro' && <MiniTest key={`sim-${resultados.length}`} tarjetas={tarjetas} cuantas={tarjetas.length} titulo="Simulación de parcial" cronometro onTerminar={(r) => guardarResultado('simulacro', r)} />}
      {tab === 'mapas' && <MapasYDiagramas texto={textoCombinado} titulo={parcial.titulo} />}
      {tab === 'consejos' && <ConsejosParcial diasRestantes={diasRestantes} dominio={dominio} tarjetasDificiles={tarjetasDificiles} ultimoPorcentaje={ultimoPorcentaje} />}
    </div>
  );
}

function EstudiarTarjetasConLista({ tarjetas, progreso, onResultado, onCrear, onActualizar, onEliminar }) {
  const [vista, setVista] = useState('estudiar');
  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button onClick={() => setVista('estudiar')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${vista === 'estudiar' ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}>Estudiar</button>
        <button onClick={() => setVista('lista')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${vista === 'lista' ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}>Ver y editar ({tarjetas.length})</button>
      </div>
      {vista === 'estudiar'
        ? <EstudiarTarjetas tarjetas={tarjetas} progreso={progreso} onResultado={onResultado} />
        : <ListaTarjetas tarjetas={tarjetas} onCrear={onCrear} onActualizar={onActualizar} onEliminar={onEliminar} />}
    </div>
  );
}
