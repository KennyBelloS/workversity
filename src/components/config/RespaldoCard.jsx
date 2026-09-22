import { useRef, useState } from 'react';
import { Download, Upload, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leerTabla } from '../../offline/db';
import { vaciarCola } from '../../offline/sync';
import { nuevoId } from '../../offline/repositorio';
import { VERSION } from '../../version';
import { crearRespaldo, prepararRestauracion, TABLAS_RESPALDO } from '../../lib/respaldo';
import { listarMaterias, crearMateria } from '../../services/materias';
import { listarTareas, crearTarea } from '../../services/tareas';
import { listarBloques, crearBloque } from '../../services/horario';
import { listarMovimientos, crearMovimiento, listarMetas, crearMeta, listarPresupuestos, crearPresupuesto } from '../../services/finanzas';
import { listarEvaluaciones, crearEvaluacion } from '../../services/notas';
import { listarCortes, crearCortes } from '../../services/cortes';
import { listarCategoriasAhorro, crearCategoriaAhorro } from '../../services/categoriasAhorro';
import { listarAvances, crearAvance } from '../../services/avances';
import { listarDocumentos, crearDocumento } from '../../services/documentos';

const LISTAR = {
  materias: listarMaterias, cortes_notas: listarCortes, evaluaciones: listarEvaluaciones, tareas: listarTareas, documentos_tarea: async () => (await listarDocumentos()).lista, bloques_horario: listarBloques,
  categorias_ahorro: async () => (await listarCategoriasAhorro()).lista, metas: listarMetas, avances_meta: async () => (await listarAvances()).lista, movimientos: listarMovimientos, presupuestos_mensuales: listarPresupuestos,
};
const CREAR = {
  materias: crearMateria, cortes_notas: crearCortes, evaluaciones: crearEvaluacion, tareas: crearTarea, documentos_tarea: crearDocumento, bloques_horario: crearBloque,
  categorias_ahorro: crearCategoriaAhorro, metas: crearMeta, avances_meta: crearAvance, movimientos: crearMovimiento, presupuestos_mensuales: crearPresupuesto,
};
const ROTULO = { materias: 'materias', cortes_notas: 'pesos de cortes', evaluaciones: 'actividades de notas', tareas: 'tareas', documentos_tarea: 'documentos de tareas', bloques_horario: 'bloques de horario', categorias_ahorro: 'categorías de ahorro', metas: 'metas', avances_meta: 'avances de metas', movimientos: 'movimientos', presupuestos_mensuales: 'presupuestos' };

export default function RespaldoCard() {
  const { usuario } = useAuth();
  const entrada = useRef(null);
  const [trabajando, setTrabajando] = useState(false);
  const [vista, setVista] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const descargar = async () => {
    setTrabajando(true); setError(''); setMensaje('');
    try {
      const tablas = {};
      for (const t of TABLAS_RESPALDO) { try { tablas[t] = await LISTAR[t](); } catch { tablas[t] = []; } }
      const url = URL.createObjectURL(new Blob([JSON.stringify(crearRespaldo({ usuarioId: usuario.id, version: VERSION, tablas }), null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = `workversity_respaldo_${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      setMensaje('✅ Copia descargada. Guárdala en un lugar seguro.');
    } catch (e) { setError(e.message || 'No se pudo generar la copia'); } finally { setTrabajando(false); }
  };

  const elegirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError(''); setMensaje(''); setVista(null);
    let json;
    try { json = JSON.parse(await archivo.text()); } catch { return setError('El archivo no se pudo leer: no parece un .json válido.'); }
    const ids = new Set();
    for (const t of TABLAS_RESPALDO) (await leerTabla(t)).forEach((r) => ids.add(r.id));
    const prep = prepararRestauracion({ respaldo: json, usuarioId: usuario.id, idsExistentes: ids, nuevoId });
    if (!prep.ok) return setError(prep.error);
    setVista({ nombre: archivo.name, prep });
  };

  const restaurar = async () => {
    setTrabajando(true); setError('');
    try {
      for (const { tabla, fila } of vista.prep.operaciones) await CREAR[tabla](fila, usuario.id);
      await vaciarCola();
      setMensaje(`✅ Se restauraron ${vista.prep.operaciones.length} registros.`);
      setVista(null);
    } catch (e) { setError(e.message || 'No se pudo restaurar'); } finally { setTrabajando(false); }
  };

  return (
    <section className="rounded-md2 bg-white p-4 shadow-card">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold"><ShieldCheck size={16} /> Copia de seguridad</p>
      <p className="mb-3 text-xs text-textSecondary">Descarga todos tus datos en un archivo, o restáuralos desde una copia (sirve para pasar tus datos a otra cuenta o recuperarlos). Restaurar no borra nada: solo agrega o actualiza.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button onClick={descargar} disabled={trabajando} className="flex items-center justify-center gap-2 rounded-sm2 border border-primary/30 py-2.5 text-sm font-bold text-primary disabled:opacity-60"><Download size={15} /> {trabajando && !vista ? 'Generando…' : 'Descargar copia'}</button>
        <button onClick={() => entrada.current?.click()} disabled={trabajando} className="flex items-center justify-center gap-2 rounded-sm2 border border-black/10 py-2.5 text-sm font-bold text-textSecondary disabled:opacity-60"><Upload size={15} /> Restaurar copia</button>
        <input ref={entrada} type="file" accept="application/json,.json" className="hidden" onChange={elegirArchivo} aria-label="Archivo de copia" />
      </div>
      {vista && (
        <div className="mt-3 rounded-sm2 bg-primarySoft/50 p-3 text-xs">
          <p className="font-extrabold">{vista.nombre}</p>
          <ul className="mt-1 space-y-0.5 text-textSecondary">{Object.entries(vista.prep.resumen).filter(([, n]) => n > 0).map(([t, n]) => <li key={t}>• {n} {ROTULO[t]}</li>)}</ul>
          {vista.prep.remapeado && <p className="mt-2 font-semibold text-textSecondary">Estos datos son de otra cuenta: se agregarán como registros nuevos.</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={restaurar} disabled={trabajando} className="flex-1 rounded-sm2 bg-primary py-2 text-xs font-bold text-white disabled:opacity-60">{trabajando ? 'Restaurando…' : 'Restaurar ahora'}</button>
            <button onClick={() => setVista(null)} className="rounded-sm2 px-3 text-xs font-bold text-textSecondary">Cancelar</button>
          </div>
        </div>
      )}
      {mensaje && <p className="mt-2 text-xs font-semibold text-success">{mensaje}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
    </section>
  );
}
