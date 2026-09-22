/** Abre una página en una ventana al lado de la app (para IA y sitios que no se pueden incrustar). */
export function abrirVentanaLateral(url) {
  const ancho = Math.round(Math.min(560, (window.screen.availWidth || 1200) * 0.42));
  const alto = window.screen.availHeight || 800;
  const izquierda = (window.screen.availLeft || 0) + (window.screen.availWidth || 1200) - ancho;
  const w = window.open(url, 'workversity-lateral', `popup=yes,width=${ancho},height=${alto},left=${izquierda},top=0`);
  if (!w) window.open(url, '_blank', 'noopener');
  return !!w;
}
export const abrirEnPestana = (url) => window.open(url, '_blank', 'noopener');
