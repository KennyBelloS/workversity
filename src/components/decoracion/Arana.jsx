import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef } from 'react';

// ---------------------------------------------------------------------------------------------
// Araña procedural. Vive escondida en una esquina del contenedor (con el abdomen metido detrás
// del borde, como asomándose) y, cuando se le pide, sale caminando, lanza un hilo hacia un punto
// y vuelve a su escondite.
//
// No es un dibujo fijo: cada pata tiene 3 segmentos (fémur, tibia y tarso) que se calculan con
// cinemática inversa a partir de dónde está "plantada". Cuando el cuerpo se mueve, cada pata se
// queda en su sitio hasta que queda muy estirada y entonces da un paso, alternando dos grupos de
// cuatro patas como una araña de verdad. Quieta, mueve las patas de vez en cuando.
//
// El contenedor debe tener `position: relative` y `overflow: hidden` (el borde es lo que tapa
// el abdomen). Todo se dibuja con atributos SVG actualizados por requestAnimationFrame, sin
// re-renderizar React en cada cuadro.
// ---------------------------------------------------------------------------------------------

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const facil = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2); // easeInOutCubic
const salida = (t) => 1 - (1 - t) ** 3; // easeOutCubic
const rot = (x, y, a) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const anguloCorto = (desde, hasta) => { let d = (hasta - desde) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

// Patas en el marco del cuerpo: x hacia adelante (la cabeza), y hacia la derecha.
// k = 0 (delantera) … 3 (trasera). φ: ángulo del pie respecto al frente; r: distancia del pie.
// Proporciones tomadas de la referencia: patas largas y finas, casi extendidas (codo abierto),
// repartidas en estrella: dos pares hacia adelante y dos hacia atrás.
const PATAS = [
  { phi: 27, r: 70, femur: 28, tibia: 28, tarso: 15, cadera: 52 },
  { phi: 60, r: 60, femur: 24, tibia: 25, tarso: 13, cadera: 78 },
  { phi: 113, r: 57, femur: 23, tibia: 24, tarso: 13, cadera: 104 },
  { phi: 151, r: 68, femur: 27, tibia: 28, tarso: 15, cadera: 128 },
];
// Dos grupos que se turnan para dar pasos (marcha alterna de 4 patas).
const GRUPO = (lado, k) => ((k % 2 === 0) === (lado > 0) ? 0 : 1);

function rodilla(cadera, tobillo, a, b, curva) {
  const dx = tobillo.x - cadera.x;
  const dy = tobillo.y - cadera.y;
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(a - b) + 0.01), a + b - 0.01);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d))));
  return { x: cadera.x + Math.cos(base + curva * A) * a, y: cadera.y + Math.sin(base + curva * A) * a };
}

// Tonos: 'oscuro' es la araña negra de la referencia (sobre fondos claros); 'claro' es la misma
// araña en gris perla para que se vea sobre el modo oscuro de la app.
const TONOS = {
  oscuro: { linea: '#121212', abd: ['#8a8a8a', '#3a3a3a', '#121212', '#000'], cab: ['#5a5a5a', '#121212', '#000'], hilo: '#2a2a2a', brillo: 0.28 },
  claro: { linea: '#cfd4de', abd: ['#ffffff', '#e4e7ee', '#aab1bf', '#6c7484'], cab: ['#ffffff', '#c3c9d4', '#7d8594'], hilo: '#c9ced8', brillo: 0.5 },
};

const Arana = forwardRef(function Arana({ esquina = 'sup-der', escala = 1, tono = 'oscuro', interactiva = false, onTocar, className = '' }, ref) {
  const paleta = TONOS[tono] || TONOS.oscuro;
  const color = paleta.linea;
  const idBase = useId().replace(/:/g, '');
  const svgRef = useRef(null);
  const partes = useRef({}); // referencias a los elementos SVG que se actualizan cada cuadro
  const estado = useRef(null);
  const reducido = useRef(false);

  const s = escala;
  // Posición de "escondite": el abdomen queda detrás de la esquina, se ven la cabeza y las patas.
  const casa = useCallback((w, h) => {
    const haciaAbajo = esquina.startsWith('sup');
    const haciaIzq = esquina.endsWith('der');
    // Mira hacia el contenido, más hacia abajo que de lado: así el abdomen queda metido bajo el
    // borde superior y se ven la cabeza y casi todas las patas, como en la referencia.
    const ang = Math.atan2(haciaAbajo ? 1.35 : -1.35, haciaIzq ? -1 : 1);
    const x = haciaIzq ? w - 25 * s : 25 * s;
    const y = haciaAbajo ? 22 * s : h - 22 * s;
    return { x, y, ang };
  }, [esquina, s]);

  // Dónde "quiere" estar cada pie según la pose actual del cuerpo.
  const pieIdeal = (st, lado, k, extra = 0) => {
    const p = PATAS[k];
    const phi = (p.phi * Math.PI) / 180;
    const local = { x: Math.cos(phi) * p.r * s, y: lado * Math.sin(phi) * p.r * s };
    const w = rot(local.x, local.y, st.ang);
    // Al caminar, el pie se adelanta un poco en la dirección del movimiento.
    return { x: st.x + w.x + st.vx * extra, y: st.y + w.y + st.vy * extra };
  };

  const dibujar = useCallback(() => {
    const st = estado.current;
    const el = partes.current;
    if (!st || !el.cuerpo) return;
    const caderaLocal = (lado, k) => {
      const a = ((PATAS[k].cadera * Math.PI) / 180);
      return { x: Math.cos(a) * 4.5 * s, y: lado * Math.sin(a) * 4.5 * s };
    };
    let i = 0;
    for (const lado of [-1, 1]) {
      for (let k = 0; k < 4; k++, i++) {
        const p = PATAS[k];
        const pie = st.pies[i];
        const cl = caderaLocal(lado, k);
        const cw = rot(cl.x, cl.y, st.ang);
        const cadera = { x: st.x + cw.x, y: st.y + cw.y };
        // El tarso (último tramo, el más fino) sale del pie hacia la tibia, algo inclinado.
        const haciaCadera = Math.atan2(cadera.y - pie.y, cadera.x - pie.x);
        const curva = (k < 2 ? 1 : -1) * lado; // la rodilla queda hacia afuera, lejos del eje del cuerpo
        const desvio = -curva * 0.12;
        const tobillo = { x: pie.x + Math.cos(haciaCadera + desvio) * p.tarso * s, y: pie.y + Math.sin(haciaCadera + desvio) * p.tarso * s };
        // Al levantar la pata en un paso, la rodilla sube (se acerca al cuerpo en la vista de arriba).
        const elev = pie.levantada || 0;
        const tob = { x: lerp(tobillo.x, cadera.x, elev * 0.18), y: lerp(tobillo.y, cadera.y, elev * 0.18) };
        const rod = rodilla(cadera, tob, p.femur * s, p.tibia * s, curva);
        el.femur[i].setAttribute('d', `M${cadera.x.toFixed(1)} ${cadera.y.toFixed(1)}L${rod.x.toFixed(1)} ${rod.y.toFixed(1)}`);
        el.tibia[i].setAttribute('d', `M${rod.x.toFixed(1)} ${rod.y.toFixed(1)}L${tob.x.toFixed(1)} ${tob.y.toFixed(1)}`);
        el.tarso[i].setAttribute('d', `M${tob.x.toFixed(1)} ${tob.y.toFixed(1)}L${pie.x.toFixed(1)} ${pie.y.toFixed(1)}`);
      }
    }
    const grados = (st.ang * 180) / Math.PI;
    const resp = 1 + Math.sin(st.t * 2.1) * 0.025; // "respira": el abdomen late muy poquito
    el.cuerpo.setAttribute('transform', `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${grados.toFixed(1)})`);
    el.abdomen.setAttribute('transform', `translate(${(-15.5 * s).toFixed(1)} 0) scale(${resp.toFixed(3)})`);
    // Hilo
    if (st.hilo && st.hilo.largo > 0) {
      const boca = rot(9 * s, 0, st.ang);
      const desde = { x: st.x + boca.x, y: st.y + boca.y };
      const hasta = st.hilo.destino;
      const ini = st.hilo.retrae ? { x: lerp(desde.x, hasta.x, st.hilo.retrae), y: lerp(desde.y, hasta.y, st.hilo.retrae) } : desde;
      const fin = { x: lerp(desde.x, hasta.x, st.hilo.largo), y: lerp(desde.y, hasta.y, st.hilo.largo) };
      el.hilo.setAttribute('d', `M${ini.x.toFixed(1)} ${ini.y.toFixed(1)}L${fin.x.toFixed(1)} ${fin.y.toFixed(1)}`);
      el.hilo.style.opacity = '1';
    } else {
      el.hilo.style.opacity = '0';
    }
  }, [s]);

  // Paso a paso de la simulación.
  const avanzar = useCallback((dt) => {
    const st = estado.current;
    st.t += dt;
    // Movimiento del cuerpo hacia el objetivo (con aceleración suave).
    const prevX = st.x;
    const prevY = st.y;
    if (st.mov) {
      const m = st.mov;
      m.t = Math.min(1, m.t + dt / m.dur);
      const e = facil(m.t);
      st.x = lerp(m.desde.x, m.hasta.x, e);
      st.y = lerp(m.desde.y, m.hasta.y, e);
      st.ang = m.desde.ang + anguloCorto(m.desde.ang, m.hasta.ang) * e;
      if (m.t >= 1) { st.mov = null; m.listo?.(); }
    }
    st.vx = (st.x - prevX) / Math.max(dt, 0.001);
    st.vy = (st.y - prevY) / Math.max(dt, 0.001);
    // Hilo
    if (st.hilo) {
      const h = st.hilo;
      h.t += dt;
      if (h.fase === 'sale') { h.largo = salida(Math.min(1, h.t / 0.26)); if (h.t >= 0.26) { h.fase = 'tensa'; h.t = 0; h.alLlegar?.(); } }
      else if (h.fase === 'tensa') { if (h.t >= 0.32) { h.fase = 'recoge'; h.t = 0; } }
      else if (h.fase === 'recoge') { h.retrae = facil(Math.min(1, h.t / 0.34)); if (h.t >= 0.34) st.hilo = null; }
    }
    // Patas: cada una se queda plantada hasta que se estira demasiado; entonces da un paso.
    const enMarcha = Math.hypot(st.vx, st.vy) > 5;
    let i = 0;
    for (const lado of [-1, 1]) {
      for (let k = 0; k < 4; k++, i++) {
        const pie = st.pies[i];
        if (pie.paso) {
          pie.paso.t = Math.min(1, pie.paso.t + dt / pie.paso.dur);
          const e = facil(pie.paso.t);
          const destino = pie.paso.hasta === 'ideal' ? pieIdeal(st, lado, k, 0.09) : pie.paso.hasta;
          pie.x = lerp(pie.paso.desde.x, destino.x, e);
          pie.y = lerp(pie.paso.desde.y, destino.y, e);
          pie.levantada = Math.sin(e * Math.PI);
          if (pie.paso.t >= 1) { pie.paso = null; pie.levantada = 0; }
          continue;
        }
        const ideal = pieIdeal(st, lado, k);
        const grupo = GRUPO(lado, k);
        const otroGrupoPisando = st.pies.some((q, j) => q.paso && GRUPO(j < 4 ? -1 : 1, j % 4) !== grupo);
        // Caminando: paso cuando la pata queda muy estirada. Quieta: se acomoda a su pose limpia
        // (en estrella) aunque esté solo un poco fuera de lugar — así se ve al detenerse.
        const umbral = enMarcha ? 10 * s : 3.5 * s;
        if (dist(pie, ideal) > umbral && !otroGrupoPisando && !(pie.tic > 0)) {
          pie.paso = { desde: { x: pie.x, y: pie.y }, hasta: 'ideal', t: 0, dur: enMarcha ? 0.085 : 0.13 };
        }
        if (pie.tic > 0) pie.tic -= dt;
      }
    }
    // Quieta: de vez en cuando una pata se acomoda (tic), como en la referencia.
    if (!enMarcha && !reducido.current) {
      st.proximoTic -= dt;
      if (st.proximoTic <= 0) {
        st.proximoTic = 0.5 + Math.random() * 1.6;
        const j = Math.floor(Math.random() * 8);
        const pie = st.pies[j];
        if (!pie.paso) {
          const ideal = pieIdeal(st, j < 4 ? -1 : 1, j % 4);
          const a = Math.random() * TAU;
          const r = (1.5 + Math.random() * 2.5) * s;
          pie.paso = { desde: { x: pie.x, y: pie.y }, hasta: { x: ideal.x + Math.cos(a) * r, y: ideal.y + Math.sin(a) * r }, t: 0, dur: 0.12 + Math.random() * 0.1 };
          pie.tic = 0.6 + Math.random() * 1.2;
        }
      }
    }
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arranque y bucle de animación.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    reducido.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const { width, height } = svg.getBoundingClientRect();
    const c = casa(width, height);
    const st = { ...c, vx: 0, vy: 0, t: 0, mov: null, hilo: null, proximoTic: 0.8, pies: [], w: width, h: height };
    estado.current = st;
    for (const lado of [-1, 1]) for (let k = 0; k < 4; k++) { const p = pieIdeal(st, lado, k); st.pies.push({ x: p.x, y: p.y, paso: null, levantada: 0 }); }
    dibujar();

    let raf = 0;
    let ultimo = performance.now();
    let visible = true;
    const cuadro = (ahora) => {
      const dt = Math.min(0.05, (ahora - ultimo) / 1000);
      ultimo = ahora;
      if (visible && !document.hidden) { avanzar(dt); dibujar(); }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; ultimo = performance.now(); });
    io.observe(svg);
    // Si el contenedor cambia de tamaño, la araña vuelve a su esquina.
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      if (Math.abs(w - st.w) < 1 && Math.abs(h - st.h) < 1) return;
      const dx = casa(w, h).x - casa(st.w, st.h).x;
      const dy = casa(w, h).y - casa(st.w, st.h).y;
      st.w = w; st.h = h;
      if (!st.mov) { st.x += dx; st.y += dy; st.pies.forEach((p) => { p.x += dx; p.y += dy; }); }
    });
    ro.observe(svg);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, [casa, dibujar, avanzar]); // eslint-disable-line react-hooks/exhaustive-deps

  const moverA = (hasta, dur) => new Promise((resolve) => {
    const st = estado.current;
    st.mov = { desde: { x: st.x, y: st.y, ang: st.ang }, hasta, t: 0, dur, listo: resolve };
  });

  /**
   * Sale de la esquina, lanza un hilo al punto `destino` ({x, y} en px del contenedor) y vuelve.
   * La promesa se resuelve cuando el hilo LLEGA al destino (el momento de "jalar" algo).
   */
  const buscar = useCallback((destino) => new Promise((resolve) => {
    const st = estado.current;
    if (!st) return resolve();
    if (reducido.current) return resolve();
    const c = casa(st.w, st.h);
    const dir = Math.atan2(destino.y - c.y, destino.x - c.x);
    const afuera = { x: c.x + Math.cos(c.ang) * 58 * s, y: c.y + Math.sin(c.ang) * 58 * s };
    moverA({ ...afuera, ang: lerp(c.ang, c.ang + anguloCorto(c.ang, dir), 0.55) }, 0.62).then(() => {
      st.hilo = { destino, fase: 'sale', t: 0, largo: 0, retrae: 0, alLlegar: () => { resolve(); } };
      setTimeout(() => moverA(c, 0.78), 520);
    });
  }), [casa, s]);  

  /** Entra a su esquina desde fuera del contenedor (para cuando aparece en escena). */
  const entrar = useCallback(() => {
    const st = estado.current;
    if (!st || reducido.current) return;
    const c = casa(st.w, st.h);
    const atras = { x: c.x - Math.cos(c.ang) * 70 * s, y: c.y - Math.sin(c.ang) * 70 * s, ang: c.ang };
    Object.assign(st, { x: atras.x, y: atras.y });
    st.pies.forEach((p, j) => { const q = pieIdeal(st, j < 4 ? -1 : 1, j % 4); p.x = q.x; p.y = q.y; p.paso = null; });
    moverA(c, 0.9);
  }, [casa, s]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({ buscar, entrar }), [buscar, entrar]);

  const alClic = () => {
    const st = estado.current;
    if (!st || st.mov || st.hilo) return;
    buscar({ x: st.w * (0.25 + Math.random() * 0.4), y: st.h * (0.45 + Math.random() * 0.35) });
  };

  const guardar = (grupo) => (el) => { if (el) (partes.current[grupo] ||= [])[Number(el.dataset.i)] = el; };
  const indices = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <svg ref={svgRef} aria-hidden="true" className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 2 }}>
      <defs>
        <radialGradient id={`${idBase}-abd`} cx="40%" cy="34%" r="70%">
          <stop offset="0%" stopColor={paleta.abd[0]} />
          <stop offset="18%" stopColor={paleta.abd[1]} />
          <stop offset="55%" stopColor={paleta.abd[2]} />
          <stop offset="100%" stopColor={paleta.abd[3]} />
        </radialGradient>
        <radialGradient id={`${idBase}-cab`} cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor={paleta.cab[0]} />
          <stop offset="60%" stopColor={paleta.cab[1]} />
          <stop offset="100%" stopColor={paleta.cab[2]} />
        </radialGradient>
        <filter id={`${idBase}-sombra`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx={2.2 * s} dy={3.6 * s} stdDeviation={1.6 * s} floodColor="#000" floodOpacity="0.24" />
        </filter>
      </defs>
      <path ref={(el) => { partes.current.hilo = el; }} stroke={paleta.hilo} strokeOpacity="0.85" strokeWidth={0.9 * s} strokeLinecap="round" fill="none" style={{ opacity: 0 }} />
      <g filter={`url(#${idBase}-sombra)`} stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {indices.map((i) => <path key={`f${i}`} data-i={i} ref={guardar('femur')} strokeWidth={1.95 * s} />)}
        {indices.map((i) => <path key={`t${i}`} data-i={i} ref={guardar('tibia')} strokeWidth={1.45 * s} />)}
        {indices.map((i) => <path key={`p${i}`} data-i={i} ref={guardar('tarso')} strokeWidth={0.9 * s} />)}
        <g ref={(el) => { partes.current.cuerpo = el; }}>
          {/* Abdomen brillante */}
          <g ref={(el) => { partes.current.abdomen = el; }}>
            <ellipse rx={11 * s} ry={8.4 * s} fill={`url(#${idBase}-abd)`} stroke="none" />
            <ellipse cx={-2.2 * s} cy={-3.1 * s} rx={3.6 * s} ry={1.8 * s} fill="#fff" fillOpacity={paleta.brillo} stroke="none" transform={`rotate(-12 ${-2.5 * s} ${-3.6 * s})`} />
          </g>
          {/* Cefalotórax con pelitos */}
          {[-70, -40, -12, 12, 40, 70, 110, -110].map((a) => {
            const r = (a * Math.PI) / 180;
            return <path key={a} d={`M${(Math.cos(r) * 4 * s).toFixed(1)} ${(Math.sin(r) * 4 * s).toFixed(1)}L${(Math.cos(r) * 7.4 * s).toFixed(1)} ${(Math.sin(r) * 7.4 * s).toFixed(1)}`} strokeWidth={0.55 * s} />;
          })}
          <ellipse rx={5.4 * s} ry={4.6 * s} fill={`url(#${idBase}-cab)`} stroke="none" />
          {/* Pedipalpos */}
          <path d={`M${4 * s} ${-2.4 * s}L${8.6 * s} ${-4.2 * s}L${11 * s} ${-2.6 * s}`} strokeWidth={1.1 * s} />
          <path d={`M${4 * s} ${2.4 * s}L${8.6 * s} ${4.2 * s}L${11 * s} ${2.6 * s}`} strokeWidth={1.1 * s} />
          {(interactiva || onTocar) && <circle r={22 * s} fill="transparent" stroke="none" style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={onTocar || alClic} />}
        </g>
      </g>
    </svg>
  );
});

export default Arana;
