import { useEffect, useState } from 'react';
import { Wind } from 'lucide-react';

const FASES = [
  { nombre: 'Inhala', segundos: 4, color: '#5B8DEF' },
  { nombre: 'Sostén', segundos: 7, color: '#8B7FD1' },
  { nombre: 'Exhala', segundos: 8, color: '#7FD1C3' },
];

const CICLOS_TOTALES = 3;

export default function BreathingModal({ onCerrar }) {
  const [faseIdx, setFaseIdx] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(FASES[0].segundos);
  const [ciclo, setCiclo] = useState(1);
  const [terminado, setTerminado] = useState(false);

  useEffect(() => {
    if (terminado) return;
    const t = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s > 1) return s - 1;

        const siguienteFase = (faseIdx + 1) % FASES.length;
        if (siguienteFase === 0) {
          if (ciclo >= CICLOS_TOTALES) {
            setTerminado(true);
            clearInterval(t);
            return 0;
          }
          setCiclo((c) => c + 1);
        }
        setFaseIdx(siguienteFase);
        return FASES[siguienteFase].segundos;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [faseIdx, ciclo, terminado]);

  const fase = FASES[faseIdx];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-lg2 bg-white p-8 text-center">
        <Wind className="mx-auto mb-2 text-primary" size={22} />
        <p className="mb-1 text-sm font-bold text-textPrimary">Llevas 2 horas seguidas trabajando</p>
        <p className="mb-6 text-xs text-textSecondary">Una pausa de respiración 4-7-8 antes de seguir</p>

        {!terminado ? (
          <>
            <div
              className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full text-white transition-all duration-1000"
              style={{
                backgroundColor: fase.color,
                transform: fase.nombre === 'Inhala' ? 'scale(1.15)' : fase.nombre === 'Exhala' ? 'scale(0.85)' : 'scale(1)',
              }}
            >
              <div>
                <p className="text-sm font-bold">{fase.nombre}</p>
                <p className="text-3xl font-extrabold">{segundosRestantes}</p>
              </div>
            </div>
            <p className="text-xs text-textSecondary">Ciclo {ciclo} de {CICLOS_TOTALES}</p>
          </>
        ) : (
          <>
            <p className="mb-5 text-sm font-semibold text-success">Listo. Respira mejor, trabaja mejor 🌿</p>
            <button onClick={onCerrar} className="w-full rounded-sm2 bg-primary py-3 text-sm font-bold text-white hover:bg-primaryDark">
              Continuar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
