/** Anillo animado: muestra cuánto del tiempo ya pasó (o el avance) con el centro libre para un icono o texto. */
export default function AnilloTiempo({ fraccion = 0, color = '#3E7BFA', tam = 76, grosor = 7, children }) {
  const r = (tam - grosor) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: tam, height: tam }}>
      <svg width={tam} height={tam} className="-rotate-90">
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth={grosor} />
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - fraccion)} style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-2xl">{children}</div>
    </div>
  );
}
