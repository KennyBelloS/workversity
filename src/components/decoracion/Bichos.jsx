// Catálogo de animaciones decorativas de la app. Lo usa el panel de administrador (pestaña
// "Animaciones") para mostrar cuáles hay, dónde aparecen y probarlas. Para agregar una nueva,
// se crea su componente (con los métodos buscar/entrar si los tiene) y se suma aquí.
import Arana from './Arana';

export const CATALOGO_BICHOS = [
  {
    id: 'arana',
    nombre: 'Araña',
    predeterminado: true,
    Componente: Arana,
    descripcion: 'Patas articuladas que se plantan y dan pasos de verdad. Vive escondida en una esquina, sale caminando, lanza su hilo y vuelve.',
    donde: ['Inicio de sesión (jala la franja al cambiar entre entrar y crear cuenta)', 'Dashboard, en la esquina superior derecha (pantallas anchas; tócala y lanza el hilo)'],
  },
];
