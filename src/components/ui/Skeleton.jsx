/**
 * Placeholder de carga ("esqueleto"): ocupa el espacio real del contenido final mientras
 * llega, en vez de un simple "Cargando…" que hace saltar el layout cuando el contenido
 * aparece. Usa los mismos tokens de color del tema, así se ve bien en claro y en oscuro.
 */
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-sm2 bg-black/5 dark:bg-white/5 ${className}`} aria-hidden="true" />;
}

/** Imita la forma de las 4 tarjetas KPI del Dashboard mientras cargan sus números reales. */
export function SkeletonKpis({ cantidad = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="status" aria-label="Cargando tus números">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="rounded-md2 bg-white p-4 shadow-card">
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Imita una tarjeta de contenido genérica (listas, gráficos) mientras carga. */
export function SkeletonTarjeta({ lineas = 3, alto = null, className = '' }) {
  return (
    <div className={`rounded-md2 bg-white p-4 shadow-card ${className}`} role="status" aria-label="Cargando">
      <Skeleton className="mb-4 h-4 w-32" />
      {alto ? (
        <Skeleton className="w-full" style={{ height: alto }} />
      ) : (
        <div className="space-y-2.5">
          {Array.from({ length: lineas }).map((_, i) => (
            <Skeleton key={i} className="h-3" style={{ width: `${85 - i * 12}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Pantalla de carga completa del Dashboard: la misma composición que el contenido real. */
export function SkeletonDashboard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <SkeletonTarjeta alto={72} />
      <SkeletonKpis />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonTarjeta lineas={4} />
        <SkeletonTarjeta alto={220} />
      </div>
    </div>
  );
}

/** Pantalla de carga del Asistente / Analítica: encabezado + gráfico + lista. */
export function SkeletonAnalitica() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-56" />
      <SkeletonTarjeta alto={280} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonTarjeta alto={180} />
        <SkeletonTarjeta lineas={5} />
      </div>
    </div>
  );
}
