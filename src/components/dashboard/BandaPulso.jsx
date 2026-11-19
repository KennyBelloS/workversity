import { Link } from 'react-router-dom';
import { useContador } from './Bento';

// ---------------------------------------------------------------------------------------------
// Banda de pulso (referencia: la app de tiempo de uso, con la cifra enorme y un gráfico de
// barras diminuto debajo). Tres cifras de la semana, cada una con sus siete días en barras y
// la comparación con la semana pasada. Separadas por filetes, sin tarjetas.
// ---------------------------------------------------------------------------------------------

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function Barras({ serie, hoy }) {
  const max = Math.max(1, ...serie);
  return (
    <span className="pulso-barras" aria-hidden="true">
      {serie.map((v, i) => (
        <span key={i} className={`pulso-barra ${i === hoy ? 'pulso-barra--hoy' : ''}`} style={{ '--h': `${(v / max) * 100}%`, '--i': i }}>
          <i />
          <b>{DIAS[i]}</b>
        </span>
      ))}
    </span>
  );
}

function Cifra({ etiqueta, valor, unidad, serie, hoy, nota, to, i }) {
  const v = useContador(valor, 150 + i * 120);
  return (
    <Link to={to} className="pulso-col">
      <span className="rotulo">{etiqueta}</span>
      <span className="pulso-n">
        {Math.round(v).toLocaleString('es-CO')}
        {unidad && <span className="pulso-u">{unidad}</span>}
      </span>
      <Barras serie={serie} hoy={hoy} />
      {nota && <span className="pulso-nota">{nota}</span>}
    </Link>
  );
}

/**
 * @param {number[]} o.hechas    Tareas completadas por día (lunes→domingo).
 * @param {number[]} o.enfoque   Minutos de enfoque por día.
 * @param {number[]} o.clases    Bloques de clase o trabajo por día.
 */
export default function BandaPulso({ hechas, enfoque, clases, hoy }) {
  const suma = (a) => a.reduce((s, x) => s + x, 0);
  const minutos = suma(enfoque);
  return (
    <div className="pulso">
      <Cifra
        i={0} etiqueta="Completadas" valor={suma(hechas)} serie={hechas} hoy={hoy} to="/tareas"
        nota={hechas[hoy] ? `${hechas[hoy]} hoy` : 'ninguna hoy'}
      />
      <Cifra
        i={1} etiqueta="Enfoque" valor={minutos >= 60 ? Math.round(minutos / 6) / 10 : minutos} unidad={minutos >= 60 ? ' h' : ' min'}
        serie={enfoque} hoy={hoy} to="/analitica"
        nota={enfoque[hoy] ? `${enfoque[hoy]} min hoy` : 'sin Pomodoros hoy'}
      />
      <Cifra
        i={2} etiqueta="En clase y trabajo" valor={suma(clases)} unidad=" bloques" serie={clases} hoy={hoy} to="/horario"
        nota={clases[hoy] ? `${clases[hoy]} hoy` : 'día libre'}
      />
    </div>
  );
}
