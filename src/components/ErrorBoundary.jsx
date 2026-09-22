import { Component } from 'react';

// Evita la "pantalla en blanco": si algo falla al dibujar, muestra un mensaje
// con opciones para recuperarse.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  recargar = async () => {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((regs || []).map((r) => r.unregister()));
      const claves = await caches?.keys();
      await Promise.all((claves || []).map((k) => caches.delete(k)));
    } catch {
      /* si falla, igual se recarga */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm rounded-lg2 bg-white p-8 text-center shadow-card">
          <p className="text-3xl">😵</p>
          <h1 className="mt-2 text-lg font-extrabold text-textPrimary">Algo salió mal</h1>
          <p className="mt-1 text-sm text-textSecondary">La pantalla no pudo cargarse. Tus datos no se perdieron.</p>
          <p className="mt-3 break-words rounded-sm2 bg-bg p-2 text-[11px] text-textSecondary">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full rounded-sm2 bg-primary py-3 text-sm font-bold text-white"
          >
            Reintentar
          </button>
          <button onClick={this.recargar} className="mt-2 w-full py-2 text-xs font-bold text-textSecondary">
            Limpiar caché de la app y recargar
          </button>
        </div>
      </div>
    );
  }
}
