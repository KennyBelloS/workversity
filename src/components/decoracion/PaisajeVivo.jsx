import { useMemo } from 'react';

// ---------------------------------------------------------------------------------------------
// Paisaje vivo (referencia: el pie de página con el lago ilustrado). Una ilustración de lago con
// montañas, un pueblo en la ladera, cipreses, un velero y follaje en las esquinas, dibujada como
// grabado de UN solo color: el color de acento que la persona eligió en Ajustes. No es un video:
// cada elemento se mueve por su cuenta — las hojas y los árboles se mecen, el velero cabecea, el
// agua destella y el reflejo ondula.
// ---------------------------------------------------------------------------------------------

function azar(semilla) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const W = 1200;
const H = 430;
const AGUA = 300; // línea del agua

function cresta(r, { y0, amp, picos, det = 0.35, desde = 0, hasta = W }) {
  const pts = [];
  const fases = Array.from({ length: 4 }, () => r() * Math.PI * 2);
  for (let x = desde; x <= hasta; x += 8) {
    const u = x / W;
    let y = y0 - amp * (0.55 * Math.sin(u * Math.PI * picos + fases[0]) + 0.3 * Math.sin(u * Math.PI * picos * 2.3 + fases[1]) + 0.15 * Math.sin(u * Math.PI * picos * 5.1 + fases[2]));
    y += (r() - 0.5) * amp * det * 0.25;
    pts.push([x, y]);
  }
  return pts;
}
const polilinea = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

function Casa({ x, y, w, h, techo = 'dos', r }) {
  const ventanas = [];
  const filas = Math.max(1, Math.floor(h / 9));
  const cols = Math.max(1, Math.floor(w / 7));
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) if (r() > 0.35) ventanas.push(<rect key={`${f}-${c}`} x={x + 2.5 + c * (w - 4) / cols} y={y + 3 + f * 8} width="1.8" height="3" className="pv-ventana" />);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="pv-muro" />
      <line x1={x} x2={x} y1={y} y2={y + h} className="pv-sombra-linea" />
      {techo === 'dos'
        ? <path d={`M${x - 1.5} ${y} L${x + w / 2} ${y - w * 0.32} L${x + w + 1.5} ${y} Z`} className="pv-techo" />
        : <rect x={x - 1} y={y - 2.5} width={w + 2} height="2.5" className="pv-techo" />}
      {ventanas}
    </g>
  );
}

function Cipres({ x, y, h, k }) {
  return (
    <g className="pv-arbol" style={{ '--d': `${3.6 + (k % 5) * 0.55}s`, '--r': `${0.8 + (k % 3) * 0.4}deg`, transformOrigin: `${x}px ${y}px` }}>
      <path d={`M${x} ${y - h} C ${x + h * 0.16} ${y - h * 0.7}, ${x + h * 0.15} ${y - h * 0.15}, ${x + 1} ${y} L ${x - 1} ${y} C ${x - h * 0.15} ${y - h * 0.15}, ${x - h * 0.16} ${y - h * 0.7}, ${x} ${y - h} Z`} className="pv-follaje-oscuro" />
      <path d={`M${x} ${y - h * 0.92} C ${x + h * 0.05} ${y - h * 0.6}, ${x + h * 0.06} ${y - h * 0.25}, ${x + 0.5} ${y - h * 0.05}`} className="pv-trazo-claro" />
    </g>
  );
}

function Pino({ x, y, h, k }) {
  const capas = 4;
  return (
    <g className="pv-arbol" style={{ '--d': `${4.2 + (k % 4) * 0.6}s`, '--r': `${1 + (k % 3) * 0.5}deg`, transformOrigin: `${x}px ${y}px` }}>
      {Array.from({ length: capas }, (_, c) => {
        const yy = y - (h * c) / capas - h * 0.12;
        const w = (h * 0.42 * (capas - c)) / capas + 2;
        return <path key={c} d={`M${x - w} ${yy} L${x} ${yy - h * 0.38} L${x + w} ${yy} Z`} className={c % 2 ? 'pv-follaje-oscuro' : 'pv-follaje'} />;
      })}
      <line x1={x} x2={x} y1={y} y2={y - h * 0.15} className="pv-tronco" />
    </g>
  );
}

/** Ramillete de hojas (esquinas): ramas curvas con hojas alternadas que se mecen. */
function Ramillete({ x, y, escala = 1, espejo = false, r, k }) {
  const ramas = [];
  for (let b = 0; b < 7; b++) {
    const ang = (-100 + b * 16 + (r() - 0.5) * 10) * (Math.PI / 180);
    const largo = (70 + r() * 90) * escala;
    const hojas = [];
    const pasos = 7 + Math.floor(r() * 4);
    for (let i = 1; i <= pasos; i++) {
      const t = i / (pasos + 1);
      const px = Math.cos(ang) * largo * t;
      const py = Math.sin(ang) * largo * t;
      const lado = i % 2 ? 1 : -1;
      const tam = (9 + r() * 8) * escala * (1 - t * 0.45);
      const giro = (ang * 180) / Math.PI + lado * (48 + r() * 18);
      hojas.push(<ellipse key={i} cx={px + Math.cos(ang + lado * 1.2) * tam * 0.6} cy={py + Math.sin(ang + lado * 1.2) * tam * 0.6} rx={tam} ry={tam * 0.38} transform={`rotate(${giro.toFixed(1)} ${(px + Math.cos(ang + lado * 1.2) * tam * 0.6).toFixed(1)} ${(py + Math.sin(ang + lado * 1.2) * tam * 0.6).toFixed(1)})`} className={(i + b) % 3 === 0 ? 'pv-hoja-oscura' : 'pv-hoja'} />);
    }
    ramas.push(
      <g key={b} className="pv-rama" style={{ '--d': `${3 + r() * 2.5}s`, '--r': `${2 + r() * 2.5}deg`, animationDelay: `${-r() * 4}s` }}>
        <path d={`M0 0 Q ${Math.cos(ang - 0.2) * largo * 0.5} ${Math.sin(ang - 0.2) * largo * 0.5} ${Math.cos(ang) * largo} ${Math.sin(ang) * largo}`} className="pv-tallo" />
        {hojas}
      </g>,
    );
  }
  return <g transform={`translate(${x} ${y}) scale(${espejo ? -1 : 1} 1)`} data-k={k}>{ramas}</g>;
}

export default function PaisajeVivo({ className = '', semilla = 7 }) {
  const escena = useMemo(() => {
    const r = azar(semilla);
    const lejanas = cresta(r, { y0: 205, amp: 70, picos: 3.2 });
    const medias = cresta(r, { y0: 250, amp: 48, picos: 4.5 });
    const colinaIzq = cresta(r, { y0: 292, amp: 26, picos: 2, desde: 0, hasta: 420 });
    // Pueblo de la derecha: ladera que sube hacia el borde.
    const ladera = [];
    for (let x = 700; x <= W; x += 6) { const u = (x - 700) / 500; ladera.push([x, AGUA - 8 - u * u * 190 - Math.sin(u * 9) * 6 - r() * 3]); }
    const casasDer = [];
    for (let f = 0; f < 7; f++) {
      for (let x = 760 + f * 18; x < W - 10; x += 22 + r() * 16) {
        const u = (x - 700) / 500;
        const base = AGUA - 6 - u * u * 175 + f * 22 - 10;
        if (base > AGUA - 4 || base < AGUA - 210) continue;
        if (r() < 0.25) continue;
        casasDer.push({ x, y: base - 16 - r() * 8, w: 13 + r() * 12, h: 14 + r() * 12, techo: r() > 0.3 ? 'dos' : 'plano' });
      }
    }
    casasDer.sort((a, b) => a.y + a.h - (b.y + b.h));
    const arbolesDer = Array.from({ length: 26 }, () => { const x = 720 + r() * 470; const u = (x - 700) / 500; return { x, y: AGUA - 2 - u * u * 150 + r() * 70, h: 22 + r() * 38, tipo: r() > 0.45 ? 'c' : 'p' }; }).filter((a) => a.y < AGUA + 4).sort((a, b) => a.y - b.y);
    const casasIzq = Array.from({ length: 9 }, (_, i) => ({ x: 112 + i * 16 + r() * 6, y: 270 - r() * 10 - (i === 4 ? 4 : 0), w: 9 + r() * 6, h: 9 + r() * 6, techo: 'dos' }));
    const arbolesIzq = Array.from({ length: 14 }, () => ({ x: 40 + r() * 330, y: 286 + r() * 10, h: 16 + r() * 22, tipo: r() > 0.5 ? 'c' : 'p' }));
    const destellos = Array.from({ length: 70 }, () => ({ x: 20 + r() * 1150, y: AGUA + 10 + r() * 110, w: 6 + r() * 26, d: 2 + r() * 4, o: r() }));
    const hilos = Array.from({ length: 34 }, (_, i) => ({ y: AGUA + 4 + i * 3.6 + (i * i) / 18, o: 0.5 - i / 80 }));
    return { lejanas, medias, colinaIzq, ladera, casasDer, arbolesDer, casasIzq, arbolesIzq, destellos, hilos, r };
  }, [semilla]);

  const { lejanas, medias, colinaIzq, ladera, casasDer, arbolesDer, casasIzq, arbolesIzq, destellos, hilos } = escena;
  const r2 = azar(semilla + 99);

  const montes = (
    <>
      <path d={`${polilinea(lejanas)} L${W} ${AGUA} L0 ${AGUA} Z`} className="pv-monte-lejano" />
      <path d={`${polilinea(lejanas)} L${W} ${AGUA} L0 ${AGUA} Z`} fill="url(#pv-rayado)" opacity=".5" />
      <path d={polilinea(lejanas)} className="pv-contorno" />
      <path d={`${polilinea(medias)} L${W} ${AGUA} L0 ${AGUA} Z`} className="pv-monte-medio" />
      <path d={`${polilinea(medias)} L${W} ${AGUA} L0 ${AGUA} Z`} fill="url(#pv-rayado-denso)" opacity=".55" />
      <path d={polilinea(medias)} className="pv-contorno" />
      <path d={`${polilinea(colinaIzq)} L420 ${AGUA} L0 ${AGUA} Z`} className="pv-colina" />
      <path d={`M700 ${AGUA} ${polilinea(ladera).replace(/^M/, 'L')} L${W} ${AGUA} Z`} className="pv-colina" />
      <path d={`M700 ${AGUA} ${polilinea(ladera).replace(/^M/, 'L')} L${W} ${AGUA} Z`} fill="url(#pv-rayado-denso)" opacity=".7" />
    </>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={`paisaje ${className}`} aria-hidden="true">
      <defs>
        <pattern id="pv-rayado" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><line x1="0" y1="0" x2="0" y2="5" className="pv-raya" /></pattern>
        <pattern id="pv-rayado-denso" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><line x1="0" y1="0" x2="0" y2="3" className="pv-raya" /></pattern>
        <linearGradient id="pv-agua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="pv-agua-1" />
          <stop offset="1" className="pv-agua-2" />
        </linearGradient>
        <linearGradient id="pv-desvanece" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset=".9" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id="pv-mascara-reflejo"><rect x="0" y={AGUA} width={W} height={H - AGUA} fill="url(#pv-desvanece)" /></mask>
      </defs>

      {/* Cielo: nada (papel). Montañas, colinas y pueblos. */}
      <g>{montes}</g>

      {/* Agua y reflejo ondulante */}
      <rect x="0" y={AGUA} width={W} height={H - AGUA} fill="url(#pv-agua)" />
      <g mask="url(#pv-mascara-reflejo)">
        <g className="pv-reflejo" transform={`translate(0 ${AGUA * 2}) scale(1 -1)`}>{montes}</g>
      </g>
      {hilos.map((h, i) => <line key={i} x1="0" x2={W} y1={h.y} y2={h.y} className="pv-hilo-agua" style={{ opacity: h.o }} />)}

      {/* Pueblo izquierdo, lejano */}
      <g opacity=".85">
        {arbolesIzq.map((a, k) => (a.tipo === 'c' ? <Cipres key={k} x={a.x} y={a.y} h={a.h * 0.8} k={k} /> : <Pino key={k} x={a.x} y={a.y} h={a.h * 0.7} k={k} />))}
        {casasIzq.map((c, k) => <Casa key={k} {...c} r={r2} />)}
        <g><rect x="176" y="236" width="7" height="30" className="pv-muro" /><path d="M175 236 L179.5 224 L184 236 Z" className="pv-techo" /></g>
      </g>

      {/* Pueblo de la ladera derecha */}
      <g>
        {arbolesDer.filter((_, k) => k % 2).map((a, k) => (a.tipo === 'c' ? <Cipres key={`a${k}`} x={a.x} y={a.y} h={a.h} k={k} /> : <Pino key={`a${k}`} x={a.x} y={a.y} h={a.h * 0.9} k={k} />))}
        {casasDer.map((c, k) => <Casa key={k} {...c} r={r2} />)}
        <g><rect x="1012" y="120" width="12" height="58" className="pv-muro" /><path d="M1010 120 L1018 98 L1026 120 Z" className="pv-techo" /><rect x="1016" y="128" width="4" height="7" className="pv-ventana" /></g>
        {arbolesDer.filter((_, k) => !(k % 2)).map((a, k) => (a.tipo === 'c' ? <Cipres key={`b${k}`} x={a.x} y={a.y} h={a.h} k={k + 3} /> : <Pino key={`b${k}`} x={a.x} y={a.y} h={a.h * 0.9} k={k + 3} />))}
        {/* Muro de piedra con arcos a la orilla */}
        <path d={`M940 ${AGUA - 18} L${W} ${AGUA - 30} L${W} ${AGUA + 2} L940 ${AGUA + 2} Z`} className="pv-muro" />
        {[0, 1, 2, 3].map((k) => <path key={k} d={`M${985 + k * 48} ${AGUA + 2} L${985 + k * 48} ${AGUA - 8} A 13 13 0 0 1 ${1011 + k * 48} ${AGUA - 8} L${1011 + k * 48} ${AGUA + 2} Z`} className="pv-arco" />)}
        <path d={`M940 ${AGUA - 18} L${W} ${AGUA - 30}`} className="pv-contorno" />
      </g>

      {/* Destellos del agua */}
      {destellos.map((d, i) => <line key={i} x1={d.x} x2={d.x + d.w} y1={d.y} y2={d.y} className="pv-destello" style={{ '--d': `${d.d}s`, animationDelay: `${-d.o * d.d}s` }} />)}

      {/* Velero que cabecea y deriva, y un bote junto a la orilla */}
      <g className="pv-deriva">
        <g className="pv-velero">
          <path d="M548 333 L606 333 L598 342 L556 342 Z" className="pv-casco" />
          <line x1="577" x2="577" y1="333" y2="268" className="pv-mastil" />
          <path d="M579 271 L579 329 L612 329 Z" className="pv-vela" />
          <path d="M575 276 L575 329 L552 329 Z" className="pv-vela pv-vela--sombra" />
          <path d="M556 344 L598 344" className="pv-reflejo-linea" />
          <path d="M579 346 L579 380 L605 352 Z" className="pv-vela-reflejo" />
        </g>
      </g>
      <g className="pv-bote">
        <path d="M900 352 L948 352 L940 359 L907 359 Z" className="pv-casco" />
        <path d="M903 362 L944 362" className="pv-reflejo-linea" />
      </g>

      {/* Follaje de las esquinas (primer plano) */}
      <Ramillete x={-10} y={H + 10} escala={1.35} r={azar(semilla + 3)} k={1} />
      <Ramillete x={70} y={H + 30} escala={0.9} r={azar(semilla + 4)} k={2} />
      <Ramillete x={W + 10} y={H + 10} escala={1.25} espejo r={azar(semilla + 5)} k={3} />
      <Ramillete x={W - 20} y={250} escala={0.75} espejo r={azar(semilla + 6)} k={4} />
    </svg>
  );
}
