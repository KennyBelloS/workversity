import { useEffect, useRef } from 'react';
import Arana from './Arana';

// La araña del Dashboard. Vive en la esquina superior derecha de la ventana (justo debajo de la
// barra de arriba) y, como en la referencia, se pone a "mover cosas" sola: de vez en cuando sale,
// lanza su hilo a una de las tarjetas marcadas con `data-arana` y le da un tirón; la tarjeta se
// mueve hacia ella y vuelve a su sitio con un rebote. También lo hace si la tocas.
//
// Para que no estorbe: solo actúa si llevas unos segundos sin mover el mouse ni escribir, si la
// pestaña está visible y si el sistema no pide "reducir movimiento". Solo aparece en pantallas
// anchas, donde su esquina cae en el margen y no tapa contenido.

const INACTIVIDAD_MS = 4000;
const PRIMERA_VEZ_MS = 3500;
const ENTRE_VISITAS_MS = [13000, 24000];

function tirar(elemento, haciaX, haciaY) {
  const largo = Math.hypot(haciaX, haciaY) || 1;
  const dx = (haciaX / largo) * 14;
  const dy = (haciaY / largo) * 14;
  const giro = haciaX < 0 ? -1.6 : 1.6;
  // `composite: 'add'` suma el tirón a lo que la tarjeta ya tenga (hover, entrada animada…).
  elemento.animate(
    [
      { transform: 'translate(0, 0) rotate(0deg)' },
      { transform: `translate(${dx}px, ${dy}px) rotate(${giro}deg)`, offset: 0.32 },
      { transform: `translate(${dx * 1.15}px, ${dy * 1.15}px) rotate(${giro * 1.2}deg)`, offset: 0.48 },
      { transform: 'translate(0, 0) rotate(0deg)' },
    ],
    { duration: 1100, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)', composite: 'add' },
  );
}

export default function AranaDashboard({ tono = 'oscuro' }) {
  const capa = useRef(null);
  const arana = useRef(null);
  const ocupada = useRef(false);

  useEffect(() => {
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let ultimoMovimiento = Date.now();
    let temporizador = 0;
    const marcar = () => { ultimoMovimiento = Date.now(); };
    const eventos = ['pointermove', 'keydown', 'wheel', 'touchstart'];
    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }));

    const visitar = async (forzar = false) => {
      const caja = capa.current?.getBoundingClientRect();
      if (!caja || !caja.width || ocupada.current || !arana.current) return false;
      if (!forzar && (document.hidden || Date.now() - ultimoMovimiento < INACTIVIDAD_MS)) return false;
      // Tarjetas visibles a las que el hilo puede llegar.
      const candidatas = [...document.querySelectorAll('[data-arana]')]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 40 && r.top > caja.top + 40 && r.bottom < window.innerHeight - 90 && r.right > caja.left)
        .map(({ el, r }) => ({ el, x: r.right - caja.left - Math.min(28, r.width * 0.15), y: r.top - caja.top + 12 }))
        .filter(({ x, y }) => Math.hypot(caja.width - x, y) < 1150);
      if (candidatas.length === 0) return false;
      const { el, x, y } = candidatas[Math.floor(Math.random() * candidatas.length)];
      ocupada.current = true;
      try {
        await arana.current.buscar({ x, y });
        // El hilo llegó: la tarjeta se va hacia la araña (arriba a la derecha) y vuelve.
        tirar(el, caja.width - x, -y);
      } finally {
        setTimeout(() => { ocupada.current = false; }, 1600);
      }
      return true;
    };

    // Reloj suave: revisa cada 1,5 s si ya le toca salir. Si no se cumplen las condiciones
    // (te estás moviendo, pestaña oculta…), lo vuelve a intentar al siguiente tic, no 20 s después.
    let proxima = Date.now() + PRIMERA_VEZ_MS;
    const tic = async () => {
      if (Date.now() >= proxima && !ocupada.current) {
        const salio = await visitar();
        if (salio) {
          const [min, max] = ENTRE_VISITAS_MS;
          proxima = Date.now() + min + Math.random() * (max - min);
        }
      }
      temporizador = window.setTimeout(tic, 1500);
    };
    if (!reducido) temporizador = window.setTimeout(tic, 1500);

    const alTocar = () => visitar(true);
    window.addEventListener('workversity:arana', alTocar);
    return () => {
      clearTimeout(temporizador);
      eventos.forEach((e) => window.removeEventListener(e, marcar));
      window.removeEventListener('workversity:arana', alTocar);
    };
  }, []);

  return (
    <div
      ref={capa}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-full hidden overflow-hidden xl:block"
      style={{ height: 'calc(100vh - 72px)' }}
    >
      <Arana ref={arana} esquina="sup-der" escala={0.95} tono={tono} onTocar={() => window.dispatchEvent(new Event('workversity:arana'))} />
    </div>
  );
}
