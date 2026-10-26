import { useEffect, useState } from 'react';
import { Check, Video } from 'lucide-react';
import { DIAS_SEMANA } from '../../lib/constants';
import { minutosAHora } from '../../lib/dateUtils';
import { previewDeEvento } from '../../lib/preview';
import { sumarDias, mismoDia, repartirCarriles } from '../../lib/agenda';

const PX_HORA = 56;

export default function AgendaSemana({ inicioSemana, eventos, onAbrir }) {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // El rango de horas se ajusta a lo que haya (mínimo 6:00 a 22:00).
  let desde = 6;
  let hasta = 22;
  for (const e of eventos) {
    desde = Math.min(desde, e.inicio.getHours());
    hasta = Math.max(hasta, e.fin.getHours() + (e.fin.getMinutes() > 0 ? 1 : 0));
  }
  hasta = Math.min(24, Math.max(hasta, desde + 4));
  const horas = [];
  for (let h = desde; h <= hasta; h++) horas.push(h);
  const alto = (hasta - desde) * PX_HORA;
  const minutosDesde = (fecha) => (fecha.getHours() * 60 + fecha.getMinutes() - desde * 60) * (PX_HORA / 60);

  return (
    <div className="overflow-x-auto rounded-md2 bg-white p-3 shadow-card">
      <div className="flex min-w-[820px]">
        <div className="w-12 shrink-0">
          <div className="h-12" />
          <div className="relative" style={{ height: alto }}>
            {horas.map((h) => (
              <span key={h} className="absolute -translate-y-1/2 text-[10px] font-semibold text-textSecondary" style={{ top: (h - desde) * PX_HORA }}>
                {minutosAHora(h * 60)}
              </span>
            ))}
          </div>
        </div>

        {DIAS_SEMANA.map((nombre, i) => {
          const fecha = sumarDias(inicioSemana, i);
          const esHoy = mismoDia(fecha, ahora);
          const delDia = repartirCarriles(eventos.filter((e) => e.dia === i));
          return (
            <div key={nombre} className={`relative min-w-0 flex-1 border-l border-black/5 ${esHoy ? 'bg-primarySoft/40' : ''}`}>
              <div className="flex h-12 flex-col items-center justify-center">
                <span className="text-[11px] font-bold text-textSecondary">{nombre.slice(0, 3)}</span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${esHoy ? 'bg-primary text-white' : 'text-textPrimary'}`}>
                  {fecha.getDate()}
                </span>
              </div>
              <div className="relative" style={{ height: alto }}>
                {horas.map((h) => (
                  <div key={h} className="absolute w-full border-t border-black/5" style={{ top: (h - desde) * PX_HORA }} />
                ))}

                {delDia.map(({ evento: e, carril, carriles }) => {
                  const top = Math.max(0, minutosDesde(e.inicio));
                  const h = Math.max((e.fin - e.inicio) / 60000 * (PX_HORA / 60), 26);
                  const esTarea = e.origen === 'tarea';
                  return (
                    <button
                      key={e.id}
                      onClick={() => onAbrir(e)}
                      {...previewDeEvento(e)}
                      title={`${e.titulo}${e.detalle ? ' · ' + e.detalle : ''}`}
                      className={`absolute overflow-hidden rounded-md px-1.5 py-1 text-left shadow-sm transition hover:z-10 hover:shadow-md ${e.hecha ? 'opacity-50' : ''}`}
                      style={{
                        top, height: h,
                        left: `calc(${(carril / carriles) * 100}% + 2px)`,
                        width: `calc(${100 / carriles}% - 4px)`,
                        backgroundColor: `${e.color}${esTarea ? '18' : '24'}`,
                        backgroundImage: esTarea ? `repeating-linear-gradient(135deg, ${e.color}26 0, ${e.color}26 4px, transparent 4px, transparent 9px)` : 'none',
                        borderLeft: `3px ${esTarea ? 'dashed' : 'solid'} ${e.color}`,
                      }}
                    >
                      <p className="flex items-center gap-1 truncate text-[10.5px] font-bold" style={{ color: e.color }}>
                        {esTarea && <Check size={10} />} {e.virtual && <Video size={10} />}
                        <span className={`truncate ${e.hecha ? 'line-through' : ''}`}>{e.titulo}</span>
                      </p>
                      {h > 36 && <p className="truncate text-[9.5px] text-textSecondary">{minutosAHora(e.inicio.getHours() * 60 + e.inicio.getMinutes())}{e.detalle ? ` · ${e.detalle}` : ''}</p>}
                    </button>
                  );
                })}

                {esHoy && ahora.getHours() >= desde && ahora.getHours() < hasta && (
                  <div className="pointer-events-none absolute left-0 right-0 z-20 flex items-center" style={{ top: minutosDesde(ahora) }}>
                    <span className="-ml-1 h-2 w-2 rounded-full bg-danger" />
                    <span className="h-px flex-1 bg-danger" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
