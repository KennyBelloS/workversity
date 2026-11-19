import { useEffect, useState } from 'react';
import { Archive, RotateCcw, Trash2, GraduationCap, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listarSemestres, cerrarSemestre, restaurarSemestre, eliminarSemestre, nombreSugerido } from '../../services/semestres';

// ---------------------------------------------------------------------------------------------
// Cerrar semestre. El horario de un semestre no sirve para el siguiente, pero tirarlo a la
// basura tampoco: aquí se guarda completo antes de limpiar, y se puede volver a traer. Borrar
// un semestre guardado es una acción aparte, con confirmación, y nunca pasa sola.
// ---------------------------------------------------------------------------------------------

export default function SemestresCard() {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState({ disponible: true, semestres: [] });
  const [nombre, setNombre] = useState(nombreSugerido());
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    try { setEstado(await listarSemestres()); } catch (e) { setError(e.message); }
  };
  useEffect(() => { cargar(); }, []);

  const cerrar = async () => {
    const texto = nombre.trim() || nombreSugerido();
    if (!window.confirm(`Se va a guardar tu horario actual como «${texto}» y el horario quedará vacío para empezar de nuevo.\n\nNo se borra nada: vas a poder consultarlo y restaurarlo cuando quieras.`)) return;
    setOcupado(true); setError(''); setAviso('');
    try {
      const r = await cerrarSemestre({ nombre: texto, userId: usuario.id });
      setAviso(`Guardamos ${r.materias} materia(s) y ${r.bloques} bloque(s). Tu horario quedó en blanco.`);
      setNombre(nombreSugerido());
      await cargar();
    } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  };

  const restaurar = async (s) => {
    if (!window.confirm(`Se van a agregar a tu horario actual las materias y bloques de «${s.nombre}». Lo que ya tengas se queda.`)) return;
    setOcupado(true); setError(''); setAviso('');
    try {
      const r = await restaurarSemestre(s, usuario.id);
      setAviso(`Volvieron ${r.materias} materia(s) y ${r.bloques} bloque(s) de «${s.nombre}».`);
    } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  };

  const borrar = async (s) => {
    if (!window.confirm(`Esto borra para siempre el semestre guardado «${s.nombre}». No se puede deshacer. ¿Seguro?`)) return;
    setOcupado(true); setError(''); setAviso('');
    try { await eliminarSemestre(s.id); setAviso(`Se borró «${s.nombre}».`); await cargar(); }
    catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  };

  return (
    <div className="ficha">
      <div className="ficha-cabecera">
        <span className="rotulo"><Archive size={12} className="mr-1 inline" /> Semestres</span>
        {estado.semestres.length > 0 && <span className="franja-acc">{estado.semestres.length} guardado{estado.semestres.length > 1 ? 's' : ''}</span>}
      </div>

      <p className="text-t-pie leading-relaxed text-textSecondary">
        Cuando empiece un semestre nuevo, guarda el horario de este y empieza con la agenda en blanco.
        Las materias y los bloques quedan guardados aquí; tus tareas, notas y finanzas no se tocan.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          aria-label="Nombre del semestre que vas a cerrar"
          placeholder={nombreSugerido()}
          className="campo min-w-0 flex-1"
        />
        <button onClick={cerrar} disabled={ocupado || !estado.disponible} className="boton-ppal">
          <Archive size={15} /> Cerrar semestre
        </button>
      </div>

      {aviso && <p className="mt-2.5 text-t-pie text-success">{aviso}</p>}
      {error && <p className="mt-2.5 text-t-pie text-danger">{error}</p>}
      {!estado.disponible && (
        <p className="mt-2.5 text-t-pie text-warning">Falta correr el SQL nuevo de la base de datos para poder guardar semestres.</p>
      )}

      {estado.semestres.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-textPrimary/[.07] pt-3">
          {estado.semestres.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-[14px] bg-bg px-3.5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-t-base font-medium">{s.nombre}</span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-t-nota text-textSecondary">
                  <span><GraduationCap size={10} className="mr-1 inline align-[-1px]" />{s.resumen?.materias ?? 0} materias</span>
                  <span><Clock size={10} className="mr-1 inline align-[-1px]" />{s.resumen?.horas ?? 0} h semanales</span>
                  <span>{new Date(s.archivado).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>
              </span>
              <span className="flex shrink-0 gap-1.5">
                <button onClick={() => restaurar(s)} disabled={ocupado} className="boton-secundario !py-1.5 !text-t-micro" title="Volver a traer este horario">
                  <RotateCcw size={13} /> Restaurar
                </button>
                <button onClick={() => borrar(s)} disabled={ocupado} className="boton-secundario !py-1.5 !text-t-micro !text-danger" title="Borrar para siempre">
                  <Trash2 size={13} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
