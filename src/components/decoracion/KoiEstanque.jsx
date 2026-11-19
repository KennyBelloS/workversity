import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------------------------
// Estanque de koi (referencia: el estanque de peces hechos de cuadritos con símbolos).
// Cada pez es una "columna vertebral" de segmentos que sigue a la cabeza; el cuerpo, las aletas
// y la cola se rasterizan sobre una cuadrícula y cada celda se dibuja como un cuadrito redondeado
// con un símbolo tenue adentro. Los peces nadan con rumbo errante, se apartan del puntero, y en el
// agua aparecen ondas dibujadas con caracteres ("- - -", "/", "\"). Las manchas de los koi usan el
// color de acento elegido en Ajustes; el resto, blancos y grises.
// ---------------------------------------------------------------------------------------------

const TAU = Math.PI * 2;
const SIMBOLOS = ['%', 'x', 's', '#', '*', '+'];

function azar(semilla) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const leerRgb = (el, nombre, defecto) => {
  const v = getComputedStyle(el).getPropertyValue(nombre).trim();
  const p = v.split(/\s+/).map(Number);
  return p.length >= 3 && p.every((n) => !Number.isNaN(n)) ? p.slice(0, 3) : defecto;
};
const mezcla = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));

/** Ancho del cuerpo a lo largo del pez (t: 0 = cabeza, 1 = punta de la cola). */
function perfil(t) {
  if (t < 0.1) return 0.45 + Math.sqrt(t / 0.1) * 0.45;
  if (t < 0.32) return 0.9 + (t - 0.1) * 0.45;
  if (t < 0.84) return 1 - ((t - 0.32) / 0.52) ** 2.1 * 0.74;
  return 0.26;
}

function crearPez(r, w, h, k) {
  const esc = Math.max(0.85, Math.min(1, Math.min(w, h) / 460));
  const largo = 13 + Math.floor(r() * 4); // segmentos
  const sep = (8 + r() * 2.5) * esc;
  const x = w * 0.15 + r() * w * 0.7;
  const y = h * 0.15 + r() * h * 0.7;
  const ang = r() * TAU;
  const pts = Array.from({ length: largo }, (_, i) => ({ x: x - Math.cos(ang) * i * sep, y: y - Math.sin(ang) * i * sep }));
  const tipos = ['kohaku', 'kohaku', 'showa', 'ogon', 'tancho', 'kohaku'];
  return {
    pts, sep, ang, vel: 0.8 + r() * 0.5, ancho: (14 + r() * 6) * esc, giro: 0, objetivo: r() * TAU, cambio: 0,
    prof: 0.45 + r() * 0.55, tipo: tipos[k % tipos.length], semilla: Math.floor(r() * 1e6), fase: r() * TAU,
  };
}

export default function KoiEstanque({ className = '', cuantos = 7, celda = 11, tema = 'oscuro', interactivo = true, intensidad = 1 }) {
  const lienzo = useRef(null);

  useEffect(() => {
    const cv = lienzo.current;
    if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const r = azar(20261115);
    let W = 0; let H = 0; let dpr = 1;
    let peces = [];
    let ondas = [];
    let bolitas = [];
    const puntero = { x: -9999, y: -9999, activo: false };

    const colores = () => {
      const acento = leerRgb(cv, '--primary', [46, 75, 240]);
      const coral = leerRgb(cv, '--coral', [240, 100, 78]);
      const oscuro = tema === 'oscuro';
      const fondo = oscuro ? [20, 20, 18] : [250, 249, 246];
      // La mancha del koi: el acento, llevado un poco hacia el coral para que se lea "koi".
      const mancha = mezcla(mezcla(acento, coral, 0.3), [255, 255, 255], tema === 'oscuro' ? 0.18 : 0);
      return { fondo, mancha, manchaOscura: mezcla(mancha, [0, 0, 0], 0.35), blanco: oscuro ? [224, 222, 216] : [214, 212, 206], gris: oscuro ? [92, 92, 88] : [170, 168, 162], negro: oscuro ? [52, 52, 50] : [70, 70, 66], tinta: oscuro ? [120, 120, 114] : [150, 148, 142], oscuro };
    };
    let C = colores();

    const medir = () => {
      const b = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, b.width); H = Math.max(1, b.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!peces.length) peces = Array.from({ length: cuantos }, (_, k) => crearPez(r, W, H, k));
      C = colores();
    };
    medir();
    // Ondas fijas tenues (como los octágonos de la referencia).
    ondas = Array.from({ length: 6 }, () => ({ x: r() * W, y: r() * H, rad: 28 + r() * 60, vida: 1, fija: true, t: r() * 10 }));

    const patron = (p, t, lado) => {
      // Manchas suaves y estables por pez: ruido barato con senos.
      const s = p.semilla;
      const n = Math.sin(t * 13 + s) * 0.5 + Math.sin(t * 29 + s * 0.37 + lado * 1.7) * 0.35 + Math.sin(lado * 3.1 + s * 0.11) * 0.25;
      if (p.tipo === 'ogon') return n > 0.55 ? 'gris' : 'blanco';
      if (p.tipo === 'tancho') return t < 0.14 && Math.abs(lado) < 0.6 ? 'mancha' : 'blanco';
      if (p.tipo === 'showa') return n > 0.45 ? 'negro' : n > -0.15 ? 'mancha' : 'blanco';
      return n > 0.05 ? 'mancha' : 'blanco';
    };

    const rasterizar = (p, mapa) => {
      const pts = p.pts;
      const n = pts.length;
      let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
      for (const q of pts) { minX = Math.min(minX, q.x); minY = Math.min(minY, q.y); maxX = Math.max(maxX, q.x); maxY = Math.max(maxY, q.y); }
      const m = p.ancho * 2.2;
      const c0 = Math.floor((minX - m) / celda); const c1 = Math.ceil((maxX + m) / celda);
      const f0 = Math.floor((minY - m) / celda); const f1 = Math.ceil((maxY + m) / celda);
      const ondula = Math.sin(performance.now() / 260 + p.fase);
      for (let f = f0; f <= f1; f++) {
        for (let c = c0; c <= c1; c++) {
          const px = c * celda + celda / 2; const py = f * celda + celda / 2;
          if (px < -celda || py < -celda || px > W + celda || py > H + celda) continue;
          // Distancia a la columna vertebral y parámetro t.
          let mejor = Infinity; let tMejor = 0; let ladoMejor = 0;
          for (let i = 0; i < n - 1; i++) {
            const a = pts[i]; const b = pts[i + 1];
            const dx = b.x - a.x; const dy = b.y - a.y; const l2 = dx * dx + dy * dy || 1;
            let u = ((px - a.x) * dx + (py - a.y) * dy) / l2; u = Math.max(0, Math.min(1, u));
            const qx = a.x + dx * u; const qy = a.y + dy * u;
            const d = Math.hypot(px - qx, py - qy);
            if (d < mejor) { mejor = d; tMejor = (i + u) / (n - 1); ladoMejor = Math.sign(dx * (py - a.y) - dy * (px - a.x)) || 1; }
          }
          let cuerpo = perfil(tMejor) * p.ancho;
          let parte = 'cuerpo';
          // Aletas pectorales (a ~22%) que se abren y cierran al nadar.
          if (tMejor > 0.18 && tMejor < 0.32) {
            const a = 1 - Math.abs(tMejor - 0.25) / 0.07;
            const aleta = p.ancho * (0.95 + 0.5 * a * (0.7 + 0.3 * ondula));
            if (mejor > cuerpo && mejor < aleta) { cuerpo = aleta; parte = 'aleta'; }
          }
          // Cola en abanico.
          if (tMejor > 0.8) {
            const a = (tMejor - 0.8) / 0.2;
            const cola = p.ancho * (0.18 + a * a * 0.85);
            if (mejor < cola) { cuerpo = cola; parte = 'cola'; }
          }
          if (mejor > cuerpo) continue;
          const borde = mejor / Math.max(1, cuerpo);
          const clave = `${c},${f}`;
          const previo = mapa.get(clave);
          if (previo && previo.prof > p.prof) continue;
          const lado = (ladoMejor * mejor) / Math.max(1, p.ancho);
          mapa.set(clave, { c, f, prof: p.prof, parte, borde, tono: parte === 'cuerpo' ? patron(p, tMejor, lado) : 'gris', t: tMejor, pez: p });
        }
      }
      // Ojos
      const cab = pts[0]; const sig = pts[1];
      const a = Math.atan2(cab.y - sig.y, cab.x - sig.x);
      for (const s of [-1, 1]) {
        const ex = cab.x + Math.cos(a) * 2 + Math.cos(a + (s * Math.PI) / 2) * p.ancho * 0.45;
        const ey = cab.y + Math.sin(a) * 2 + Math.sin(a + (s * Math.PI) / 2) * p.ancho * 0.45;
        const clave = `${Math.floor(ex / celda)},${Math.floor(ey / celda)}`;
        const e = mapa.get(clave);
        if (e && e.pez === p) e.ojo = true;
      }
    };

    const actualizar = (dt) => {
      for (const p of peces) {
        const cab = p.pts[0];
        p.cambio -= dt;
        if (p.cambio <= 0) { p.objetivo = p.ang + (r() - 0.5) * 2.2; p.cambio = 1.5 + r() * 3; }
        // Ir hacia una bolita de comida cercana.
        const comida = bolitas.find((b) => Math.hypot(b.x - cab.x, b.y - cab.y) < 220);
        if (comida) p.objetivo = Math.atan2(comida.y - cab.y, comida.x - cab.x);
        // Bordes: girar hacia el centro si se aleja mucho.
        // Bordes: antes de salir, vira suavemente hacia el centro (como si chocara con la orilla).
        const mx = Math.min(90, W * 0.18);
        const my = Math.min(90, H * 0.18);
        if (cab.x < mx || cab.x > W - mx || cab.y < my || cab.y > H - my) {
          const haciaCentro = Math.atan2(H / 2 - cab.y + (r() - 0.5) * H * 0.4, W / 2 - cab.x + (r() - 0.5) * W * 0.4);
          const fuera = Math.cos(p.ang - haciaCentro) < 0.3;
          if (fuera) { p.objetivo = haciaCentro; p.cambio = Math.max(p.cambio, 1.2); }
        }
        // Huir del puntero.
        let prisa = 1;
        if (puntero.activo) {
          const d = Math.hypot(puntero.x - cab.x, puntero.y - cab.y);
          if (d < 130) { p.objetivo = Math.atan2(cab.y - puntero.y, cab.x - puntero.x); prisa = 1 + (130 - d) / 50; }
        }
        // Separarse un poco de los demás.
        for (const o of peces) {
          if (o === p) continue;
          const d = Math.hypot(o.pts[0].x - cab.x, o.pts[0].y - cab.y);
          if (d < p.ancho * 3.2) p.objetivo += 0.05 * Math.sign(Math.sin(p.ang - Math.atan2(o.pts[0].y - cab.y, o.pts[0].x - cab.x)) || 1);
        }
        let dif = ((p.objetivo - p.ang + Math.PI) % TAU + TAU) % TAU - Math.PI;
        const antes = p.ang;
        const v = p.vel * 30 * prisa * (0.85 + 0.15 * Math.sin(performance.now() / 400 + p.fase));
        // Radio de giro mínimo proporcional al largo del pez: nunca se enrosca sobre sí mismo.
        const radio = p.sep * p.pts.length * 0.55;
        const maxGiro = (v / radio) * dt;
        p.ang += Math.max(-maxGiro, Math.min(maxGiro, dif * 2 * dt * prisa));
        p.giro = (p.ang - antes) / Math.max(dt, 0.001);
        // La cabeza avanza con un leve vaivén lateral; el resto sigue como una cadena.
        const vaiven = Math.sin(performance.now() / 180 + p.fase) * 0.35;
        cab.x += Math.cos(p.ang + vaiven * 0.25) * v * dt;
        cab.y += Math.sin(p.ang + vaiven * 0.25) * v * dt;
        let dirPrev = p.ang + Math.PI; // dirección "hacia atrás" del segmento anterior
        for (let i = 1; i < p.pts.length; i++) {
          const a = p.pts[i - 1]; const b = p.pts[i];
          let ang = Math.atan2(b.y - a.y, b.x - a.x);
          // Rigidez de la columna: cada vértebra se dobla como máximo ~14° respecto de la anterior.
          const d = ((ang - dirPrev + Math.PI) % TAU + TAU) % TAU - Math.PI;
          const lim = 0.24;
          if (d > lim) ang = dirPrev + lim; else if (d < -lim) ang = dirPrev - lim;
          b.x = a.x + Math.cos(ang) * p.sep;
          b.y = a.y + Math.sin(ang) * p.sep;
          dirPrev = ang;
        }
        // Un giro brusco deja una onda.
        if (Math.abs(p.giro) > 0.5 && r() < 0.03) ondas.push({ x: cab.x, y: cab.y, rad: 6, vida: 1 });
        dif = 0;
      }
      bolitas = bolitas.filter((b) => {
        b.vida -= dt * 0.08;
        for (const p of peces) if (Math.hypot(p.pts[0].x - b.x, p.pts[0].y - b.y) < 9) { ondas.push({ x: b.x, y: b.y, rad: 4, vida: 0.8 }); return false; }
        return b.vida > 0;
      });
      if (bolitas.length < 2 && r() < dt * 0.06) { const x = 40 + r() * (W - 80); const y = 40 + r() * (H - 80); for (let i = 0; i < 4; i++) bolitas.push({ x: x + (r() - 0.5) * 30, y: y + (r() - 0.5) * 20, vida: 1 }); }
      ondas = ondas.filter((o) => { if (o.fija) { o.t += dt; return true; } o.rad += dt * 34; o.vida -= dt * 0.45; return o.vida > 0; });
    };

    const octagono = (o, alfa) => {
      // Contorno octogonal hecho con caracteres.
      const pasos = Math.max(8, Math.round((o.rad * TAU) / (celda * 1.15)));
      ctx.fillStyle = `rgba(${C.tinta.join(',')},${alfa})`;
      for (let i = 0; i < pasos; i++) {
        const a = (i / pasos) * TAU;
        const k = Math.round((a / TAU) * 8) % 8;
        const lado = Math.cos(Math.PI / 8) / Math.cos(((a % (TAU / 8)) - TAU / 16));
        const x = o.x + Math.cos(a) * o.rad * lado;
        const y = o.y + Math.sin(a) * o.rad * lado;
        const ch = k === 0 || k === 4 ? '|' : k === 2 || k === 6 ? '-' : k === 1 || k === 5 ? '\\' : '/';
        if (i % 2 === 0) ctx.fillText(ch, x, y);
      }
    };

    const dibujar = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgb(${C.fondo.join(',')})`;
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${Math.round(celda * 0.82)}px "Geist Mono Variable", ui-monospace, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const o of ondas) octagono(o, o.fija ? 0.26 + 0.08 * Math.sin(o.t) : 0.5 * o.vida);
      // Bolitas de comida
      ctx.fillStyle = `rgba(${C.mancha.join(',')},.75)`;
      for (const b of bolitas) { ctx.beginPath(); ctx.arc(b.x, b.y, 1.7, 0, TAU); ctx.fill(); }
      const mapa = new Map();
      for (const p of [...peces].sort((a, b) => a.prof - b.prof)) rasterizar(p, mapa);
      const lado = celda - 1.6;
      for (const e of mapa.values()) {
        let base = C[e.tono] || C.blanco;
        if (e.tono === 'mancha' && e.borde > 0.72) base = C.manchaOscura;
        const prof = 0.45 + e.pez.prof * 0.55;
        let alfa = prof * (e.parte === 'cuerpo' ? 1 - Math.max(0, e.borde - 0.82) * 2.2 : e.parte === 'aleta' ? 0.55 : 0.45);
        if (e.parte !== 'cuerpo') base = C.gris;
        alfa = Math.max(0.12, Math.min(1, alfa)) * intensidad;
        const x = e.c * celda + 0.8; const y = e.f * celda + 0.8;
        ctx.fillStyle = `rgba(${base.join(',')},${alfa})`;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, lado, lado, 2); else ctx.rect(x, y, lado, lado);
        ctx.fill();
        if (e.ojo) { ctx.fillStyle = `rgba(${C.oscuro ? '10,10,10' : '20,20,20'},${alfa})`; ctx.beginPath(); ctx.arc(x + lado / 2, y + lado / 2, 1.6, 0, TAU); ctx.fill(); continue; }
        if (e.parte === 'cuerpo' && alfa > 0.35) {
          ctx.fillStyle = `rgba(0,0,0,${0.22 * alfa})`;
          ctx.fillText(SIMBOLOS[(e.c * 7 + e.f * 13 + (e.pez.semilla % 5)) % SIMBOLOS.length], x + lado / 2, y + lado / 2 + 0.5);
        }
      }
    };

    let raf = 0; let ultimo = performance.now(); let visible = true;
    const cuadro = (t) => {
      const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
      if (visible && !document.hidden) { if (!reducido) actualizar(dt); dibujar(); }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    const ro = new ResizeObserver(medir); ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(cv);
    // El acento puede cambiar en Ajustes: se vuelve a leer cuando cambia el tema/acento.
    const mo = new MutationObserver(() => { C = colores(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    const posicion = (e) => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    const mover = (e) => { const p = posicion(e); puntero.x = p.x; puntero.y = p.y; puntero.activo = p.x >= 0 && p.y >= 0 && p.x <= W && p.y <= H; };
    const salir = () => { puntero.activo = false; };
    const tocar = (e) => { const p = posicion(e); if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) return; ondas.push({ ...p, rad: 4, vida: 1 }); for (let i = 0; i < 3; i++) bolitas.push({ x: p.x + (r() - 0.5) * 24, y: p.y + (r() - 0.5) * 18, vida: 1 }); };
    if (interactivo) {
      window.addEventListener('pointermove', mover, { passive: true });
      window.addEventListener('pointerdown', tocar, { passive: true });
      document.addEventListener('pointerleave', salir);
    }
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect();
      window.removeEventListener('pointermove', mover); window.removeEventListener('pointerdown', tocar); document.removeEventListener('pointerleave', salir);
    };
  }, [cuantos, celda, tema, interactivo, intensidad]);

  return <canvas ref={lienzo} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
