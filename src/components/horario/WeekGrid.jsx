import { DIAS_SEMANA } from '../../lib/constants';
import { minutosAHora } from '../../lib/dateUtils';

const INICIO_DIA = 6 * 60; // 6:00 am
const FIN_DIA = 22 * 60; // 10:00 pm
const PX_POR_MINUTO = 1.1;

export default function WeekGrid({ bloques, onOpen }) {
  const horas = [];
  for (let m = INICIO_DIA; m <= FIN_DIA; m += 60) horas.push(m);

  const alturaTotal = (FIN_DIA - INICIO_DIA) * PX_POR_MINUTO;

  return (
    <div className="overflow-x-auto rounded-md2 bg-white p-3 shadow-card">
      <div className="flex min-w-[760px]">
        <div className="w-14 shrink-0">
          <div className="h-10" />
          {horas.map((h) => (
            <div key={h} style={{ height: 60 * PX_POR_MINUTO }} className="relative">
              <span className="absolute -top-2 text-[10px] font-semibold text-textSecondary">{minutosAHora(h)}</span>
            </div>
          ))}
        </div>

        {DIAS_SEMANA.map((nombre, i) => {
          const dia = i + 1;
          const bloquesDelDia = bloques.filter((b) => b.day_of_week === dia);
          return (
            <div key={dia} className="relative flex-1 border-l border-black/5">
              <div className="flex h-10 items-center justify-center text-xs font-extrabold text-textPrimary">{nombre.slice(0, 3)}</div>
              <div className="relative" style={{ height: alturaTotal }}>
                {horas.map((h) => (
                  <div key={h} className="absolute w-full border-t border-black/5" style={{ top: (h - INICIO_DIA) * PX_POR_MINUTO }} />
                ))}
                {bloquesDelDia.map((b) => {
                  const top = (b.start_minutes - INICIO_DIA) * PX_POR_MINUTO;
                  const alto = Math.max((b.end_minutes - b.start_minutes) * PX_POR_MINUTO, 24);
                  return (
                    <button
                      key={b.id}
                      onClick={() => onOpen(b)}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1.5 py-1 text-left shadow-sm"
                      style={{ top, height: alto, backgroundColor: `${b.color_value}20`, borderLeft: `3px solid ${b.color_value}` }}
                    >
                      <p className="truncate text-[10.5px] font-bold" style={{ color: b.color_value }}>{b.title}</p>
                      {alto > 32 && <p className="truncate text-[9px] text-textSecondary">{b.location}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
