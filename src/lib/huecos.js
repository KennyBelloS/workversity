// Huecos libres del día para estudiar, y propuesta de en cuál hacer cada tarea.

const M = 60000;

export function calcularHuecos(eventos, { ahora = new Date(), desde = 7 * 60, hasta = 21 * 60, minimo = 45 } = {}) {
  const dia = new Date(ahora);
  const abre = new Date(dia); abre.setHours(0, 0, 0, 0); abre.setMinutes(desde);
  const cierra = new Date(dia); cierra.setHours(0, 0, 0, 0); cierra.setMinutes(hasta);
  let cursor = new Date(Math.max(abre.getTime(), Math.ceil(ahora.getTime() / (5 * M)) * 5 * M));
  const ocupados = eventos
    .filter((e) => e.origen !== 'tarea' && e.fin > cursor && e.inicio < cierra)
    .sort((a, b) => a.inicio - b.inicio);
  const huecos = [];
  for (const e of ocupados) {
    if (e.inicio.getTime() - cursor.getTime() >= minimo * M) huecos.push({ inicio: new Date(cursor), fin: new Date(e.inicio) });
    if (e.fin > cursor) cursor = new Date(e.fin);
  }
  if (cierra.getTime() - cursor.getTime() >= minimo * M) huecos.push({ inicio: new Date(cursor), fin: new Date(cierra) });
  return huecos.map((h) => ({ ...h, minutos: Math.round((h.fin - h.inicio) / M) }));
}

/**
 * Reparte las tareas recomendadas en los huecos (con descanso entre una y otra).
 * Aprende de tus hábitos si se le indica: `factor` corrige cuánto tardas de verdad y
 * `preferirHoras` (Set de horas 0–23) coloca las tareas exigentes dentro de tus mejores horas.
 */
export function asignarAHuecos(huecos, tareas, { porDefecto = 50, descanso = 10, factor = 1, preferirHoras = null } = {}) {
  const plan = [];
  let libres = huecos.map((h) => ({ inicio: h.inicio.getTime(), fin: h.fin.getTime() }));
  const solape = (ini, dur) => {
    if (!preferirHoras) return 0;
    let n = 0;
    for (let t = ini; t < ini + dur; t += 15 * M) if (preferirHoras.has(new Date(t).getHours())) n++;
    return n;
  };
  for (const t of tareas) {
    const base = t.estimated_minutes || porDefecto;
    const necesita = Math.max(25, Math.min(Math.round(base * factor), 120)) * M;
    const exigente = t.priority === 'alta' || base >= 60;
    let mejor = null;
    for (const x of libres) {
      if (x.fin - x.inicio < Math.min(necesita, 45 * M)) continue;
      const dur = Math.min(necesita, x.fin - x.inicio);
      const inicios = exigente && preferirHoras ? [] : [x.inicio];
      if (exigente && preferirHoras) for (let s = x.inicio; s + dur <= x.fin; s += 15 * M) inicios.push(s);
      for (const s of inicios) {
        const sc = solape(s, dur);
        if (!mejor || sc > mejor.sc || (sc === mejor.sc && s < mejor.s)) mejor = { x, s, dur, sc };
      }
    }
    if (!mejor) break;
    plan.push({ tarea: t, inicio: new Date(mejor.s), fin: new Date(mejor.s + mejor.dur), enTuMejorHora: mejor.sc > 0, minutos: Math.round(mejor.dur / M) });
    // el hueco se parte: lo que queda antes y después sigue disponible
    libres = libres.flatMap((x) => (x !== mejor.x ? [x] : [{ inicio: x.inicio, fin: mejor.s - descanso * M }, { inicio: mejor.s + mejor.dur + descanso * M, fin: x.fin }].filter((y) => y.fin - y.inicio > 0)));
  }
  return plan.sort((a, b) => a.inicio - b.inicio);
}
