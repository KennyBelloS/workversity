import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';

/** Lista editable de tarjetas: agregar una a mano, editar o borrar las generadas. */
export default function ListaTarjetas({ tarjetas, onCrear, onActualizar, onEliminar }) {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [editando, setEditando] = useState(null);

  const agregar = () => {
    if (!pregunta.trim() || !respuesta.trim()) return;
    onCrear({ pregunta: pregunta.trim(), respuesta: respuesta.trim() });
    setPregunta(''); setRespuesta('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-md2 bg-white p-3 shadow-card sm:flex-row">
        <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Pregunta (ej: ¿Qué es la mitosis?)" className="flex-1 rounded-sm2 bg-bg px-3 py-2 text-sm outline-none" aria-label="Nueva pregunta" />
        <input value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Respuesta" className="flex-1 rounded-sm2 bg-bg px-3 py-2 text-sm outline-none" aria-label="Nueva respuesta" />
        <button onClick={agregar} disabled={!pregunta.trim() || !respuesta.trim()} className="flex items-center justify-center gap-1 rounded-sm2 bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Plus size={14} /> Agregar</button>
      </div>
      {tarjetas.length === 0 ? (
        <p className="rounded-md2 bg-white py-8 text-center text-sm text-textSecondary shadow-card">Aún no hay tarjetas. Genera algunas desde una fuente o agrégalas aquí a mano.</p>
      ) : (
        <div className="space-y-2">
          {tarjetas.map((t) => (
            <div key={t.id} className="rounded-sm2 bg-white p-3 shadow-card">
              {editando === t.id ? (
                <div className="space-y-2">
                  <input defaultValue={t.pregunta} onBlur={(e) => onActualizar(t.id, { pregunta: e.target.value })} className="w-full rounded-sm2 bg-bg px-2.5 py-1.5 text-sm outline-none" aria-label="Editar pregunta" />
                  <input defaultValue={t.respuesta} onBlur={(e) => onActualizar(t.id, { respuesta: e.target.value })} className="w-full rounded-sm2 bg-bg px-2.5 py-1.5 text-sm outline-none" aria-label="Editar respuesta" />
                  <button onClick={() => setEditando(null)} className="text-xs font-bold text-primary">Listo</button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="text-sm font-bold leading-snug">{t.pregunta}</p><p className="text-xs leading-snug text-textSecondary">{t.respuesta}</p></div>
                  <div className="flex shrink-0 gap-1 self-start pt-0.5">
                    <button onClick={() => setEditando(t.id)} aria-label="Editar" className="rounded p-1 text-textSecondary hover:text-primary"><Pencil size={14} /></button>
                    <button onClick={() => onEliminar(t.id)} aria-label="Eliminar" className="rounded p-1 text-textSecondary hover:text-danger"><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
