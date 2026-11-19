import { useEffect, useState } from 'react';
import Logo from './Logo';

// Animación de carga: el bento del Dashboard se arma vacío, pieza por pieza (como en la
// referencia de los widgets), mientras una cifra grande cuenta hasta 100. Se usa al abrir la
// app (pantalla completa) y mientras carga cualquier página (dentro del contenido).
export default function CargaBento({ pantallaCompleta = false, texto = 'Preparando tu semana' }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    // Se acerca a 100 sin llegar nunca mientras siga cargando (curva asintótica).
    const paso = (t) => { setPct(Math.min(99, 100 * (1 - Math.exp(-(t - t0) / 900)))); raf = requestAnimationFrame(paso); };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, []);

  const piezas = [
    { span: 1, alto: 150 }, { span: 2, alto: 150 },
    { span: 1, alto: 170 }, { span: 1, alto: 170 }, { span: 1, alto: 170 },
    { span: 2, alto: 150 }, { span: 1, alto: 150 },
  ];

  const contenido = (
    <div className="w-full max-w-[880px]" role="status" aria-live="polite" aria-label={`${texto}: ${Math.round(pct)}%`}>
      <div className="carga-bento">
        {piezas.map((p, i) => (
          <div key={i} className="carga-pieza p-4" style={{ '--i': i, gridColumn: `span ${p.span}`, height: p.alto }}>
            {i === 0 ? (
              <div className="flex h-full flex-col justify-between">
                <span className="rotulo">{texto}</span>
                <p className="bento-cifra">{Math.round(pct)}<span className="bento-cifra-unidad">%</span></p>
              </div>
            ) : i === 1 ? (
              <div className="flex h-full gap-4">
                <div className="flex aspect-square h-full items-center justify-center rounded-xl bg-[rgb(var(--primary))]"><span className="rounded-xl bg-white p-2"><Logo tam={34} /></span></div>
                <div className="flex flex-1 flex-col gap-2 pt-1"><span className="carga-linea w-1/3" /><span className="carga-linea w-3/4" /><span className="carga-linea w-1/2" /><span className="carga-linea mt-auto w-full" /></div>
              </div>
            ) : (
              <div className="flex h-full flex-col gap-2"><span className="carga-linea w-1/3" /><span className="carga-linea mt-auto h-7 w-1/2" /><span className="carga-linea w-2/3" /></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  if (!pantallaCompleta) return <div className="flex justify-center py-2">{contenido}</div>;
  return <div className="flex min-h-screen items-center justify-center bg-bg px-4">{contenido}</div>;
}
