import { useState } from 'react';
import { Sun, Moon, Monitor, Palette, Type } from 'lucide-react';
import { useTema, elegirTema, elegirAcento, elegirTexto } from '../../hooks/useTema';
import { ACENTOS, TAMANOS_TEXTO, leerAcento, leerTexto } from '../../lib/acento';

const OPCIONES = [
  { valor: 'claro', etiqueta: 'Claro', icono: Sun },
  { valor: 'oscuro', etiqueta: 'Oscuro', icono: Moon },
  { valor: 'sistema', etiqueta: 'Sistema', icono: Monitor },
];

export default function AparienciaCard() {
  const { preferencia, oscuro } = useTema();
  const [acento, setAcento] = useState(leerAcento);
  const [texto, setTexto] = useState(leerTexto);
  const boton = (sel) => `rounded-sm2 border py-2.5 text-xs font-bold transition ${sel ? 'border-primary bg-primarySoft text-primary' : 'border-black/10 text-textSecondary'}`;
  return (
    <section className="rounded-md2 bg-white p-4 shadow-card">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold"><Moon size={16} /> Apariencia</p>
      <div className="grid grid-cols-3 gap-2">
        {OPCIONES.map(({ valor, etiqueta, icono: Icono }) => (
          <button key={valor} onClick={() => elegirTema(valor)} className={`flex flex-col items-center gap-1.5 py-3 ${boton(preferencia === valor)}`}><Icono size={18} /> {etiqueta}</button>
        ))}
      </div>

      <p className="mb-2 mt-4 flex items-center gap-2 text-xs font-bold text-textSecondary"><Palette size={14} /> Color de acento</p>
      <div className="flex flex-wrap gap-2.5">
        {Object.entries(ACENTOS).map(([k, a]) => {
          const c = `rgb(${a[oscuro ? 'oscuro' : 'claro'].primary})`;
          return <button key={k} onClick={() => { elegirAcento(k); setAcento(k); }} aria-label={`Acento ${a.nombre}`} aria-pressed={acento === k} title={a.nombre} className="h-9 w-9 rounded-full transition" style={{ backgroundColor: c, outline: acento === k ? `3px solid ${c}` : 'none', outlineOffset: 3 }} />;
        })}
      </div>

      <p className="mb-2 mt-4 flex items-center gap-2 text-xs font-bold text-textSecondary"><Type size={14} /> Tamaño del texto</p>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(TAMANOS_TEXTO).map(([k, t]) => <button key={k} onClick={() => { elegirTexto(k); setTexto(k); }} aria-pressed={texto === k} className={boton(texto === k)}>{t.etiqueta}</button>)}
      </div>
    </section>
  );
}
