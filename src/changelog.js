// Historial de versiones ("reporte de cambios"). Lo más nuevo va primero.
// Al publicar una versión: 1) agrega una entrada aquí, 2) sube "version" en package.json (deben coincidir).
// tipos: 'nuevo' ✨ · 'mejora' 🔧 · 'arreglo' 🐞

export const RELEASES = [
  {
    version: '2.0.0', fecha: '2026-09-23', titulo: 'Espacios compartidos y preparación de parciales',
    cambios: [
      { t: 'nuevo', x: 'Grupo: comparte tu agenda con tu pareja, compañeros de piso o grupo de estudio. Crea un espacio o únete con un código. Dos roles: admin (acceso total) y miembro (mismo acceso, para el día a día).' },
      { t: 'nuevo', x: 'Pide un espacio en la agenda: propones un horario, la otra persona lo acepta o rechaza, y aparece en la agenda compartida del grupo.' },
      { t: 'nuevo', x: 'Tabla de posiciones: compara tus puntos con los de los demás miembros del espacio.' },
      { t: 'nuevo', x: 'Parciales: crea un parcial, sube una foto, un PDF, un Word o un Excel (o pega el texto) y la app genera tarjetas de estudio.' },
      { t: 'nuevo', x: 'Modo estudio con tarjetas (repite primero lo que más te cuesta), mini test de opción múltiple y una simulación de examen cronometrada.' },
      { t: 'nuevo', x: 'Mapa conceptual y diagrama de flujo generados a partir de tus apuntes, y consejos de estudio según cuánto falta para el parcial y cómo te ha ido.' },
      { t: 'nuevo', x: 'Dashboard: widgets movibles — arrastra para reordenar, oculta los que no uses y compara tu avance en un solo vistazo.' },
    ],
  },
  {
    version: '1.9.0', fecha: '2026-09-23', titulo: 'Dashboard personalizable y widget de metas',
    cambios: [
      { t: 'nuevo', x: 'Dashboard con widgets movibles: arrastra para reordenar (o usa las flechas ↑ ↓, más cómodo en el celular), oculta los que no uses y restablece cuando quieras. Todo se recuerda en tu dispositivo.' },
      { t: 'nuevo', x: 'Nuevo widget «Tus metas»: muestra el avance de tus metas de ahorro y de progreso más recientes directo en el Dashboard.' },
    ],
  },
  {
    version: '1.8.0', fecha: '2026-09-23', titulo: 'Espacio de trabajo por tarea, dificultad y tiempos que la app aprende',
    cambios: [
      { t: 'nuevo', x: 'Dificultad de las tareas (fácil, media, difícil) además de la prioridad. La app calcula cuánto tardarás y va aprendiendo de lo que de verdad tardas.' },
      { t: 'nuevo', x: 'Botón «Iniciar tarea»: abre un espacio de enfoque con temporizador, lista de pasos, documento de texto, hoja de cálculo, diapositivas, investigación (Wikipedia, diccionario y navegador) y ayuda de IA (ChatGPT, Claude, Gemini…).' },
      { t: 'nuevo', x: 'Dashboard personalizable: mueve, oculta y reordena los widgets. Nuevas vistas previas de tu horario y de tus tareas.' },
      { t: 'nuevo', x: 'Botón flotante «+» en toda la app para crear una tarea o iniciar un enfoque al instante.' },
      { t: 'mejora', x: 'Enfoque: sonidos de fondo sin internet, meta diaria de enfoque, presets de tiempo y lo que la app aprendió de tus tiempos.' },
    ],
  },
  {
    version: '1.7.0', fecha: '2026-09-22', titulo: 'Metas de progreso (leer un libro…) y vista previa dinámica',
    cambios: [
      { t: 'mejora', x: 'Si tu base de datos está desactualizada, la app ya no descarta tus cambios: los guarda, te dice qué falta, te da un botón para copiar el SQL y los envía solos cuando la actualices.' },
      { t: 'nuevo', x: 'Metas de progreso: además de ahorrar, crea metas como «Leer un libro», terminar un curso, estudiar horas o hacer ejercicio. Las mides en páginas, capítulos, horas, veces…' },
      { t: 'nuevo', x: 'Cada meta de progreso calcula tu ritmo, la fecha en que la terminarás y cuánto necesitas por día para llegar a tiempo; tiene botón «+10» de un toque, historial y una mini gráfica de tus últimos 14 días.' },
      { t: 'nuevo', x: 'Categorías para todo: las metas de progreso usan el mismo módulo de categorías (Lectura, Estudio, Salud y deporte… y las que tú crees).' },
      { t: 'nuevo', x: 'Vista previa dinámica: pasa el mouse sobre una tarea o una clase (o mantenla pulsada en el celular) y verás cuenta regresiva en vivo, anillo de tiempo, hueco libre sugerido, sub-tareas, tu nota, próximas sesiones y acciones rápidas.' },
      { t: 'mejora', x: 'La campana te avisa si vas atrasado con una meta de progreso o llevas días sin avanzar.' },
      { t: 'mejora', x: 'Tres logros nuevos: primer avance, meta terminada y constancia.' },
    ],
  },
  {
    version: '1.6.0', fecha: '2026-09-21', titulo: 'Revisión semanal, logros, presupuesto inteligente y más personalización',
    cambios: [
      { t: 'nuevo', x: 'Revisión semanal: un ritual de 4 pasos para cerrar la semana (qué lograste, reprogramar lo vencido, lo que viene y una reflexión). Está en Resumen, en el Dashboard y en Ctrl + K; la campana te la recuerda de viernes a domingo.' },
      { t: 'nuevo', x: 'Logros: 21 insignias que se desbloquean solas (tareas, rachas, enfoque, notas, ahorro…) con aviso y confeti. Míralos en Resumen.' },
      { t: 'nuevo', x: 'Presupuesto inteligente: la campana avisa al llegar al 80% y al pasarte, y Finanzas te dice cuánto puedes gastar por día y cómo cerrarás el mes.' },
      { t: 'nuevo', x: 'Personalización: elige el color de acento (6 opciones) y el tamaño del texto en Ajustes → Apariencia.' },
      { t: 'nuevo', x: 'Restaurar copia de seguridad: ahora la copia incluye todo (notas, categorías de ahorro…) y puedes restaurarla en esta u otra cuenta.' },
      { t: 'nuevo', x: 'Deshacer: al eliminar o completar una tarea aparece un botón para volver atrás.' },
      { t: 'mejora', x: 'Tareas repetidas configurables: todos los días, cada 2 días, semanal, quincenal o mensual.' },
      { t: 'mejora', x: 'La app instalada muestra sobre su ícono cuántas tareas vencen hoy o están vencidas, y vibra al completar una tarea.' },
      { t: 'mejora', x: 'La tecla Escape cierra todas las ventanas.' },
    ],
  },
  {
    version: '1.5.1', fecha: '2026-09-21', titulo: 'Metas: categorías de ahorro propias',
    cambios: [
      { t: 'nuevo', x: 'Crea tus propias categorías de ahorro (Viaje, Portátil, Matrícula…) desde Metas o al registrar un ahorro, y elígelas para saber a dónde va cada peso.' },
      { t: 'nuevo', x: 'En Metas verás «¿A dónde va tu ahorro?»: cuánto llevas en cada categoría, qué metas la usan y el ahorro que aún no tiene meta.' },
      { t: 'nuevo', x: 'Botón «Aportar» en cada meta: registra un ahorro que va directo a ella.' },
      { t: 'mejora', x: 'Al registrar un ahorro se muestra a qué meta cuenta; si dos metas comparten categoría, te avisa.' },
    ],
  },
  {
    version: '1.5.0', fecha: '2026-09-21', titulo: 'Actualizaciones automáticas y calendario más confiable',
    cambios: [
      { t: 'nuevo', x: 'La app se actualiza sola: cuando hay una versión nueva la descarga y se instala en segundo plano (también la versión instalada en el celular o el computador).' },
      { t: 'nuevo', x: 'Reporte de cambios: cada vez que se actualiza verás qué es nuevo. El historial está en Cómo se usa y en Ajustes.' },
      { t: 'nuevo', x: 'Notas: desglosa una actividad en partes iguales (talleres, quices…) con nombre y nota para cada una.' },
      { t: 'nuevo', x: 'Notas: botones «Guardar corte» y «Descartar», y los números del corte se calculan en vivo mientras escribes.' },
      { t: 'mejora', x: 'Notas de 0.0 a 5.0 (escribe 35 para 3.5). Cada corte y cada materia dicen si vas ganando o perdiendo (se pierde por debajo de 3.0).' },
      { t: 'mejora', x: 'Calendario: el archivo .ics incluye la zona horaria; hay botón «Compartir / abrir en mi calendario» para el celular y «Agregar uno por uno» a Google Calendar.' },
      { t: 'mejora', x: 'Calendario: la suscripción te dice si la función aún no está desplegada y cómo activarla.' },
      { t: 'arreglo', x: 'Al guardar notas sin usar el desglose ya no se necesita la columna nueva de la base de datos.' },
    ],
  },
  {
    version: '1.4.0', fecha: '2026-09-21', titulo: 'Nuevo logo, barra inferior y notas por cortes',
    cambios: [
      { t: 'nuevo', x: 'Logo nuevo en la app, los íconos de instalación y las notificaciones.' },
      { t: 'nuevo', x: 'Barra de navegación inferior en todos los tamaños de pantalla (celular, tablet y computador).' },
      { t: 'nuevo', x: 'Notas por cortes (35 · 35 · 30, editables) con actividades, porcentajes, meta y simulador.' },
      { t: 'nuevo', x: 'Cómo se usa: recorrido animado, mapa de cómo se conecta todo y lista de primeros pasos.' },
      { t: 'nuevo', x: 'Búsqueda rápida con Ctrl + K y huecos libres del día en el Asistente.' },
      { t: 'nuevo', x: 'Pestaña Hábitos en el Asistente.' },
    ],
  },
  {
    version: '1.3.0', fecha: '2026-09-20', titulo: 'Campana, resumen y asistente ampliado',
    cambios: [
      { t: 'nuevo', x: 'Campana de notificaciones dentro de la app y tablero de Resumen semanal y mensual.' },
      { t: 'nuevo', x: 'Asistente con Plan (qué hacer ahora), Trabajos (planificador y referencias APA) y Notas.' },
      { t: 'nuevo', x: 'Captura rápida de tareas escribiendo una frase, y vista de tareas por materia.' },
      { t: 'nuevo', x: 'Exportar tu agenda a Google Calendar, iPhone y Outlook (.ics y suscripción).' },
    ],
  },
  {
    version: '1.2.0', fecha: '2026-09-20', titulo: 'Notificaciones, modo oscuro y agenda unificada',
    cambios: [
      { t: 'nuevo', x: 'Notificaciones push con la app cerrada: tareas por vencer, clases, reuniones y resumen diario.' },
      { t: 'nuevo', x: 'Modo oscuro, nueva tipografía y Dashboard interactivo con gráficos.' },
      { t: 'nuevo', x: 'Agenda que junta clases, trabajo, reuniones y tareas; materias virtuales; tareas de universidad ligadas a una materia.' },
    ],
  },
  {
    version: '1.1.0', fecha: '2026-09-20', titulo: 'Funciona sin conexión',
    cambios: [
      { t: 'nuevo', x: 'La app se puede instalar y usar sin internet; los cambios se sincronizan solos al volver la conexión.' },
      { t: 'arreglo', x: 'Corregidos problemas de carga inicial y de inicio de sesión.' },
    ],
  },
];
