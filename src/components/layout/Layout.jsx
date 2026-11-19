import { useEffect } from 'react';
import Topbar from './Topbar';
import EncabezadoPagina from './EncabezadoPagina';
import DockNav, { useDeslizarSecciones } from './DockNav';
import PiePagina from '../decoracion/PiePagina';
import EstadoApp from './EstadoApp';
import PaletaComandos from './PaletaComandos';
import BienvenidaTour from '../ayuda/BienvenidaTour';
import Novedades from './Novedades';
import SnackbarHost from './SnackbarHost';
import Celebracion from './Celebracion';
import RevisionSemanal from './RevisionSemanal';
import LimpiezaMensual from './LimpiezaMensual';
import LogrosObservador from './LogrosObservador';
import PreviewHost from '../preview/PreviewHost';
import { registrarEntradaDeHoy } from '../../lib/rachaEntrada';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useLocation } from 'react-router-dom';

export default function Layout({ titulo, children }) {
  // Cuenta como "entrada" la primera vez que se ve CUALQUIER pantalla protegida en el día;
  // no depende de qué módulo sea, así refleja de verdad "abriste la app hoy".
  useEffect(() => { registrarEntradaDeHoy(); }, []);
  const esCelular = useMediaQuery('(max-width: 1023px)');
  const { pathname } = useLocation();
  // Al cambiar de sección hay que empezar arriba. Sin esto, el navegador conserva el scroll
  // anterior y se aterriza a mitad de página (muchas veces sobre el paisaje del pie).
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  // En celular se puede pasar a la sección vecina deslizando el dedo, como en una app nativa.
  const deslizar = useDeslizarSecciones(esCelular);

  return (
    <div className="min-h-screen bg-bg">
      <div className="marco">
        <Topbar titulo={titulo} />
        <main
          key={pathname}
          {...deslizar.props}
          data-dir={deslizar.direccion || undefined}
          className="pantalla mx-auto w-full max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 sm:pt-9 lg:px-10 lg:pb-32 lg:pt-10"
        >
          <EncabezadoPagina />{children}
          <PiePagina />
        </main>
      </div>
      <DockNav />
      <PaletaComandos />
      <BienvenidaTour />
      <Novedades />
      <RevisionSemanal />
      <LimpiezaMensual />
      <LogrosObservador />
      <PreviewHost />
      <SnackbarHost />
      <Celebracion />
      <EstadoApp />
    </div>
  );
}
