import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DIAS_SEMANA } from '../../lib/constants';
import { TIPOS_AGENDA, inicioDeSemana, sumarDias, mismoDia, resumenDeSemana } from '../../lib/agenda';
import { RAPIDO } from '../../lib/movimiento';
import { ICONO_TIPO } from './iconosTipo';

// ---------------------------------------------------------------------------------------------
// Panel de la semana — SOLO computador. Tercera versión.
//
// Antes era casi un segundo dashboard: cifra, pares, barras de carga por día, filtros con su
// propia barra de proporción y un mini-mes siempre presente como acordeón. Competía con la
// rejilla en vez de acompañarla. Ahora es un resumen que se lee en dos segundos: una cifra
// protagonista y silenciosa, dos datos sueltos, y la lista de categorías como lo que de verdad
// es — un filtro, no un segundo gráfico. El salto de mes se fue a un popover en la cabecera
// (Horario.jsx), así el panel no vuelve a crecer por algo que no se usa todos los días.
// ---------------------------------------------------------------------------------------------

const horasTexto = (min) => {
  const h = Math.floor(min / 60);
  const r = Math.round(min % 60);
  if (!h && !r) return '0 h';
  return `${h ? `${h} h` : ''}${r ? ` ${r} min` : ''}`.trim();
};

export function MesChico({ semana, onSemana }) {
  const [mes, setMes] = useState(() => new Date(semana.getFullYear(), semana.getMonth(), 1));
  const hoy = new Date();
  const finSemana = sumarDias(semana, 6);

  const celdas = useMemo(() => {
    const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const inicio = inicioDeSemana(primero);
    return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i));
  }, [mes]);

  const mover = (n) => setMes(new Date(mes.getFullYear(), mes.getMonth() + n, 1));

  return (
    <div className="pn-mes">
      <div className="pn-mes-cab">
        <button type="button" onClick={() => mover(-1)} aria-label="Mes anterior" className="pn-mes-b"><ChevronLeft size={14} /></button>
        <span className="pn-mes-t">{mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</span>
        <button type="button" onClick={() => mover(1)} aria-label="Mes siguiente" className="pn-mes-b"><ChevronRight size={14} /></button>
      </div>
      <div className="pn-mes-rejilla" role="grid">
        {DIAS_SEMANA.map((d) => <span key={d} className="pn-mes-d" aria-hidden="true">{d[0]}</span>)}
        {celdas.map((f) => {
          const otro = f.getMonth() !== mes.getMonth();
          const dentro = f >= semana && f <= finSemana;
          return (
            <button
              key={f.toISOString()}
              type="button"
              onClick={() => onSemana(inicioDeSemana(f))}
              aria-label={f.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              className={`pn-mes-c ${otro ? 'pn-mes-c--otro' : ''} ${dentro ? 'pn-mes-c--dentro' : ''} ${mismoDia(f, hoy) ? 'pn-mes-c--hoy' : ''}`}
            >
              {f.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PanelSemana({ eventos, ocultos, onAlternar, conteo }) {
  const r = useMemo(() => resumenDeSemana(eventos), [eventos]);

  return (
    <aside className="pn" aria-label="Resumen y filtros de la semana">
      <div className="pn-hero">
        <p className="rotulo">La semana en números</p>
        <p className="pn-cifra">{horasTexto(r.minutos)}</p>
        <p className="pn-nota">de clases, trabajo y reuniones</p>
        <div className="pn-pares">
          <div>
            <span className="pn-par-n">{r.pendientes}</span>
            <span className="pn-par-t">{r.pendientes === 1 ? 'entrega' : 'entregas'}</span>
          </div>
          <div>
            <span className="pn-par-n">{r.masCargado === null ? '—' : DIAS_SEMANA[r.masCargado].slice(0, 3)}</span>
            <span className="pn-par-t">día más cargado</span>
          </div>
        </div>
      </div>

      <div className="pn-leyenda" role="group" aria-label="Qué se ve">
        <p className="rotulo">Qué se ve</p>
        {Object.entries(TIPOS_AGENDA).map(([tipo, info]) => {
          const off = ocultos.includes(tipo);
          const Icono = ICONO_TIPO[tipo];
          return (
            <motion.button
              key={tipo}
              type="button"
              whileTap={{ scale: 0.98 }}
              transition={RAPIDO}
              role="switch"
              aria-checked={!off}
              onClick={() => onAlternar(tipo)}
              className={`pn-ley-i ${off ? 'pn-ley-i--off' : ''}`}
              style={{ '--c': info.color }}
            >
              <span className="pn-ley-punto" aria-hidden="true" />
              <Icono size={13} strokeWidth={2} className="pn-ley-ico" aria-hidden="true" />
              <span className="pn-ley-t">{info.label}</span>
              <span className="pn-ley-n">{conteo(tipo)}</span>
            </motion.button>
          );
        })}
      </div>
    </aside>
  );
}
