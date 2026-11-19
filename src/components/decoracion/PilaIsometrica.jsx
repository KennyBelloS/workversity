import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------------------------
// Pila isométrica (referencia: el diagrama de capas que se separa al bajar la página).
// Las losas se dibujan con CSS 3D de verdad: el contenedor rota en X y Z, y cada capa se
// desplaza en el eje Z. Al entrar en pantalla, la pila se separa; cada losa tiene su etiqueta
// unida por una línea guía. Si la capa es elegible, se puede tocar.
// ---------------------------------------------------------------------------------------------

/**
 * @param {object} o
 * @param {Array} o.capas  De abajo hacia arriba: [{ id, titulo, nota, color?, icono? }]
 * @param {string} [o.activa]      Id de la capa resaltada.
 * @param {Function} [o.onElegir]  Si viene, las capas son botones.
 * @param {number} [o.separacion]  Píxeles entre losas una vez separada (por defecto 34).
 * @param {boolean} [o.siempreAbierta] No esperar a que entre en pantalla.
 */
export default function PilaIsometrica({ capas, activa, onElegir, separacion = 34, siempreAbierta = false, etiquetas = true }) {
  const caja = useRef(null);
  const [abierta, setAbierta] = useState(siempreAbierta);
  const [encima, setEncima] = useState(null);

  useEffect(() => {
    if (siempreAbierta) return undefined;
    const el = caja.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setAbierta(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAbierta(true); }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [siempreAbierta]);

  const n = capas.length;
  return (
    <div className={`pila ${abierta ? 'pila--abierta' : ''}`} ref={caja} style={{ '--sep': `${separacion}px`, '--n': n }}>
      <div className="pila-escena">
        {capas.map((c, i) => {
          const Marca = onElegir ? 'button' : 'div';
          const esActiva = activa === c.id;
          const atenuada = (activa && !esActiva) || (encima && encima !== c.id && !esActiva);
          return (
            <Marca
              key={c.id}
              {...(onElegir ? { type: 'button', onClick: () => onElegir(c.id), 'aria-pressed': esActiva } : {})}
              onMouseEnter={() => setEncima(c.id)}
              onMouseLeave={() => setEncima(null)}
              className={`pila-capa ${esActiva ? 'pila-capa--activa' : ''} ${atenuada ? 'pila-capa--tenue' : ''} ${onElegir ? 'pila-capa--toca' : ''}`}
              style={{ '--i': i, '--c': c.color || 'rgb(var(--primary))' }}
            >
              <span className="pila-losa">
                <span className="pila-cara">
                  <span className="pila-trama" aria-hidden="true" />
                  {c.icono && <span className="pila-icono">{c.icono}</span>}
                </span>
              </span>
              {etiquetas && (
                <span className="pila-et">
                  <span className="pila-linea" aria-hidden="true" />
                  <span className="pila-et-txt">
                    <span className="pila-et-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="pila-et-t">{c.titulo}</span>
                    {c.nota && <span className="pila-et-p">{c.nota}</span>}
                  </span>
                </span>
              )}
            </Marca>
          );
        })}
      </div>
    </div>
  );
}
