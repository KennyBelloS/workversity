// Historial de versiones ("reporte de cambios"). Lo más nuevo va primero.
// Al publicar una versión: 1) agrega una entrada aquí, 2) sube "version" en package.json (deben coincidir).
// tipos: 'nuevo' ✨ · 'mejora' 🔧 · 'arreglo' 🐞

export const RELEASES = [
  {
    version: '2.5.1', fecha: '2026-09-25', titulo: 'Grupo: ya no se cuela ningún error técnico',
    cambios: [
      { t: 'arreglo', x: 'En Grupo (crear un espacio, unirte, pedir un horario, aceptarlo…), si fallaba la conexión en el peor momento, a veces se mostraba el error crudo en inglés en vez del aviso claro. Ya está reforzado en todos los puntos: siempre se traduce antes de mostrarse.' },
    ],
  },
  {
    version: '2.5.0', fecha: '2026-09-25', titulo: 'Mensajes de error mucho más claros',
    cambios: [
      { t: 'mejora', x: 'Cuando algo necesita internet y no lo hay, la app ya no muestra errores técnicos en inglés (como "TypeError: NetworkError…"): ahora dice claramente que esa acción necesita conexión y que lo intentes de nuevo cuando la tengas.' },
      { t: 'mejora', x: 'Se distingue mejor cuando el problema es tu conexión de cuando es que la app no logra llegar a tu base de datos (proyecto de Supabase pausado, borrado, o con la dirección equivocada).' },
    ],
  },
  {
    version: '2.4.0', fecha: '2026-09-25', titulo: 'Parciales mucho más coherente, y un aviso claro cuando el problema es de Supabase',
    cambios: [
      { t: 'mejora', x: 'Parciales: las tarjetas que no encajan en una definición clara ahora funcionan como "completa la idea" (el inicio real de la oración y su continuación), en vez de preguntas raras como "¿qué dice el texto sobre...?".' },
      { t: 'arreglo', x: 'En "Ver y editar" tarjetas, las preguntas y respuestas largas ya no se cortan: se leen completas.' },
      { t: 'mejora', x: 'Si la app no puede conectarse a tu base de datos pero tu internet funciona bien, ahora lo dice claramente (antes solo decía "sin conexión", lo cual llevaba a revisar el wifi en vez del proyecto de Supabase).' },
    ],
  },
  {
    version: '2.3.1', fecha: '2026-09-25', titulo: 'Arreglo urgente: crear un apunte ya no falla',
    cambios: [
      { t: 'arreglo', x: 'Crear un apunte nuevo daba un error y no dejaba usar la app. Era una librería que se había agregado mal; ya se quitó por completo y se reemplazó por una función propia, sin depender de nada externo.' },
      { t: 'mejora', x: 'Arrastrar para reordenar los widgets del Dashboard ya funciona con el dedo en el celular (antes solo funcionaba con mouse).' },
      { t: 'nuevo', x: 'Grupo: ahora puedes salir de un espacio, o eliminarlo por completo si eres admin.' },
      { t: 'arreglo', x: 'Reforzado el aviso cuando un borrado es bloqueado por el servidor (quitar a alguien, eliminar una solicitud o un espacio): ya no desaparece para luego reaparecer solo.' },
    ],
  },
  {
    version: '2.3.0', fecha: '2026-09-25', titulo: 'Grupo más rápido y mapas conceptuales mucho mejores',
    cambios: [
      { t: 'mejora', x: 'Grupo: la pantalla ahora muestra lo último guardado al instante, con o sin conexión, y solo actualiza de fondo si la red responde a tiempo (antes se podía quedar esperando).' },
      { t: 'mejora', x: 'Mapa conceptual: rediseñado con relaciones término → definición reales y texto completo, legible, sin cortes.' },
      { t: 'mejora', x: 'Diagrama de flujo: ya no inventa un proceso a partir de definiciones sueltas; solo se arma cuando el texto de verdad describe pasos, y si no, te lo dice y te sugiere el mapa conceptual.' },
      { t: 'mejora', x: 'Palabras clave de Parciales: ahora usan un lematizador de español (librería "natural") para agrupar variaciones de una misma palabra ("célula"/"células").' },
      { t: 'arreglo', x: 'Si un borrado era bloqueado en silencio por el servidor, la app ya no lo daba por hecho: ahora lo detecta y avisa en vez de que el elemento reaparezca solo.' },
      { t: 'arreglo', x: 'Al borrar un parcial, sus tarjetas y fuentes ya no se quedaban guardadas de más en el dispositivo.' },
    ],
  },
  {
    version: '2.2.0', fecha: '2026-09-24', titulo: 'Arreglos importantes: borrado confiable y mapas que sí se entienden',
    cambios: [
      { t: 'arreglo', x: 'Si el servidor rechazaba en silencio un borrado (algo raro, pero posible), la app ya no lo daba por hecho: ahora lo detecta y te avisa en vez de que el elemento "reviva" solo.' },
      { t: 'arreglo', x: 'Al borrar un parcial, sus tarjetas y fuentes ya no se quedaban huérfanas en tu dispositivo.' },
      { t: 'mejora', x: 'Mapa conceptual: rediseñado por completo. Ahora muestra relaciones reales (término → definición) en tarjetas legibles, sin texto cortado.' },
      { t: 'mejora', x: 'Diagrama de flujo: ya no fuerza definiciones sueltas en forma de proceso. Solo arma el diagrama cuando el texto de verdad describe pasos (numerados o con palabras como "primero", "luego", "finalmente"); si no, te lo dice y te sugiere el mapa conceptual.' },
    ],
  },
  {
    version: '2.1.0', fecha: '2026-09-23', titulo: 'Apuntes (cuaderno digital) y Parciales mucho más completos',
    cambios: [
      { t: 'nuevo', x: 'Apuntes: un cuaderno digital con apuntes de clase, de tarea, de proyecto o libres. Editor con negrita, cursiva, títulos y listas, y vista previa.' },
      { t: 'nuevo', x: 'Mapa mental interactivo dentro de cada apunte: agrega ideas, arrástralas, renómbralas, o genera uno automático a partir de tu texto.' },
      { t: 'nuevo', x: 'Mapa conceptual y diagrama de flujo automáticos también disponibles dentro de Apuntes (los mismos de Parciales).' },
      { t: 'nuevo', x: '«Usar para un parcial»: manda cualquier apunte a un parcial nuevo o existente y genera sus tarjetas de estudio de una vez.' },
      { t: 'mejora', x: 'Parciales genera muchas más tarjetas y con mejor cobertura: ahora busca al menos una pregunta por cada idea del texto, no solo por las palabras más repetidas.' },
    ],
  },
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
