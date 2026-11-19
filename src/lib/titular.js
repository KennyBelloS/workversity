// El titular del día: una frase, armada con tus datos, que dice de qué va la jornada.
// No es una plantilla con huecos: cambia de forma según lo que pesa hoy (lo atrasado manda
// sobre lo ocupado, y lo ocupado sobre lo tranquilo), para que no suene a robot repitiendo.

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/**
 * "8 h", "45 min", "2 h y media", "2 h 05 min".
 * Ojo: esto termina dentro de una frase ("Hoy tienes ___"), así que no puede quedar colgando
 * un número suelto como "2 h 30"; o se dice la unidad, o se dice "y media".
 */
export function horasDe(minutos) {
  const m = Math.round(minutos);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `${h} h`;
  if (r === 30) return `${h} h y media`;
  return `${h} h ${String(r).padStart(2, '0')} min`;
}

/**
 * @param {object} d
 * @param {number} d.vencidas    Tareas que ya se pasaron de fecha.
 * @param {number} d.hoyEntregas Entregas que vencen hoy.
 * @param {number} d.minutosOcupados Minutos de clase, trabajo y reuniones de hoy.
 * @param {number} d.bloques     Cuántos bloques son.
 * @param {boolean} d.finDeSemana
 * @returns {{titular: string, resaltado: string, bajada: string}}
 */
export function titularDelDia({ vencidas = 0, hoyEntregas = 0, minutosOcupados = 0, bloques = 0, finDeSemana = false }) {
  const ocupado = minutosOcupados >= 60;
  const tiempo = horasDe(minutosOcupados);

  if (vencidas > 0) {
    return {
      titular: 'Primero ponte al día:',
      resaltado: plural(vencidas, 'entrega atrasada', 'entregas atrasadas'),
      bajada: ocupado
        ? `y hoy ya tienes ${tiempo} ocupadas entre clases y trabajo.`
        : 'el día está despejado, así que es buen momento.',
    };
  }

  if (hoyEntregas > 0) {
    return {
      titular: 'Hoy se vencen',
      resaltado: plural(hoyEntregas, 'entrega', 'entregas'),
      bajada: ocupado ? `con ${tiempo} de clases y trabajo de por medio.` : 'y el resto del día lo tienes libre.',
    };
  }

  if (ocupado) {
    return {
      titular: 'Hoy tienes',
      resaltado: tiempo,
      bajada: `repartidas en ${plural(bloques, 'bloque', 'bloques')}. Nada vence hoy.`,
    };
  }

  if (finDeSemana) {
    return { titular: 'Fin de semana.', resaltado: 'Nada en la agenda', bajada: 'buen momento para adelantar lo de la otra semana.' };
  }

  return { titular: 'El día está', resaltado: 'despejado', bajada: 'ni clases ni entregas. Tú decides qué hacer con él.' };
}
