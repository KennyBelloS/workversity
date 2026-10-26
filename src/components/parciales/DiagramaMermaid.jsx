import { useEffect, useRef, useState } from 'react';

let mermaidPromesa = null;
const cargarMermaid = () => (mermaidPromesa ||= import('mermaid').then((m) => m.default));

/** Dibuja un diagrama con Mermaid (librería real de diagramas) a partir de su código fuente. */
export default function DiagramaMermaid({ codigo, oscuro }) {
  const contenedor = useRef(null);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error

  useEffect(() => {
    if (!codigo) return;
    let vivo = true;
    setEstado('cargando');
    cargarMermaid()
      .then(async (mermaid) => {
        mermaid.initialize({ startOnLoad: false, theme: oscuro ? 'dark' : 'default', securityLevel: 'strict', fontFamily: 'inherit' });
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, codigo);
        if (vivo && contenedor.current) {
          contenedor.current.innerHTML = svg;
          // Mermaid calcula un tamaño en píxeles fijo para el SVG (a veces muy chico,
          // sobre todo con pocos nodos). Se quita ese alto fijo y se deja crecer hasta
          // llenar el ancho disponible, manteniendo la proporción del dibujo original.
          const svgEl = contenedor.current.querySelector('svg');
          if (svgEl) {
            svgEl.removeAttribute('height');
            svgEl.style.width = '100%';
            svgEl.style.maxWidth = '760px';
            svgEl.style.height = 'auto';
            svgEl.style.minHeight = '260px';
          }
          setEstado('listo');
        }
      })
      .catch((err) => { console.warn('[mermaid]', err); if (vivo) setEstado('error'); });
    return () => { vivo = false; };
  }, [codigo, oscuro]);

  if (estado === 'error') return <p className="py-8 text-center text-sm text-textSecondary">No se pudo dibujar el diagrama. Intenta con otra fuente de texto.</p>;
  return (
    <div className="overflow-x-auto">
      {estado === 'cargando' && <p className="py-8 text-center text-sm text-textSecondary">Dibujando el diagrama…</p>}
      <div ref={contenedor} className={`mx-auto w-fit [&_svg]:mx-auto ${estado === 'cargando' ? 'hidden' : ''}`} />
    </div>
  );
}
