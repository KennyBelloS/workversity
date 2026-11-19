import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { titularDelDia } from '../../lib/titular';
import { textoDuracion } from '../../lib/agenda';
import { propsPreview, previewDeEvento } from '../../lib/preview';

// ---------------------------------------------------------------------------------------------
// El parte del día. En vez de una rejilla de tarjetas, la portada del Dashboard está compuesta
// como la primera plana de un diario: una línea de cabecera en monoespaciada, un titular grande
// armado con tus datos, y tres columnas separadas por filetes. Sin cajas: lo que ordena la
// lectura es la tipografía y las reglas, no los bordes redondeados.
// ---------------------------------------------------------------------------------------------

const dosCifras = (n) => String(n).padStart(2, '0');

function Columna({ n, titulo, acc, children }) {
  return (
    <section className="pd-col">
      <header className="pd-col-cab">
        <span className="pd-col-n">{n}</span>
        <h3 className="pd-col-t">{titulo}</h3>
        {acc && <span className="pd-col-acc">{acc}</span>}
      </header>
      {children}
    </section>
  );
}

export default function ParteDelDia({
  ahora, fecha, semana, saludo, nombre, urgentes, siguientes, cifras, minutosOcupados, bloques, hoyEntregas, vencidas,
}) {
  const t = titularDelDia({
    vencidas, hoyEntregas, minutosOcupados, bloques,
    finDeSemana: ahora.getDay() === 0 || ahora.getDay() === 6,
  });

  return (
    <div className="pd">
      {/* Cabecera del parte: los datos de hoy en una sola línea, como el lomo de un periódico. */}
      <div className="pd-masthead">
        <span>{saludo}, {nombre}</span>
        <i />
        <span>{fecha}</span>
        <i />
        <span>Semana {semana}</span>
        <i />
        <span>{dosCifras(ahora.getHours())}:{dosCifras(ahora.getMinutes())}</span>
      </div>

      <h2 className="pd-titular">
        {t.titular} <em>{t.resaltado}</em> <span>{t.bajada}</span>
      </h2>

      <div className="pd-rejilla">
        <Columna n="01" titulo="Lo urgente" acc={urgentes.length ? `${urgentes.length}` : 'nada'}>
          {urgentes.length === 0 ? (
            <p className="pd-vacio">Tu lista está limpia.</p>
          ) : (
            <ol className="pd-lista">
              {urgentes.map((u, i) => (
                <li key={u.id}>
                  <Link to="/tareas" {...propsPreview('tarea', u.id)} className={`pd-item ${u.atrasada ? 'pd-item--tarde' : ''}`}>
                    <span className="pd-item-n">{dosCifras(i + 1)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="pd-item-t">{u.title}</span>
                      <span className="pd-item-m">
                        {u.atrasada ? `se pasó hace ${u.cuando}` : `vence en ${u.cuando}`}
                        {u.materia ? ` · ${u.materia}` : ''}
                      </span>
                    </span>
                    <ArrowUpRight size={13} className="pd-item-f" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Columna>

        <Columna n="02" titulo="Lo que viene" acc={siguientes.length ? 'hoy' : 'libre'}>
          {siguientes.length === 0 ? (
            <p className="pd-vacio">No queda nada agendado hoy.</p>
          ) : (
            <ol className="pd-lista">
              {siguientes.map((e) => (
                <li key={e.id}>
                  <Link to={e.origen === 'tarea' ? '/tareas' : '/horario'} {...previewDeEvento(e)} className="pd-item">
                    <span className="pd-item-h">{dosCifras(e.inicio.getHours())}:{dosCifras(e.inicio.getMinutes())}</span>
                    <span className="pd-raya" style={{ background: e.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="pd-item-t">{e.titulo}</span>
                      <span className="pd-item-m">
                        {e.inicio <= ahora ? `termina en ${textoDuracion(e.fin - ahora)}` : `en ${textoDuracion(e.inicio - ahora)}`}
                        {e.detalle ? ` · ${e.detalle}` : ''}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Columna>

        <Columna n="03" titulo="Tus cifras" acc="esta semana">
          <dl className="pd-cifras">
            {cifras.map((c) => (
              <div key={c.etiqueta} className={c.alerta ? 'pd-cifra pd-cifra--alerta' : 'pd-cifra'}>
                <dt>{c.etiqueta}</dt>
                <dd>
                  {c.to ? <Link to={c.to}>{c.valor}</Link> : c.valor}
                  {c.nota && <span>{c.nota}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </Columna>
      </div>
    </div>
  );
}
