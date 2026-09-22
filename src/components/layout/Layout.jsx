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

export default function Layout({ titulo, children }) {
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
