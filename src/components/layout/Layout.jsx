import { useEffect } from 'react';
import Topbar from './Topbar';
import DockNav from './DockNav';
import EstadoApp from './EstadoApp';
import PaletaComandos from './PaletaComandos';
import BienvenidaTour from '../ayuda/BienvenidaTour';
import Novedades from './Novedades';
import SnackbarHost from './SnackbarHost';
import Celebracion from './Celebracion';
import RevisionSemanal from './RevisionSemanal';
import LogrosObservador from './LogrosObservador';
import PreviewHost from '../preview/PreviewHost';
import { registrarEntradaDeHoy } from '../../lib/rachaEntrada';

export default function Layout({ titulo, children }) {
  // Cuenta como "entrada" la primera vez que se ve CUALQUIER pantalla protegida en el día;
  // no depende de qué módulo sea, así refleja de verdad "abriste la app hoy".
  useEffect(() => { registrarEntradaDeHoy(); }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Topbar titulo={titulo} />
      <main className="mx-auto max-w-6xl px-4 pb-36 pt-5 sm:px-6">{children}</main>
      <DockNav />
      <PaletaComandos />
      <BienvenidaTour />
      <Novedades />
      <RevisionSemanal />
      <LogrosObservador />
      <PreviewHost />
      <SnackbarHost />
      <Celebracion />
      <EstadoApp />
    </div>
  );
}
