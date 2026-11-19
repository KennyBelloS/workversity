// Historial de versiones ("reporte de cambios"). Lo más nuevo va primero.
// Al publicar una versión: 1) agrega una entrada aquí, 2) sube "version" en package.json (deben coincidir).
// tipos: 'nuevo' · 'mejora' · 'arreglo'

export const RELEASES = [
  {
    version: '2.18.0', fecha: '2026-11-18', titulo: 'Dashboard rehecho como una primera plana, cerrar semestre y tres errores corregidos',
    cambios: [
      { t: 'arreglo', x: 'Ya se puede compartir el horario aunque la base de datos no tenga todavía la columna nueva: antes salía «No se pudo compartir tu horario» porque el reintento nunca llegaba a dispararse.' },
      { t: 'arreglo', x: 'Al salir de un espacio salía «necesitas conexión a internet» aunque hubiera internet: cualquier error del código se estaba reportando como falta de conexión. Ahora solo se dice eso cuando de verdad falló la red.' },
      { t: 'arreglo', x: 'Al cambiar de sección, la página empieza arriba. Antes se conservaba el scroll y se aterrizaba a mitad de página, casi siempre sobre el paisaje del pie.' },
      { t: 'nuevo', x: 'Cerrar semestre (Ajustes → Datos): guarda el horario completo con un nombre y deja la agenda en blanco para empezar de nuevo. Nada se borra solo; los semestres guardados se pueden consultar, restaurar o borrar a mano cuando tú quieras. Tus tareas, notas y finanzas no se tocan.' },
      { t: 'mejora', x: 'Dashboard rehecho de raíz: ya no es una rejilla de tarjetas. Ahora abre como la primera plana de un diario — una línea de cabecera, un titular grande armado con tus datos del día, y tres columnas separadas por filetes (lo urgente, lo que viene y tus cifras). El tablero con su animación sigue abajo, igual que antes.' },
      { t: 'mejora', x: 'El titular cambia de forma según el día: manda lo atrasado sobre lo ocupado, y lo ocupado sobre lo tranquilo.' },
      { t: 'mejora', x: 'Base de datos v20: tabla nueva para los semestres guardados (hay que correr supabase/schema.sql).' },
    ],
  },
  {
    version: '2.17.0', fecha: '2026-11-18', titulo: 'Capas en 3D, control de qué compartes en el grupo y el lago en todas las páginas',
    cambios: [
      { t: 'nuevo', x: 'Qué comparto con el grupo: ahora eliges entre cuatro alcances sobre una pila de capas en 3D que puedes tocar. Solo citas (nadie ve tu semana y solo pueden proponerte una reunión), solo entregas, solo reuniones y eventos, o toda la semana. Al lado se lista exactamente qué ve el grupo y qué no.' },
      { t: 'nuevo', x: 'El filtro se aplica antes de subir nada: lo que no entra en el alcance que elegiste no sale de tu dispositivo. En la semana del grupo, debajo del nombre de cada quien se lee qué está compartiendo.' },
      { t: 'nuevo', x: 'Pila isométrica en 3D (hecha con CSS, sin librerías): las losas se separan solas al entrar en pantalla. Está en el grupo para elegir qué compartes, en «Cómo se usa» para explicar cómo se apoya cada parte de la app en la anterior, y en Resumen para ver de qué está hecha tu semana.' },
      { t: 'nuevo', x: 'Banda de pulso en el Dashboard: completadas, enfoque y bloques de la semana en cifras grandes, cada una con sus siete días en barras y el día de hoy resaltado.' },
      { t: 'nuevo', x: 'El lago con el velero ahora cierra todas las páginas, no solo el inicio.' },
      { t: 'mejora', x: 'La acción principal es de tinta en toda la app, también en Resumen.' },
      { t: 'mejora', x: 'Base de datos v19: una columna nueva para guardar el alcance de lo que compartes (hay que correr supabase/schema.sql; si no lo corres, la app sigue funcionando y comparte la semana completa como antes).' },
    ],
  },
  {
    version: '2.16.0', fecha: '2026-11-18', titulo: 'Barra de navegación nueva, portada del Dashboard y titulares con carácter',
    cambios: [
      { t: 'mejora', x: 'Se quitó el menú en arco del celular: no se veía bien. Vuelve la barra de abajo, pero rehecha: solo la sección activa muestra su nombre y su pastilla se estira hasta él, así caben seis sin apretarse.' },
      { t: 'nuevo', x: 'El celular se usa con el dedo: desliza de lado para pasar a la sección vecina, la barra se esconde al bajar y vuelve al subir, y una pulsación larga sobre ella abre todas las secciones.' },
      { t: 'nuevo', x: 'Portada del Dashboard: la página abre con el saludo y una sola tarjeta que contesta «¿y ahora qué?» con la tarea que pide una decisión ya. Debajo, las cifras del día en un riel separado por filetes, sin globitos de colores.' },
      { t: 'mejora', x: 'Dashboard reordenado: se fueron las piezas que repetían lo que ya decía la portada y el mosaico ya no deja huecos; el modo supervivencia pasó a una banda de ancho completo.' },
      { t: 'mejora', x: 'Titulares con carácter: los nombres de sección, el saludo y los textos grandes ahora usan una tipografía editorial (Fraunces), mientras los datos y las cifras siguen en la tipografía de siempre.' },
      { t: 'mejora', x: 'La pantalla de arranque ahora siempre se alcanza a ver, incluso cuando la app abre al instante.' },
      { t: 'mejora', x: 'El estanque de koi del inicio de sesión se pasó a la parte baja de la franja, donde se ve como un banco de peces y no estorba al logo.' },
    ],
  },
  {
    version: '2.15.0', fecha: '2026-11-18', titulo: 'Pantalla de arranque, navegación en arco, la semana del grupo y correos con diseño propio',
    cambios: [
      { t: 'nuevo', x: 'Pantalla de arranque: al abrir o recargar la app aparece una cuenta de 0 a 100 % con una línea que cruza la pantalla y va cambiando de color por etapas. Se pinta antes que la app, así que también se ve cuando el internet está lento.' },
      { t: 'nuevo', x: 'Botón para recargar la app: arriba a la derecha, en la paleta de comandos (Ctrl+K) y en Ajustes → La app. Busca la versión nueva y vuelve a abrir sin salirte de la cuenta.' },
      { t: 'nuevo', x: 'Navegación del celular en arco: mantén pulsado el botón de la esquina y las secciones se abren en abanico siguiendo la curva de la pantalla; sin soltar, deslizas hasta la que quieras. Cada sección tiñe el fondo con su color.' },
      { t: 'nuevo', x: 'La semana del grupo: cuando varios comparten su horario se ve la semana completa y cada bloque dice de quién es (inicial, nombre y color). Puedes filtrar por persona, ver los huecos en que todos están libres y proponer una reunión a una persona o a todo el grupo; al aceptarla, queda en la semana de los dos.' },
      { t: 'nuevo', x: 'La jornada: una regla de 06:00 a 22:00 al inicio del Dashboard con tus clases y turnos como barras, las entregas como rombos y una marca que avanza con el reloj.' },
      { t: 'mejora', x: 'Dashboard reorganizado en cubiertas numeradas («01 Ahora mismo», «02 Tu semana»): se acabó la sensación de dos tableros pegados. Las gráficas ahora usan tu color de acento.' },
      { t: 'nuevo', x: 'Correos con diseño propio también cuando los manda Supabase: hay plantillas listas para recuperar contraseña, confirmar la cuenta, enlace de acceso, cambio de correo e invitación (carpeta supabase/email-templates, con instrucciones de dónde pegarlas).' },
      { t: 'mejora', x: 'Pantallas vacías rediseñadas: en vez de un icono gris, se ven en miniatura las fichas que van a vivir ahí y un botón para crear la primera.' },
      { t: 'mejora', x: 'Ajustes rediseñado con un índice al costado y secciones numeradas; botones, campos y tarjetas iguales en toda la app (la acción principal ahora es de tinta, y el color de acento queda para los datos).' },
      { t: 'nuevo', x: 'Página para las direcciones que no existen, con el número 404 y una ilustración de escritorio dibujada a línea.' },
    ],
  },
  {
    version: '2.14.0', fecha: '2026-11-15', titulo: 'Rediseño completo: estudio, tablero Kanban, avisos deslizables y el estanque de koi',
    cambios: [
      { t: 'mejora', x: 'Rediseño de toda la app con un sistema propio: lienzo cálido, tipografía Geist en pesos finos, cifras grandes tipo reloj, tarjetas con filete en lugar de sombras y tu color de acento como único color fuerte. Cada sección abre con un encabezado editorial (número, grupo y para qué sirve).' },
      { t: 'nuevo', x: 'Dashboard en mosaico (bento): tu día en un arco, lo que viene ahora como un reproductor, temporizador de enfoque, semana de completadas, materias, calendario del día y modo supervivencia, todo armándose al entrar.' },
      { t: 'nuevo', x: 'Tablero Kanban nuevo: arrastra las tarjetas (con el dedo también): se inclinan según la velocidad, la columna de destino se tiñe y se abre un hueco donde caerán. Límite de 3 en progreso con aviso, vista por carriles de materia y código corto por tarjeta.' },
      { t: 'nuevo', x: 'Avisos rediseñados: la campana despliega una tarjeta que revisa el aviso, lo marca como listo y se completa deslizando. Lo resuelto aparece como una fila en el Dashboard.' },
      { t: 'nuevo', x: 'Estanque de koi animado con tu color de acento en el inicio de sesión, en «Nueva contraseña» y en el Asistente: los peces se apartan del puntero y van tras la comida si tocas el agua.' },
      { t: 'nuevo', x: 'Pie de página con un paisaje vivo (lago, pueblo, veleros y follaje que se mece) dibujado en tu color de acento.' },
      { t: 'nuevo', x: 'Pantalla de carga animada: un mosaico que se arma solo mientras llegan tus datos.' },
      { t: 'mejora', x: 'Adiós a los emojis: todos los íconos de la app ahora son íconos de línea coherentes entre sí.' },
      { t: 'mejora', x: 'El correo para recuperar la contraseña ahora sale por Resend, con el nuevo diseño.' },
      { t: 'mejora', x: 'Inicio de sesión, Finanzas, Asistente y Panel de administrador rediseñados; el aviso emergente ya no se sale de la pantalla en el celular.' },
    ],
  },
  {
    version: '2.13.0', fecha: '2026-10-25', titulo: 'Nueva identidad visual, la araña que se mueve sola y correos de recuperación con Brevo',
    cambios: [
      { t: 'mejora', x: 'Nueva identidad en toda la app ("cuaderno editorial"): tinta azul marino y dorado del logo sobre fondo color papel, títulos con tipografía de exhibición, tarjetas con filete fino, una banda protagonista con costura dorada y una barra de navegación de tinta con la sección activa marcada en dorado. El color de acento predeterminado ahora es "Tinta" (los demás siguen en Ajustes → Apariencia).' },
      { t: 'mejora', x: 'Inicio de sesión: el logo y el nombre de Workversity se ven mucho más grandes.' },
      { t: 'nuevo', x: 'La araña del Dashboard ahora se mueve sola: cuando llevas unos segundos sin tocar nada, sale de su esquina, lanza el hilo a una tarjeta y le da un tirón. También lo hace si la tocas. No actúa si el sistema pide reducir el movimiento.' },
      { t: 'nuevo', x: 'Correo para recuperar la contraseña enviado con Brevo y con el diseño de Workversity, y una pantalla propia para elegir la contraseña nueva (con aviso claro si el enlace venció).' },
    ],
  },
  {
    version: '2.12.0', fecha: '2026-10-23', titulo: 'Parciales con preguntas que sí tienen sentido, nuevo inicio de sesión y la araña',
    cambios: [
      { t: 'arreglo', x: 'Parciales: el lector de PDF juntaba cada página en un solo renglón, así que el índice (con sus puntos guía), los encabezados de página y los títulos de sección se pegaban a las oraciones y salían tarjetas sin sentido. Ahora se leen los renglones reales, se descartan índice, encabezados, pies y números de página, y se separan los títulos del texto.' },
      { t: 'mejora', x: 'Parciales: las preguntas usan el verbo correcto ("¿En qué consiste…?", "¿Qué significa…?", "¿Cuáles son las ventajas…?") y las tarjetas de completar ocultan un concepto del tema (VPN, TIR, costo de capital…) en vez de cortar la oración a la mitad. En el mini test, una sigla compite con otras siglas y una definición con otras definiciones, para que la respuesta no se adivine por la forma.' },
      { t: 'nuevo', x: 'Parciales: botón "Regenerar tarjetas" para volver a crear desde tus fuentes las tarjetas hechas con la versión anterior (las escritas a mano se conservan).' },
      { t: 'mejora', x: 'Nuevo inicio de sesión: los dos formularios lado a lado y una franja sesgada que cruza de un lado al otro al cambiar entre entrar y crear cuenta, con campos subrayados y entrada escalonada. En el teléfono, la franja queda como cabecera.' },
      { t: 'nuevo', x: 'La araña: patas articuladas que caminan de verdad. En el inicio de sesión lanza su hilo y "jala" la franja; en el Dashboard se asoma por la esquina superior derecha (pantallas anchas) y lanza el hilo al tocarla. El panel de administrador tiene una pestaña de Animaciones para verla y probarla.' },
      { t: 'arreglo', x: 'El inicio de sesión ya no muestra mensajes técnicos (direcciones del servidor, variables de configuración): solo un aviso claro si no hay conexión.' },
    ],
  },
  {
    version: '2.11.0', fecha: '2026-10-21', titulo: 'Panel de administrador, limpieza mensual con confirmación, y errores técnicos que ya no se filtran',
    cambios: [
      { t: 'nuevo', x: 'Nuevo rol de administrador: la cuenta marcada como admin puede ver a todos los usuarios (cuándo entraron, cuántas veces), y suspender, reactivar, eliminar o resetear la contraseña de cualquier cuenta normal, siempre desde un panel propio en Ajustes. Las cuentas de administrador están protegidas: ninguna de esas acciones puede usarse contra otra cuenta admin, ni siquiera llamando directo al servidor.' },
      { t: 'nuevo', x: 'Limpieza mensual de tareas: una vez al mes, si quedan tareas marcadas como hechas de meses anteriores, se pregunta si se quieren eliminar — nunca se borra nada sin confirmar.' },
      { t: 'arreglo', x: 'Varios mensajes de error técnico (en inglés, de IndexedDB o del navegador) se colaban tal cual en pantalla. Ahora, si un mensaje no tiene pinta de estar en español, siempre se cambia por uno claro y genérico.' },
      { t: 'arreglo', x: 'El modal de calendario mostraba un comando interno (npx…) y explicaciones de despliegue que no le sirven a quien usa la app. Se quitó todo eso: si la suscripción automática no está lista, esa sección simplemente no aparece.' },
      { t: 'arreglo', x: 'Parciales generaba preguntas sin sentido a partir de números de esquema ("6.3.4 Definir alcance") o notas al margen ("Nota: revisar la página 5"). Se corrigió de raíz: ya no se toman como un término ni los números de sección ni las anotaciones, y se redujo la lista de verbos que arman una definición solo a los que de verdad definen algo.' },
      { t: 'arreglo', x: 'El mapa conceptual de Parciales a veces se veía diminuto. Ahora siempre se dibuja a un tamaño legible, sin importar cuántos nodos tenga.' },
      { t: 'arreglo', x: 'En Apuntes se quitó la pestaña "Mapa mental" (ya se había quitado antes "Mapas y diagramas"): solo queda Escribir.' },
      { t: 'mejora', x: 'Inicio de sesión: nuevo diseño con un panel de marca animado y una pequeña araña decorativa (puramente visual, no interactúa con nada).' },
    ],
  },
  {
    version: '2.10.1', fecha: '2026-10-18', titulo: 'Arreglo urgente: la fuente nueva rompía la app en Windows',
    cambios: [
      { t: 'arreglo', x: 'La fuente de exhibición del Dashboard (Fraunces) se importaba de una forma que no resolvía en algunos equipos Windows. Ya se importa de la misma forma segura que la fuente principal; se ve exactamente igual, solo que ya no rompe la app.' },
    ],
  },
  {
    version: '2.10.0', fecha: '2026-10-15', titulo: 'Más rápida, el aviso de conexión corregido, y un Dashboard con más personalidad',
    cambios: [
      { t: 'arreglo', x: 'La app se sentía más lenta porque Mermaid (los diagramas) se descargaba por completo al instalar, sin usarse. Ya se descarga solo cuando entras a Mapas y diagramas.' },
      { t: 'arreglo', x: 'El aviso de "sin conexión" en Grupo aparecía con solo 4 segundos de espera, muy poco para una conexión estable pero no siempre instantánea. Ya espera más antes de avisar.' },
      { t: 'mejora', x: 'Dashboard: nueva tipografía de exhibición para el saludo, destellos de color sutiles, y una entrada animada y escalonada en vez de que todo aparezca de golpe.' },
    ],
  },
  {
    version: '2.9.0', fecha: '2026-10-12', titulo: 'Pantallas de carga reales y estados vacíos explicados',
    cambios: [
      { t: 'mejora', x: 'El Dashboard y el Asistente ya no muestran un simple "Cargando…": ahora aparece la forma real del contenido mientras llega, para que la pantalla no "salte" de golpe.' },
      { t: 'mejora', x: 'El gráfico de carga de tareas del Asistente, cuando todavía no tienes tareas con fecha, explica por qué está vacío en vez de mostrar barras en cero sin contexto.' },
    ],
  },
  {
    version: '2.8.0', fecha: '2026-10-10', titulo: 'Todas las notificaciones de verdad, y auditoría de seguridad',
    cambios: [
      { t: 'arreglo', x: 'La campana solo avisaba de tus primeras 5 tareas vencidas y resumía el resto ("3 más"). Ahora avisa de todas, sin límite.' },
      { t: 'mejora', x: 'Revisión de seguridad: se confirmó que todas las tablas tienen los permisos correctos, y que los dos lugares donde se genera HTML (apuntes y referencias APA) escapan el texto correctamente antes de mostrarlo.' },
    ],
  },
  {
    version: '2.7.0', fecha: '2026-10-07', titulo: 'Racha de entrar cada día, reprogramar con aviso, y modo oscuro corregido',
    cambios: [
      { t: 'nuevo', x: 'Nueva racha: entrar a la app todos los días (independiente de tu racha de uso, que sigue igual). Se ve en el Dashboard y tiene sus propios logros a los 7 y 30 días.' },
      { t: 'nuevo', x: 'Reprogramar con aviso: en el detalle de una tarea vencida, un botón la mueve a mañana, en 3 días o en una semana, con una advertencia clara antes de hacerlo.' },
      { t: 'arreglo', x: 'Modo oscuro: el tablero de Tareas tenía columnas vacías con fondo blanco fijo, y el editor de Apuntes tenía un área de texto gris que no combinaba con el resto. Ambos corregidos; se revisaron 9 pantallas distintas.' },
    ],
  },
  {
    version: '2.6.0', fecha: '2026-10-04', titulo: 'Diagramas de verdad con Mermaid, tablero más ancho y tareas que se distinguen en la agenda',
    cambios: [
      { t: 'nuevo', x: 'El mapa conceptual y el diagrama de flujo ahora se dibujan con Mermaid, una librería real y muy usada para diagramas: cajas y flechas de verdad, con un estilo mucho más profesional y legible.' },
      { t: 'mejora', x: 'El tablero de Tareas ya aprovecha todo el ancho de la pantalla en vez de dejar un espacio vacío enorme a la derecha.' },
      { t: 'mejora', x: 'En la Agenda, las tareas ahora se ven con un patrón de rayas diagonales, bien distinto de las clases y otros bloques sólidos.' },
      { t: 'mejora', x: 'Arrastrar tarjetas en el tablero de Tareas ya funciona con el dedo en el celular (antes solo con mouse).' },
    ],
  },
  {
    version: '2.5.1', fecha: '2026-10-01', titulo: 'Grupo: ya no se cuela ningún error técnico',
    cambios: [
      { t: 'arreglo', x: 'En Grupo (crear un espacio, unirte, pedir un horario, aceptarlo…), si fallaba la conexión en el peor momento, a veces se mostraba el error crudo en inglés en vez del aviso claro. Ya está reforzado en todos los puntos: siempre se traduce antes de mostrarse.' },
    ],
  },
  {
    version: '2.5.0', fecha: '2026-09-29', titulo: 'Mensajes de error mucho más claros',
    cambios: [
      { t: 'mejora', x: 'Cuando algo necesita internet y no lo hay, la app ya no muestra errores técnicos en inglés (como "TypeError: NetworkError…"): ahora dice claramente que esa acción necesita conexión y que lo intentes de nuevo cuando la tengas.' },
      { t: 'mejora', x: 'Se distingue mejor cuando el problema es tu conexión de cuando es que la app no logra llegar a tu base de datos (proyecto de Supabase pausado, borrado, o con la dirección equivocada).' },
    ],
  },
  {
    version: '2.4.0', fecha: '2026-09-26', titulo: 'Parciales mucho más coherente, y un aviso claro cuando el problema es de Supabase',
    cambios: [
      { t: 'mejora', x: 'Parciales: las tarjetas que no encajan en una definición clara ahora funcionan como "completa la idea" (el inicio real de la oración y su continuación), en vez de preguntas raras como "¿qué dice el texto sobre...?".' },
      { t: 'arreglo', x: 'En "Ver y editar" tarjetas, las preguntas y respuestas largas ya no se cortan: se leen completas.' },
      { t: 'mejora', x: 'Si la app no puede conectarse a tu base de datos pero tu internet funciona bien, ahora lo dice claramente (antes solo decía "sin conexión", lo cual llevaba a revisar el wifi en vez del proyecto de Supabase).' },
    ],
  },
  {
    version: '2.3.1', fecha: '2026-09-23', titulo: 'Arreglo urgente: crear un apunte ya no falla',
    cambios: [
      { t: 'arreglo', x: 'Crear un apunte nuevo daba un error y no dejaba usar la app. Era una librería que se había agregado mal; ya se quitó por completo y se reemplazó por una función propia, sin depender de nada externo.' },
      { t: 'mejora', x: 'Arrastrar para reordenar los widgets del Dashboard ya funciona con el dedo en el celular (antes solo funcionaba con mouse).' },
      { t: 'nuevo', x: 'Grupo: ahora puedes salir de un espacio, o eliminarlo por completo si eres admin.' },
      { t: 'arreglo', x: 'Reforzado el aviso cuando un borrado es bloqueado por el servidor (quitar a alguien, eliminar una solicitud o un espacio): ya no desaparece para luego reaparecer solo.' },
    ],
  },
  {
    version: '2.3.0', fecha: '2026-09-20', titulo: 'Grupo más rápido y mapas conceptuales mucho mejores',
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
    version: '2.2.0', fecha: '2026-09-17', titulo: 'Arreglos importantes: borrado confiable y mapas que sí se entienden',
    cambios: [
      { t: 'arreglo', x: 'Si el servidor rechazaba en silencio un borrado (algo raro, pero posible), la app ya no lo daba por hecho: ahora lo detecta y te avisa en vez de que el elemento "reviva" solo.' },
      { t: 'arreglo', x: 'Al borrar un parcial, sus tarjetas y fuentes ya no se quedaban huérfanas en tu dispositivo.' },
      { t: 'mejora', x: 'Mapa conceptual: rediseñado por completo. Ahora muestra relaciones reales (término → definición) en tarjetas legibles, sin texto cortado.' },
      { t: 'mejora', x: 'Diagrama de flujo: ya no fuerza definiciones sueltas en forma de proceso. Solo arma el diagrama cuando el texto de verdad describe pasos (numerados o con palabras como "primero", "luego", "finalmente"); si no, te lo dice y te sugiere el mapa conceptual.' },
    ],
  },
  {
    version: '2.1.0', fecha: '2026-09-15', titulo: 'Apuntes (cuaderno digital) y Parciales mucho más completos',
    cambios: [
      { t: 'nuevo', x: 'Apuntes: un cuaderno digital con apuntes de clase, de tarea, de proyecto o libres. Editor con negrita, cursiva, títulos y listas, y vista previa.' },
      { t: 'nuevo', x: 'Mapa mental interactivo dentro de cada apunte: agrega ideas, arrástralas, renómbralas, o genera uno automático a partir de tu texto.' },
      { t: 'nuevo', x: 'Mapa conceptual y diagrama de flujo automáticos también disponibles dentro de Apuntes (los mismos de Parciales).' },
      { t: 'nuevo', x: '«Usar para un parcial»: manda cualquier apunte a un parcial nuevo o existente y genera sus tarjetas de estudio de una vez.' },
      { t: 'mejora', x: 'Parciales genera muchas más tarjetas y con mejor cobertura: ahora busca al menos una pregunta por cada idea del texto, no solo por las palabras más repetidas.' },
    ],
  },
  {
    version: '2.0.0', fecha: '2026-09-12', titulo: 'Espacios compartidos y preparación de parciales',
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
    version: '1.9.0', fecha: '2026-09-09', titulo: 'Dashboard personalizable y widget de metas',
    cambios: [
      { t: 'nuevo', x: 'Dashboard con widgets movibles: arrastra para reordenar (o usa las flechas ↑ ↓, más cómodo en el celular), oculta los que no uses y restablece cuando quieras. Todo se recuerda en tu dispositivo.' },
      { t: 'nuevo', x: 'Nuevo widget «Tus metas»: muestra el avance de tus metas de ahorro y de progreso más recientes directo en el Dashboard.' },
    ],
  },
  {
    version: '1.8.0', fecha: '2026-09-06', titulo: 'Espacio de trabajo por tarea, dificultad y tiempos que la app aprende',
    cambios: [
      { t: 'nuevo', x: 'Dificultad de las tareas (fácil, media, difícil) además de la prioridad. La app calcula cuánto tardarás y va aprendiendo de lo que de verdad tardas.' },
      { t: 'nuevo', x: 'Botón «Iniciar tarea»: abre un espacio de enfoque con temporizador, lista de pasos, documento de texto, hoja de cálculo, diapositivas, investigación (Wikipedia, diccionario y navegador) y ayuda de IA (ChatGPT, Claude, Gemini…).' },
      { t: 'nuevo', x: 'Dashboard personalizable: mueve, oculta y reordena los widgets. Nuevas vistas previas de tu horario y de tus tareas.' },
      { t: 'nuevo', x: 'Botón flotante «+» en toda la app para crear una tarea o iniciar un enfoque al instante.' },
      { t: 'mejora', x: 'Enfoque: sonidos de fondo sin internet, meta diaria de enfoque, presets de tiempo y lo que la app aprendió de tus tiempos.' },
    ],
  },
  {
    version: '1.7.0', fecha: '2026-09-03', titulo: 'Metas de progreso (leer un libro…) y vista previa dinámica',
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
    version: '1.6.0', fecha: '2026-09-01', titulo: 'Revisión semanal, logros, presupuesto inteligente y más personalización',
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
    version: '1.5.1', fecha: '2026-08-29', titulo: 'Metas: categorías de ahorro propias',
    cambios: [
      { t: 'nuevo', x: 'Crea tus propias categorías de ahorro (Viaje, Portátil, Matrícula…) desde Metas o al registrar un ahorro, y elígelas para saber a dónde va cada peso.' },
      { t: 'nuevo', x: 'En Metas verás «¿A dónde va tu ahorro?»: cuánto llevas en cada categoría, qué metas la usan y el ahorro que aún no tiene meta.' },
      { t: 'nuevo', x: 'Botón «Aportar» en cada meta: registra un ahorro que va directo a ella.' },
      { t: 'mejora', x: 'Al registrar un ahorro se muestra a qué meta cuenta; si dos metas comparten categoría, te avisa.' },
    ],
  },
  {
    version: '1.5.0', fecha: '2026-08-26', titulo: 'Actualizaciones automáticas y calendario más confiable',
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
    version: '1.4.0', fecha: '2026-08-23', titulo: 'Nuevo logo, barra inferior y notas por cortes',
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
    version: '1.3.0', fecha: '2026-08-21', titulo: 'Campana, resumen y asistente ampliado',
    cambios: [
      { t: 'nuevo', x: 'Campana de notificaciones dentro de la app y tablero de Resumen semanal y mensual.' },
      { t: 'nuevo', x: 'Asistente con Plan (qué hacer ahora), Trabajos (planificador y referencias APA) y Notas.' },
      { t: 'nuevo', x: 'Captura rápida de tareas escribiendo una frase, y vista de tareas por materia.' },
      { t: 'nuevo', x: 'Exportar tu agenda a Google Calendar, iPhone y Outlook (.ics y suscripción).' },
    ],
  },
  {
    version: '1.2.0', fecha: '2026-08-18', titulo: 'Notificaciones, modo oscuro y agenda unificada',
    cambios: [
      { t: 'nuevo', x: 'Notificaciones push con la app cerrada: tareas por vencer, clases, reuniones y resumen diario.' },
      { t: 'nuevo', x: 'Modo oscuro, nueva tipografía y Dashboard interactivo con gráficos.' },
      { t: 'nuevo', x: 'Agenda que junta clases, trabajo, reuniones y tareas; materias virtuales; tareas de universidad ligadas a una materia.' },
    ],
  },
  {
    version: '1.1.0', fecha: '2026-08-15', titulo: 'Funciona sin conexión',
    cambios: [
      { t: 'nuevo', x: 'La app se puede instalar y usar sin internet; los cambios se sincronizan solos al volver la conexión.' },
      { t: 'arreglo', x: 'Corregidos problemas de carga inicial y de inicio de sesión.' },
    ],
  },
];
