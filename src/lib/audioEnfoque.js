// Sonidos para concentrarse (generados en el dispositivo, funcionan sin internet) y pitido de aviso.
export const SONIDOS = [
  { id: 'blanco', nombre: 'Ruido blanco', emoji: '🌫️' },
  { id: 'rosa', nombre: 'Ruido rosa', emoji: '🌸' },
  { id: 'marron', nombre: 'Ruido marrón', emoji: '🟤' },
  { id: 'lluvia', nombre: 'Lluvia', emoji: '🌧️' },
];

let ctx = null;
let fuente = null;
let ganancia = null;
let activo = null;

const audio = () => {
  if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function bufferRuido(c, tipo) {
  const largo = c.sampleRate * 4;
  const b = c.createBuffer(1, largo, c.sampleRate);
  const d = b.getChannelData(0);
  let ultimo = 0; let b0 = 0; let b1 = 0; let b2 = 0;
  for (let i = 0; i < largo; i++) {
    const blanco = Math.random() * 2 - 1;
    if (tipo === 'marron') { ultimo = (ultimo + 0.02 * blanco) / 1.02; d[i] = ultimo * 3.5; }
    else if (tipo === 'rosa') { b0 = 0.99765 * b0 + blanco * 0.099046; b1 = 0.963 * b1 + blanco * 0.2965164; b2 = 0.57 * b2 + blanco * 1.0526913; d[i] = (b0 + b1 + b2 + blanco * 0.1848) * 0.2; }
    else d[i] = blanco * 0.5;
  }
  return b;
}

export function iniciarSonido(id, volumen = 0.35) {
  const c = audio();
  if (!c) return false;
  detenerSonido();
  fuente = c.createBufferSource();
  fuente.buffer = bufferRuido(c, id === 'lluvia' ? 'blanco' : id);
  fuente.loop = true;
  ganancia = c.createGain();
  ganancia.gain.value = volumen;
  if (id === 'lluvia') {
    const filtro = c.createBiquadFilter();
    filtro.type = 'bandpass'; filtro.frequency.value = 3200; filtro.Q.value = 0.5;
    fuente.connect(filtro); filtro.connect(ganancia);
  } else fuente.connect(ganancia);
  ganancia.connect(c.destination);
  fuente.start();
  activo = id;
  return true;
}
export function detenerSonido() {
  try { fuente?.stop(); } catch { /* ya detenido */ }
  fuente = null; ganancia = null; activo = null;
}
export const ponerVolumen = (v) => { if (ganancia) ganancia.gain.value = v; };
export const sonidoActivo = () => activo;

/** Pitido corto para avisar que terminó una sesión o un descanso. */
export function pitido(veces = 2) {
  const c = audio();
  if (!c) return;
  for (let i = 0; i < veces; i++) {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, c.currentTime + i * 0.35);
    g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + i * 0.35 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + i * 0.35 + 0.28);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + i * 0.35); o.stop(c.currentTime + i * 0.35 + 0.3);
  }
}
