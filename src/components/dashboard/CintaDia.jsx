import { Link } from 'react-router-dom';
import { previewDeEvento } from '../../lib/preview';
import { textoDuracion } from '../../lib/agenda';

// ---------------------------------------------------------------------------------------------
// Cinta del día: la jornada entera (06:00 → 22:00) en una sola regla, con cada clase, reunión o
// entrega puesta en su hora y una marca que avanza con el reloj. Es la primera lectura del
// Dashboard: de un vistazo se ve qué tan lleno está el día y dónde quedan los huecos.
// ---------------------------------------------------------------------------------------------

const H0 = 6;
const H1 = 22;
const pos = (f) => {
  const h = f.getHours() + f.getMinutes() / 60;
  return Math.max(0, Math.min(1, (h - H0) / (H1 - H0)));
};
const dosCifras = (n) => String(n).padStart(2, '0');

export default function CintaDia({ ahora, eventos = [] }) {
  const ahoraF = pos(ahora);
  const todos = eventos
    .filter((e) => e.inicio && e.fin)
    .map((e) => {
      const a = pos(e.inicio);
      const b = Math.max(a + 0.012, pos(e.fin));
      return { ...e, a, ancho: b - a, pasado: e.origen === 'tarea' ? e.hecha : e.fin <= ahora };
    })
    .sort((x, y) => x.a - y.a);
  // Las clases y turnos ocupan un rato (barras); las entregas son un instante (rombos).
  const bloques = todos.filter((e) => e.origen !== 'tarea');
  const entregas = todos.filter((e) => e.origen === 'tarea');
  const ocupado = bloques.reduce((s, e) => s + Math.max(0, e.fin - e.inicio), 0);
  const resumen = [
    bloques.length ? `${bloques.length} bloque${bloques.length > 1 ? 's' : ''} · ${textoDuracion(ocupado)}` : null,
    entregas.length ? `${entregas.length} entrega${entregas.length > 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' · ');
  const horas = [6, 8, 10, 12, 14, 16, 18, 20, 22];

  return (
    <div className="cinta" data-arana>
      <div className="cinta-cabecera">
        <span className="rotulo">La jornada</span>
        <span className="franja-acc">
          {todos.length ? resumen : 'día libre'}
        </span>
      </div>

      <div className="cinta-pista">
        {horas.map((h) => (
          <span key={h} className="cinta-marca" style={{ left: `${((h - H0) / (H1 - H0)) * 100}%` }} aria-hidden="true" />
        ))}
        {bloques.map((e) => (
          <Link
            key={e.id}
            to="/horario"
            {...previewDeEvento(e)}
            className={`cinta-bloque ${e.pasado ? 'cinta-bloque--pasado' : ''}`}
            style={{ left: `${e.a * 100}%`, width: `${e.ancho * 100}%`, '--c': e.color }}
          >
            <span className="cinta-bloque-txt">{e.titulo}</span>
          </Link>
        ))}
        {entregas.map((e) => (
          <Link
            key={e.id}
            to="/tareas"
            {...previewDeEvento(e)}
            aria-label={`Entrega: ${e.titulo}`}
            className={`cinta-entrega ${e.pasado ? 'cinta-entrega--hecha' : ''}`}
            style={{ left: `${e.a * 100}%`, '--c': e.color }}
          />
        ))}
        {ahoraF > 0 && ahoraF < 1 && (
          <span className="cinta-ahora" style={{ left: `${ahoraF * 100}%` }}>
            <i />
            <b>{dosCifras(ahora.getHours())}:{dosCifras(ahora.getMinutes())}</b>
          </span>
        )}
      </div>

      <div className="cinta-pie">
        {horas.map((h) => <span key={h} style={{ left: `${((h - H0) / (H1 - H0)) * 100}%` }}>{dosCifras(h)}</span>)}
      </div>
    </div>
  );
}
