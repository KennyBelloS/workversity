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
  const boton = (sel) => `rounded-[12px] py-2.5 text-t-pie transition ${sel ? 'bg-textPrimary font-medium text-surface' : 'text-textSecondary hover:bg-textPrimary/[.05]'} ${sel ? '' : 'shadow-[inset_0_0_0_1px_rgb(var(--linea)/.14)]'}`;
  return (
    <section className="ficha">
      <p className="ficha-cabecera !mb-3 !justify-start gap-2 rotulo"><Moon size={12} /> Apariencia</p>
      <div className="grid grid-cols-3 gap-2">
        {OPCIONES.map(({ valor, etiqueta, icono: Icono }) => (
          <button key={valor} onClick={() => elegirTema(valor)} className={`flex flex-col items-center gap-1.5 py-3 ${boton(preferencia === valor)}`}><Icono size={18} /> {etiqueta}</button>
        ))}
      </div>

      <p className="rotulo mb-2.5 mt-5"><Palette size={12} className="mr-1 inline" /> Color de acento</p>
      <div className="flex flex-wrap gap-2.5">
        {Object.entries(ACENTOS).map(([k, a]) => {
          const c = `rgb(${a[oscuro ? 'oscuro' : 'claro'].primary})`;
          return <button key={k} onClick={() => { elegirAcento(k); setAcento(k); }} aria-label={`Acento ${a.nombre}`} aria-pressed={acento === k} title={a.nombre} className="h-8 w-8 rounded-full transition hover:scale-110" style={{ backgroundColor: c, outline: acento === k ? `3px solid ${c}` : 'none', outlineOffset: 3 }} />;
        })}
      </div>

      <p className="rotulo mb-2.5 mt-5"><Type size={12} className="mr-1 inline" /> Tamaño del texto</p>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(TAMANOS_TEXTO).map(([k, t]) => <button key={k} onClick={() => { elegirTexto(k); setTexto(k); }} aria-pressed={texto === k} className={boton(texto === k)}>{t.etiqueta}</button>)}
      </div>
    </section>
  );
}
