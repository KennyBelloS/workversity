/** Guía paso a paso descriptiva (Grupo, Parciales…): cada paso con su número, título y explicación. */
export default function GuiaPasoAPaso({ titulo, icono: Icono, color, pasos }) {
  return (
    <section className="ficha">
      <p className="rotulo mb-3 flex items-center gap-1.5"><Icono size={16} style={{ color }} /> {titulo}</p>
      <ol className="space-y-3">
        {pasos.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white" style={{ backgroundColor: color }}>{i + 1}</span>
            <div><p className="text-sm font-bold">{t}</p><p className="text-xs leading-relaxed text-textSecondary">{d}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}
