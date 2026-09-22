import { useLogros } from '../../hooks/useLogros';

export default function LogrosCard() {
  const { lista } = useLogros();
  const logrados = lista.filter((l) => l.logrado).length;
  const orden = [...lista].sort((a, b) => Number(b.logrado) - Number(a.logrado) || b.actual / b.meta - a.actual / a.meta);
  return (
    <section id="logros" className="rounded-md2 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-extrabold">🏆 Logros</p>
        <span className="rounded-full bg-primarySoft px-2.5 py-1 text-xs font-extrabold text-primary">{logrados}/{lista.length}</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${lista.length ? (logrados / lista.length) * 100 : 0}%` }} /></div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {orden.map((l) => (
          <div key={l.id} className={`rounded-sm2 border p-3 ${l.logrado ? 'border-primary/30 bg-primarySoft/50' : 'border-black/10'}`}>
            <p className={`text-2xl ${l.logrado ? '' : 'opacity-40 grayscale'}`}>{l.emoji}</p>
            <p className={`mt-1 text-xs font-extrabold ${l.logrado ? '' : 'text-textSecondary'}`}>{l.titulo}</p>
            <p className="text-[10px] leading-snug text-textSecondary">{l.desc}</p>
            {!l.logrado && (
              <div className="mt-2"><div className="h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-primary/60" style={{ width: `${(l.actual / l.meta) * 100}%` }} /></div><p className="mt-0.5 text-[10px] font-bold text-textSecondary">{l.actual}/{l.meta}</p></div>
            )}
            {l.logrado && <p className="mt-1.5 text-[10px] font-extrabold text-success">✓ Conseguido</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
