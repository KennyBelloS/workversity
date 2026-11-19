/**
 * Cabecera de una cubierta del Dashboard: número, nombre y una regla que cruza hasta el borde.
 * Es lo que hace que la página se lea como un tablero de instrumentos y no como una pila de cajas.
 */
export default function Franja({ n, children, acc }) {
  return (
    <div className="franja">
      {n && <span className="franja-n">{n}</span>}
      <span className="franja-t">{children}</span>
      <span className="franja-regla" />
      {acc && <span className="franja-acc">{acc}</span>}
    </div>
  );
}
