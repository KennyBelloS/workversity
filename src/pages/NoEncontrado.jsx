import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { VERSION } from '../version';

/**
 * Ruta inexistente (referencia: el 404 con el portaaviones dibujado a línea).
 * Aquí la ilustración es un escritorio visto desde arriba: cuaderno, regla, lápiz, café y
 * reloj, dibujados solo con líneas en el color de acento y con una leve deriva.
 */
export default function NoEncontrado() {
  const { pathname } = useLocation();
  return (
    <div className="ne">
      <div className="ne-marco">
        <span className="ne-esquina">Workversity</span>
        <span className="ne-esquina ne-esquina--der">Ruta perdida</span>
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 pt-[14vh] text-center">
        <p className="ne-cifra">404</p>
        <p className="mt-3 max-w-[34ch] text-t-base text-white/55">Esta página se quedó fuera del horario. Revisa el enlace o vuelve a tu semana.</p>
        <p className="ne-ruta">{pathname.length > 42 ? `${pathname.slice(0, 42)}…` : pathname}</p>
        <Link to="/" className="ne-boton"><ArrowLeft size={14} strokeWidth={2} /> Volver al inicio</Link>
      </div>

      <div className="ne-escritorio" aria-hidden="true">
        <svg viewBox="0 0 900 420" preserveAspectRatio="xMidYMax meet" className="ne-svg">
          <g className="ne-deriva">
            {/* Cuaderno abierto */}
            <g className="ne-l">
              <path d="M250 150 L450 120 L470 300 L268 332 Z" />
              <path d="M450 120 L650 150 L632 332 L470 300 Z" />
              <path d="M450 120 L470 300" />
              {[0, 1, 2, 3, 4].map((i) => <path key={`a${i}`} d={`M278 ${186 + i * 26} L430 ${163 + i * 26}`} />)}
              {[0, 1, 2, 3].map((i) => <path key={`b${i}`} d={`M490 ${166 + i * 26} L612 ${182 + i * 26}`} />)}
            </g>
            {/* Regla */}
            <g className="ne-l ne-regla">
              <rect x="150" y="196" width="78" height="188" rx="4" transform="rotate(-9 189 290)" />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M156 ${222 + i * 24} L${i % 2 ? 186 : 200} ${217 + i * 24}`} transform="rotate(-9 189 290)" />)}
            </g>
            {/* Lápiz */}
            <g className="ne-l ne-lapiz">
              <path d="M690 120 L724 128 L688 300 L666 296 Z" />
              <path d="M666 296 L688 300 L674 330 Z" />
              <path d="M690 120 L724 128" />
            </g>
            {/* Taza */}
            <g className="ne-l ne-taza">
              <ellipse cx="760" cy="300" rx="52" ry="22" />
              <ellipse cx="760" cy="292" rx="40" ry="16" />
              <path d="M812 296 q26 6 18 24 q-8 16 -30 10" />
            </g>
            {/* Reloj */}
            <g className="ne-l">
              <circle cx="128" cy="124" r="44" />
              <path d="M128 100 L128 126 L146 136" />
            </g>
          </g>
        </svg>
      </div>

      <p className="ne-pie">v{VERSION}</p>
    </div>
  );
}
