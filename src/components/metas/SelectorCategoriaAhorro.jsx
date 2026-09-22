import { useState } from 'react';
import { Plus } from 'lucide-react';
import { COLORES_SUGERIDOS } from '../../lib/constants';

/** Formulario corto para crear una categoría (nombre + color). */
export function CrearCategoriaForm({ cat, onCreada, onCancelar, autoFocus = true }) {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORES_SUGERIDOS[0]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    setGuardando(true);
    const r = await cat.crear(nombre, color);
    setGuardando(false);
    if (!r.ok) return setError(r.error);
    setNombre(''); setError('');
    onCreada?.(r.nombre);
  };

  return (
    <div className="space-y-2 rounded-sm2 bg-white p-3 shadow-card">
      <input
        autoFocus={autoFocus} value={nombre} maxLength={30}
        onChange={(e) => { setNombre(e.target.value); setError(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); crear(); } }}
        placeholder="Nombre (ej: Viaje a Cartagena, Portátil)"
        className="w-full rounded-sm2 bg-primarySoft/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" aria-label="Nombre de la categoría"
      />
      <div className="flex items-center gap-2">
        {COLORES_SUGERIDOS.map((c) => (
          <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Color ${c}`} className="h-6 w-6 rounded-full" style={{ backgroundColor: c, outline: color === c ? `2.5px solid ${c}` : 'none', outlineOffset: 2 }} />
        ))}
      </div>
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={crear} disabled={guardando || !nombre.trim()} className="flex-1 rounded-sm2 bg-primary py-2 text-xs font-bold text-white disabled:opacity-50">Crear categoría</button>
        {onCancelar && <button type="button" onClick={onCancelar} className="rounded-sm2 px-3 text-xs font-bold text-textSecondary">Cancelar</button>}
      </div>
    </div>
  );
}

/** Lista desplegable de categorías de ahorro con opción de crear una nueva sin salir de la pantalla. */
export default function SelectorCategoriaAhorro({ value, onChange, cat }) {
  const [creando, setCreando] = useState(false);
  // Si la categoría actual ya no existe (se borró), se sigue mostrando para no perder el dato.
  const opciones = !value || cat.todas.some((c) => c.nombre === value) ? cat.todas : [...cat.todas, { nombre: value, propia: false }];

  return (
    <div>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Categoría de ahorro" className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none">
        {opciones.map((c) => <option key={c.nombre} value={c.nombre}>{c.nombre}{c.propia ? ' ★' : ''}</option>)}
      </select>
      {cat.disponible ? (
        creando ? (
          <div className="mt-2"><CrearCategoriaForm cat={cat} onCancelar={() => setCreando(false)} onCreada={(n) => { onChange(n); setCreando(false); }} /></div>
        ) : (
          <button type="button" onClick={() => setCreando(true)} className="mt-1.5 flex items-center gap-1 text-xs font-bold text-primary"><Plus size={13} /> Crear categoría nueva</button>
        )
      ) : (
        <p className="mt-1.5 text-[11px] font-semibold text-warning">Para crear categorías propias falta ejecutar el SQL de categorías (ver el manual).</p>
      )}
    </div>
  );
}
