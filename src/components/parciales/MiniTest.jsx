import { useMemo, useState } from 'react';
import { generarPreguntas, calificarTest } from '../../lib/parciales';

/** Test de opción múltiple. `cuantas` más grande + `titulo` distinto se usa también para la simulación de examen. */
export default function MiniTest({ tarjetas, cuantas, titulo = 'Mini test', cronometro = false, onTerminar }) {
  const preguntas = useMemo(() => generarPreguntas(tarjetas, { cuantas }), [tarjetas, cuantas]);
  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);
  // Se congela el examen exacto que se respondió: si mientras se ven los resultados los datos
  // de fondo cambian (p. ej. al guardar el resultado se vuelve a cargar todo), no debe
  // regenerarse el test a medio camino y desincronizarse de lo que ya se calificó.
  const [preguntasRespondidas, setPreguntasRespondidas] = useState(null);
  const [inicio] = useState(() => Date.now());

  if (tarjetas.length < 2) return <p className="rounded-md2 bg-white py-10 text-center text-sm text-textSecondary shadow-card">Necesitas al menos 2 tarjetas para generar un test.</p>;

  const terminar = () => {
    const r = calificarTest(preguntas, respuestas);
    setPreguntasRespondidas(preguntas);
    setResultado(r);
    onTerminar?.(r, Math.round((Date.now() - inicio) / 1000));
  };

  if (resultado) {
    return (
      <div className="rounded-md2 bg-white p-5 text-center shadow-card">
        <p className="text-3xl font-extrabold" style={{ color: resultado.porcentaje >= 60 ? '#17C964' : '#E5484D' }}>{resultado.porcentaje}%</p>
        <p className="mb-4 text-sm text-textSecondary">{resultado.aciertos} de {resultado.total} correctas</p>
        <div className="space-y-2 text-left">
          {preguntasRespondidas.map((p) => {
            const d = resultado.detalle.find((x) => x.id === p.id);
            if (!d) return null;
            return (
              <div key={p.id} className={`rounded-sm2 p-2.5 text-xs ${d.correcta ? 'bg-successSoft' : 'bg-dangerSoft'}`}>
                <p className="font-bold">{p.pregunta}</p>
                <p>{d.correcta ? '✔' : '✘'} {d.elegida || 'Sin responder'}{!d.correcta && ` · era: ${p.correcta}`}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-extrabold">{titulo} · {preguntas.length} preguntas{cronometro && ' · cronometrado'}</p>
      {preguntas.map((p, i) => (
        <div key={p.id} className="rounded-md2 bg-white p-4 shadow-card">
          <p className="mb-2 text-sm font-bold">{i + 1}. {p.pregunta}</p>
          <div className="space-y-1.5">
            {p.opciones.map((op) => (
              <label key={op} className={`flex cursor-pointer items-center gap-2 rounded-sm2 border p-2 text-sm ${respuestas[p.id] === op ? 'border-primary bg-primarySoft/60' : 'border-black/10'}`}>
                <input type="radio" name={p.id} className="accent-primary" checked={respuestas[p.id] === op} onChange={() => setRespuestas((r) => ({ ...r, [p.id]: op }))} /> {op}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={terminar} disabled={Object.keys(respuestas).length < preguntas.length} className="w-full rounded-sm2 bg-primary py-3 text-sm font-bold text-white disabled:opacity-50">Ver resultado ({Object.keys(respuestas).length}/{preguntas.length})</button>
    </div>
  );
}
