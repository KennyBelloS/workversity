// Logo de Workversity. Va sobre un cuadro blanco para verse bien también en modo oscuro.
export default function Logo({ tam = 36, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${className}`}
      style={{ width: tam, height: tam, backgroundColor: '#fff' }}
    >
      <img src="/logo.png" alt="Workversity" width={tam * 0.82} height={tam * 0.82} draggable={false} />
    </span>
  );
}
