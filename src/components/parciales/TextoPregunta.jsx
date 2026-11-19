/**
 * Muestra una pregunta de tarjeta. En las de "Completa", el hueco (_____) se dibuja como una
 * línea de color en vez de guiones bajos sueltos, y las comillas del formato se quitan.
 * Todo el texto parte palabras largas si hace falta: nunca se sale de la tarjeta.
 */
export default function TextoPregunta({ texto, className = '' }) {
  const completa = /^Completa:\s*"(.*)"$/s.exec(texto || '');
  if (!completa) return <span className={`[overflow-wrap:anywhere] ${className}`}>{texto}</span>;
  const partes = completa[1].split('_____');
  return (
    <span className={`[overflow-wrap:anywhere] ${className}`}>
      <span className="mb-1 block text-t-micro font-bold uppercase tracking-wide text-primary">Completa</span>
      {partes.map((p, i) => (
        <span key={i}>
          {p}
          {i < partes.length - 1 && <span aria-label="espacio en blanco" className="mx-1 inline-block w-16 translate-y-[-3px] border-b-2 border-primary align-baseline" />}
        </span>
      ))}
    </span>
  );
}
