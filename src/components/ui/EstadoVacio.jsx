import Glifo from '../Glifo';

// ---------------------------------------------------------------------------------------------
// Estado vacío con muestras: en vez de un icono gris y una frase, se ven en miniatura las fichas
// que van a vivir ahí, regadas y con una leve inclinación, como si alguien las hubiera dejado
// sobre la mesa. Al entrar caen a su sitio. Se usa en Parciales, Apuntes, Metas y Tareas.
// ---------------------------------------------------------------------------------------------

/**
 * @param {object} o
 * @param {string} o.titulo
 * @param {string} o.texto      Una línea diciendo para qué sirve la sección.
 * @param {Array}  o.muestras   [{ titulo, pie, icono?, tono? }] — máximo 4.
 * @param {{texto:string,onClick:Function}} [o.accion]
 * @param {boolean} [o.tenue]   Variante sin color de fondo (para filtros sin resultados).
 */
export default function EstadoVacio({ titulo, texto, muestras = [], accion, tenue = false }) {
  const giros = [-7, 5, -3, 8];
  const desvios = [-6, 8, -4, 6];
  return (
    <div className={`vacio ${tenue ? 'vacio--tenue' : ''}`}>
      {muestras.length > 0 && (
        <div className="vacio-mesa" aria-hidden="true">
          {muestras.slice(0, 4).map((m, i) => (
            <div
              key={m.titulo}
              className={`vacio-ficha ${m.tono === 'oscuro' ? 'vacio-ficha--oscura' : ''}`}
              style={{ '--g': `${giros[i]}deg`, '--x': `${desvios[i]}px`, '--i': i }}
            >
              {m.icono && <span className="vacio-ficha-icono"><Glifo e={m.icono} size={13} /></span>}
              <p className="vacio-ficha-t">{m.titulo}</p>
              <p className="vacio-ficha-p">{m.pie}</p>
            </div>
          ))}
        </div>
      )}
      <div className="vacio-texto">
        <p className="vacio-titulo">{titulo}</p>
        {texto && <p className="vacio-sub">{texto}</p>}
        {accion && (
          <button type="button" onClick={accion.onClick} className="vacio-boton">{accion.texto}</button>
        )}
      </div>
    </div>
  );
}
