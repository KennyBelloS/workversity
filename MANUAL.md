# Workversity Web (completa) — Manual paso a paso

Versión **completa** de tu app, en JavaScript (React + Vite), con **Supabase**
como base de datos y con **login real** (correo y contraseña) — hecha
siguiendo el mismo patrón que usa tu app de calculadora-costo-tallo
(React + Vite + Supabase + Tailwind).

## Módulos incluidos (todos, ninguno de menos)

| Módulo | Qué hace |
|---|---|
| **Login / Registro** | Cuenta real con correo y contraseña (Supabase Auth), recuperar contraseña |
| **Dashboard** | Saludo, resumen del día, plan de hoy (horario + tareas), tareas por vencer, balance del mes |
| **Tareas** | Tablero Kanban (arrastrar y soltar), vistas Día/Semana/Mes, fotos, recordatorios, recurrencia |
| **Horario** | Cuadrícula semanal con tus bloques fijos (clase, trabajo, almuerzo, otro) |
| **Materias** | Tus materias de la universidad: profesor, salón, NRC, prioridad |
| **Finanzas** | Ingresos/gastos/ahorros, presupuesto mensual, gráfico de gastos por categoría |
| **Metas de ahorro** | Con progreso automático según tus movimientos de tipo "Ahorro" |
| **Asistente inteligente** (nuevo) | Predicción de carga a 14 días, alertas de sobrecarga, patrones de concentración, energía diaria, Modo Supervivencia, Pomodoro adaptativo con pausa antiestrés, micro-tareas, gamificación por descanso, "Despeje semanal" |
| **Configuración** | Editar nombre, cambiar contraseña, descargar copia de seguridad, cerrar sesión |

## El módulo de Asistente Inteligente, explicado

Implementé cada regla que pediste como lógica determinista en
`src/lib/motorAnalitica.js` — corre al instante en el navegador de cada
usuario, sin depender de ningún servicio de IA externo (así que no tiene
costo por uso ni límites de cuota):

- **Predicción de carga (14 días) + alertas de sobrecarga**: suma la
  duración estimada de tus tareas por día y la compara contra tu
  "capacidad máxima diaria" (configurable). Si un día la supera, aparece
  en rojo en el gráfico y en la lista de alertas, con una sugerencia de
  cuál tarea mover.
- **Patrones de concentración**: cada Pomodoro que completas queda
  registrado con su hora. El gráfico de barras te muestra en qué hora del
  día completas más — esa es tu mejor franja para tareas complejas.
- **Barra de batería humana**: registras tu energía (1-5) una vez al
  día. Si marcas 1 o 2, aparece un botón para reorganizar el día: mueve a
  mañana todo lo que no sea prioridad alta ni una tarea corta ("quick
  win" de 20 min o menos).
- **Pausa antiestrés obligatoria**: el Pomodoro cuenta tus minutos
  trabajados hoy (sesiones consecutivas, con menos de 15 min entre
  ellas). Al llegar a 2 horas seguidas, el próximo Pomodoro no arranca
  sin antes mostrar una respiración guiada 4-7-8 (3 ciclos).
- **Capacidad máxima ajustable y hora límite**: configurables en el
  propio módulo — son los números reales que usa el motor de alertas.
- **Micro-tasking**: en el formulario de una tarea ya existente, si le
  pones 90 minutos o más de duración estimada, aparece un botón para
  dividirla en sub-tareas de ~25 min cada una (se crean como tareas
  nuevas vinculadas a la original).
- **Modo Supervivencia**: un botón en el Asistente. Mientras esté
  activo, el tablero de Tareas solo muestra lo de prioridad alta o lo
  que vence en menos de 3 días — todo lo demás queda oculto (no
  eliminado) hasta que lo desactives.
- **Pomodoro adaptativo**: 25 min para tareas "mecánicas", 50 min para
  trabajo profundo — elegible en el propio temporizador.
- **Gamificación por bienestar**: +5 puntos por registrar tu energía del
  día, +10 puntos por completar un Pomodoro entero (no por saltártelo).
  Los puntos se ven en la parte superior del Asistente.
- **Despeje semanal ("Clear Horizon")**: un medidor circular con el % de
  tareas de esta semana ya resueltas — baja la presión visualmente a
  medida que avanzas.

**Para que este módulo funcione, tienes que correr un archivo SQL
adicional** — ver el paso nuevo en la Parte 1 de abajo.

## Una decisión importante que tomé (léela)

Me pediste usar Supabase "tal cual lo usa la otra aplicación" (costo-tallo).
Seguí **exactamente el mismo patrón de código** (mismo cliente de Supabase,
mismo AuthContext, mismo estilo de políticas de seguridad). Pero **no
reutilicé el mismo proyecto de Supabase** de costo-tallo — te armé las
instrucciones para crear uno nuevo, gratis, solo para Workversity.

¿Por qué? Porque son dos aplicaciones completamente distintas (una es para
calcular costos de una empresa floricultora, la otra es tu organizador
personal). Meter las tablas de ambas en el mismo proyecto mezclaría datos
de dos cosas sin relación, y si algo sale mal en una app (una política de
seguridad, un límite de uso) podría afectar a la otra. Un proyecto de
Supabase gratis te alcanza de sobra para esta app — si de verdad prefieres
usar el mismo proyecto que costo-tallo, se puede, pero te recomiendo que no.

---

## Parte 1 — Crear tu base de datos en Supabase (una sola vez)

1. Entra a **supabase.com** → crea una cuenta gratis (puedes usar GitHub).
2. **"New Project"** → ponle un nombre (ej: `workversity`) → elige una
   contraseña para la base de datos (guárdala, no la necesitarás seguido) →
   elige la región más cercana a ti → **"Create new project"**. Tarda 1-2
   minutos en aprovisionarse.
3. Una vez listo, ve al ícono de **SQL Editor** (barra lateral izquierda).
4. Abre el archivo `supabase/schema.sql` de este proyecto (sirve también para actualizar una base ya existente) (con cualquier
   editor de texto), copia **todo** su contenido, y pégalo en el SQL
   Editor de Supabase.
5. Dale a **"Run"**. Deberías ver "Success. No rows returned" — eso crea
   las 7 tablas, la seguridad por usuario, y el trigger que crea tu perfil
   automáticamente al registrarte.
6. (Ya no hace falta: `schema.sql` incluye ahora el módulo de Asistente
   Inteligente. `schema_analitica.sql` fue eliminado.)
7. Ve a **Project Settings** (ícono de engranaje) → **API**. Ahí vas a ver
   dos datos que necesitas:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (una clave larga que empieza con `eyJ...`)

### Sobre la confirmación de correo (opcional pero recomendado revisar)

Por defecto, Supabase pide confirmar el correo antes de poder iniciar
sesión después de registrarse. Si quieres que la gente pueda entrar
inmediatamente después de registrarse (útil mientras pruebas la app tú
solo): **Authentication → Providers → Email** → desactiva "Confirm email".

---

## Parte 2 — Probarlo en tu computadora

### Requisitos
- [Node.js](https://nodejs.org) instalado (versión 18+).

### Pasos
1. Descomprime este proyecto en una carpeta.
2. Abre una terminal ahí dentro.
3. Copia `.env.example` y renómbralo a `.env` (o créalo desde cero).
4. Ábrelo y pon tus datos reales de Supabase:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon-real
   ```
5. Instala dependencias:
   ```
   npm install
   ```
6. Levanta el servidor:
   ```
   npm run dev
   ```
7. Abre **http://localhost:5173** — deberías ver la pantalla de login.
   Regístrate con tu correo (si activaste la confirmación de correo,
   revisa tu bandeja antes de intentar entrar).

---

## Parte 3 — Publicarlo gratis en Vercel

1. Sube esta carpeta a un repositorio nuevo de GitHub.
2. Entra a **vercel.com** → inicia sesión con GitHub → **"Add New" →
   "Project"** → elige el repositorio.
3. Vercel detecta que es un proyecto Vite automáticamente.
4. **Antes de darle a Deploy**, abre la sección **"Environment
   Variables"** y agrega las dos mismas variables de tu `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Dale a **"Deploy"**. En 1-2 minutos tienes tu URL pública
   (`https://tu-proyecto.vercel.app`), ya con base de datos real y login
   funcionando desde cualquier dispositivo.

### Actualizar después de hacer cambios
Cada `git push` republica automáticamente sola — no tienes que hacer nada más.

---

## Diferencias honestas frente a la app de Android/iPhone

- **Los recordatorios y "agregar al calendario"** funcionan distinto en
  un navegador (no hay notificaciones nativas del celular ni Calendario
  nativo). Aquí "agregar al calendario" abre un evento pre-llenado en
  Google Calendar. Los recordatorios en el navegador quedaron fuera de
  esta primera versión completa — dime si los quieres y te los agrego
  (funcionarían solo mientras la pestaña esté abierta, igual que te
  expliqué en la versión anterior).
- **Ahora SÍ hay sincronización real entre dispositivos** (a diferencia
  de la versión anterior con localStorage): como los datos viven en
  Supabase, si entras desde tu celular, tu laptop, o cualquier
  navegador con tu misma cuenta, vas a ver exactamente la misma
  información.

## Estructura del proyecto

```
workversity-supabase/
├── supabase/schema.sql      ← Todo el esquema de la base de datos
├── src/
│   ├── services/            ← Un archivo por módulo: tareas, horario,
│   │                           materias, finanzas, auth, supabase.js
│   ├── context/AuthContext.jsx
│   ├── components/
│   │   ├── layout/          ← Sidebar, Topbar, Layout
│   │   ├── tareas/          ← Tablero, vistas, modal, detalle
│   │   ├── horario/         ← Cuadrícula semanal, modal de bloque
│   │   ├── materias/        ← Tarjeta y modal de materia
│   │   └── finanzas/        ← Modal de movimiento, gráfico de gastos
│   └── pages/                ← Una página por módulo (rutas)
├── .env.example
└── vercel.json
```

## Ideas para seguir mejorando (dime cuál te interesa)

- Recordatorios por notificación del navegador (como en la versión
  anterior, con la misma limitación de "solo si la pestaña sigue abierta").
- Botón para importar el `.json` de respaldo de vuelta a Supabase.
- Modo oscuro.
- Subida de fotos a Supabase Storage en vez de guardarlas como texto
  base64 dentro de la tabla (mejor para muchas fotos grandes).


---

## Modo sin conexión (PWA)

- La app es una **PWA**: un Service Worker (generado por `vite-plugin-pwa`)
  guarda toda la aplicación, así abre sin internet.
- Tus datos se copian en el dispositivo (IndexedDB, carpeta `src/offline`).
  Lo que crees o edites sin conexión queda en una cola y se sube solo al volver
  el internet. Si dos dispositivos editan lo mismo, gana el último en llegar.
- Para iniciar sesión por primera vez se necesita internet; después la app abre
  sin conexión aunque el token haya vencido.
- Para instalarla: botón "Instalar" en la app (Chrome/Edge/Android) o, en iPhone,
  Compartir → "Añadir a pantalla de inicio".
- Cerrar sesión borra los datos locales del dispositivo.
- Solo se puede probar el Service Worker con `npm run build && npm run preview`
  (en `npm run dev` está desactivado).

## Si la app no carga (pantalla en blanco)

1. Debe existir `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. En Vercel: Settings → Environment Variables → agrégalas y haz **Redeploy**
   (`.env` no se sube a GitHub, por eso Vercel no lo tiene).
3. Si sigue mal, en la app usa "Limpiar caché de la app y recargar" o abre la
   consola del navegador (F12) y revisa el error.

---

## Notificaciones push (avisos con la app cerrada)

Funcionan con Web Push: el navegador/sistema recibe el aviso aunque la app no esté abierta.
Tienes que hacer esta configuración **una sola vez**:

1. **Ejecuta `supabase/schema.sql`** en el SQL Editor (crea las tablas nuevas).
2. **Genera las claves VAPID** en tu computador: `npx web-push generate-vapid-keys`
   - Copia la *Public Key* en tu `.env`: `VITE_VAPID_PUBLIC_KEY=...` (y en Vercel) y vuelve a compilar.
   - Guarda la *Private Key* solo como secreto de Supabase (nunca en el código).
3. **Despliega la función** (necesitas la CLI de Supabase):
   ```
   npx supabase login
   npx supabase link --project-ref TU-REF
   npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:tu@correo.com CRON_SECRET=una-clave-larga-inventada
   npx supabase functions deploy enviar-recordatorios --no-verify-jwt
   ```
4. **Programa la ejecución cada minuto:** edita `supabase/push_setup.sql` (TU-REF y TU_CRON_SECRET) y ejecútalo en el SQL Editor.
5. En la app: **Configuración → Notificaciones → Activar** (en cada dispositivo).

Qué avisa: tareas antes de su hora de entrega (según el recordatorio de cada tarea; las de prioridad alta
además a los 10 min), clases (según cada materia), reuniones y turnos de trabajo (1 h antes por defecto),
tareas recién vencidas y un resumen diario a la hora que elijas.

**iPhone/iPad:** Apple solo permite notificaciones si la app está instalada (Compartir → Añadir a pantalla de inicio, iOS 16.4 o superior).
Android, Windows y Mac (Chrome/Edge) funcionan también desde el navegador y, mejor aún, instalada.

## Instalar como app

- **Android / Windows / Mac (Chrome o Edge):** botón "Instalar" que aparece en la app (o el ícono en la barra de direcciones).
- **iPhone/iPad (Safari):** Compartir → Añadir a pantalla de inicio.
- **Mac (Safari 17+):** Archivo → Añadir al Dock.

Esto es una PWA: se instala y se ve como una app nativa, pero no se publica en App Store ni Google Play.
Si algún día lo necesitas, se puede envolver con Capacitor (móvil) o Tauri/Electron (escritorio).

---

## Novedades v4: campana, resumen, asistente ampliado, calendario

**1. Actualiza la base de datos (obligatorio).** Ejecuta de nuevo `supabase/schema.sql` en el SQL Editor (es seguro repetirlo).
Agrega: fecha de cierre de tareas (`completed_at`), enlace de calendario (`calendario_token`) y la tabla `evaluaciones` (notas).
Sin este paso, marcar tareas como hechas o guardar notas falla.

**2. Campana de notificaciones** (arriba, junto al modo oscuro): muestra tareas vencidas, las que vencen en 24 h, clases y
reuniones de las próximas 3 h, y consejos. Funciona sin internet.

**3. Resumen** (menú lateral): tablero semanal/mensual con tareas completadas, cumplimiento, enfoque, clases, dinero,
tabla por materia, frases con tus datos, "Copiar resumen" e "Imprimir / PDF".

**4. Asistente** (pestañas): *Plan* (qué hacer ahora, matriz de prioridades, racha), *Enfoque* (lo anterior),
*Trabajos* (planificador de entregas que crea sub-tareas, estructuras y listas de revisión, generador de referencias APA,
contador de texto) y *Notas* (calculadora: cuánto necesitas para aprobar con 3.0).

**5. Captura rápida** (Dashboard): escribe "informe de física mañana 5pm !alta" y se crea la tarea con fecha, prioridad y materia.

**6. Tareas por materia:** vista "Materias" en Tareas y sección al final de la página Materias.

**7. Calendario de Google / iPhone / Outlook** (Agenda → botón Calendario, o Configuración):
- *Descargar .ics:* copia de hoy, con alarmas. No requiere nada más.
- *Suscribirte (se actualiza sola):* despliega la función una vez:
  ```
  npx supabase functions deploy calendario --no-verify-jwt
  ```
  y luego copia el enlace desde la app (Google: "Otros calendarios → Desde URL"; iPhone/Mac: botón "iPhone / Mac").
  El enlace es secreto: quien lo tenga puede ver tu agenda. Puedes generar uno nuevo desde la misma pantalla.

---

## Novedades v5: notas por cortes, barra inferior, guía animada

1. **Actualiza la base de datos:** ejecuta de nuevo `supabase/schema.sql` (agrega la columna `corte` y la tabla `cortes_notas`).
2. **Notas por cortes** (Asistente → Notas): 3 cortes por materia con pesos editables (por defecto 35 · 35 · 30). En cada corte agregas
   las actividades y cuánto vale cada una (suman 100% del corte). La nota del corte y la final se calculan solas, con meta configurable,
   plantillas, "desde mis tareas", simulador y alertas de materias en riesgo (campana, Dashboard y Resumen).
3. **Barra de navegación inferior** en todos los tamaños: barra pegada abajo en celular (5 secciones + "Más"), flotante en tablet y
   con todas las secciones en computador. El logo y la búsqueda están arriba.
4. **Buscar:** Ctrl + K (o "/") busca tareas, materias y secciones.
5. **Cómo se usa** (barra inferior → Más → Cómo se usa, o el "?" de arriba): recorrido animado por cada módulo, mapa interactivo
   de cómo se conectan y checklist de inicio. También se muestra una vez al entrar por primera vez.
6. **Huecos libres** (Asistente → Plan): espacios de 45+ min entre tus clases, con la tarea sugerida para cada uno.
7. **Logo nuevo** en la app, los íconos de instalación y las notificaciones.

---

## Novedades v6: notas con desglose, guardar con botones y hábitos

1. **Actualiza la base de datos:** ejecuta de nuevo `supabase/schema.sql` (agrega la columna `items` a `evaluaciones`).
2. **Notas:** escala 0.0–5.0; se aprueba desde 3.0 y se pierde con 2.9 o menos. Puedes escribir `3.5` o `35`.
   - Cada corte muestra su nota y si vas ganando o perdiendo, y cuánto necesitas en lo que falta para ganarlo.
   - La materia muestra "Vas ganando / Vas perdiendo", tu nota proyectada y lo que necesitas para aprobar (y para tu meta, si la pusiste).
   - **Desglose:** en una actividad (p. ej. "Talleres 30%") pulsa el ícono de capas para crear Taller 1, 2, 3…; todas valen lo mismo y su nota es el promedio.
   - **Guardar:** los cambios se guardan con el botón "Guardar corte" (o Enter); ves un aviso mientras haya cambios sin guardar.
3. **Hábitos** (Asistente → Hábitos): la app aprende cuánto tardas de verdad, tus mejores horas y días, cuándo entregas y cómo influye tu energía.
   Lo usa para ajustar el planificador de entregas, los huecos libres, el recordatorio que te sugiere al crear una tarea y las alertas
   "Empieza hoy". Todo se calcula en tu dispositivo; puedes desactivar "Usar lo aprendido" cuando quieras.
   Para que aprenda más rápido: pon minutos estimados, elige la tarea al iniciar un Pomodoro, marca las tareas al terminarlas y registra tu energía.

---

## Notas: escala 0.0–5.0, desglose y guardado con botones

- Se aprueba desde **3.0**; de 2.9 hacia abajo se pierde. Puedes escribir la nota como `3.5`, `3,5` o `35` (escala 00–50: `35` = 3.5, `30` = 3.0, `50` = 5.0).
- Cada corte muestra su **nota** (promedio de lo calificado) y si **vas ganando o perdiendo**, con los números actualizándose mientras escribes.
- En una actividad, el botón de capas la **desglosa en partes iguales** (Talleres → Taller 1, 2, 3…). Cada parte lleva nombre y nota; la actividad muestra el promedio.
- Los cambios se guardan con **«Guardar corte N»** (o Enter); «Descartar» vuelve a lo último guardado.
- Base de datos: la columna `items` (desglose) se agrega con `supabase/schema.sql` (sección v6).

---

## Actualizaciones automáticas y reporte de cambios (v1.5.0)

- La app **se actualiza sola**. Cuando hay una versión nueva se descarga en segundo plano y se instala: al abrir la app, al mandarla al fondo, o tras una cuenta regresiva de 12 s. Si estás escribiendo o tienes cambios sin guardar (p. ej. en Notas), **espera a que termines**. Vale también para la app instalada en el celular o el computador.
- El aviso trae **«Ver cambios»** (qué trae la versión nueva, antes de instalarla) y **«Actualizar ya»**.
- Después de actualizarse aparece un **reporte de cambios**. El historial completo está en *Cómo se usa* y en *Ajustes → Versión y actualizaciones* (ahí también está «Buscar actualizaciones»).
- **Para publicar una versión nueva** (lo haces tú, o yo cuando te entrego cambios): 1) agrega una entrada arriba en `src/changelog.js`, 2) sube `"version"` en `package.json` (deben coincidir), 3) `npm run build` y publica. Con eso se genera `version.json` y las apps instaladas se enteran solas.
- Las actualizaciones automáticas solo llegan si la app está **publicada** (Vercel u otro hosting) y se vuelve a desplegar. Con `npm run preview` en tu computador tienes que volver a ejecutar `npm run build`.
- La primera vez, la app instalada con la versión anterior mostrará el aviso viejo («Actualizar»): púlsalo una vez y de ahí en adelante todo es automático.

## Calendario: si no se exporta nada

1. **Archivo .ics** (Agenda → Calendario → *Descargar .ics*): funciona sin configurar nada. En el celular usa *Compartir / abrir en mi calendario*. Se descarga como `workversity.ics` en tu carpeta de Descargas.
2. **Suscripción:** la ventana muestra «Activa» o «No disponible». Si dice *No disponible*, falta desplegar (o volver a desplegar) la función:
   `npx supabase functions deploy calendario --no-verify-jwt`
3. **Uno por uno a Google Calendar:** sin archivos ni configuración; un clic por evento.

---

## Metas: categorías de ahorro propias (v1.5.1)

- Ejecuta de nuevo `supabase/schema.sql` (sección v7): crea la tabla `categorias_ahorro`.
- Crea categorías propias (Viaje, Portátil, Matrícula…) desde **Metas → Nueva categoría**, o al crear una meta / registrar un ahorro (**Crear categoría nueva**).
- Cada meta se vincula a una categoría; el progreso de la meta suma los ahorros de esa categoría.
- **Metas → «¿A dónde va tu ahorro?»**: cuánto hay en cada categoría, qué metas la usan y el ahorro que aún no tiene meta.
- **Aportar** (en cada meta) registra un ahorro que va directo a su categoría. Una categoría solo se puede borrar si no tiene ahorros ni metas.

---

## Novedades v1.6.0

Revisión semanal (Resumen → «Revisión semanal»), logros, presupuesto inteligente (aviso al 80% y al pasarte), color de acento y tamaño de texto (Ajustes → Apariencia), restaurar copia de seguridad (Ajustes), deshacer al eliminar/completar tareas, repeticiones configurables, insignia en el ícono de la app y la tecla Escape para cerrar ventanas.
No requiere cambios en la base de datos. Para publicar en GitHub y Vercel mira **DESPLIEGUE.md**.

---

## Metas de progreso y vista previa (v1.7.0)

- **Actualiza la base de datos:** ejecuta de nuevo `supabase/schema.sql` (sección v8): agrega `tipo` y `unidad` a las metas, `tipo` a las categorías y la tabla `avances_meta`.
- **Metas → Nueva meta → «📖 Progreso»:** leer un libro, terminar un curso, horas de estudio, ejercicio… Elige la unidad (páginas, capítulos, horas…), cuánto quieres lograr, categoría y fecha límite.
  Registra avances con **«+10»** (un toque) o **«Registrar avance»**; la tarjeta calcula tu ritmo, cuándo terminarás y cuánto necesitas por día.
- Las categorías son las mismas del módulo de Metas: las de progreso (Lectura, Estudio, Salud y deporte, Hábitos, Proyecto personal) y las que crees.
- **Vista previa:** pasa el mouse sobre una tarea o una clase (Tareas, Agenda, Dashboard, Materias) o mantén pulsado en el celular. Escape la cierra.

---

## Novedades v2.0.0: Grupo (agenda compartida) y Parciales

### 1. Ejecuta el SQL nuevo en Supabase
Ejecuta el archivo completo `supabase/schema.sql` en el SQL Editor de tu proyecto (ábrelo con el Bloc de notas, Ctrl+A, copiar y pegar; es seguro repetirlo y no borra datos). Agrega, entre otras cosas:
- `espacios`, `espacio_miembros`, `solicitudes_horario` y las funciones `crear_espacio` / `unirse_a_espacio` (para Grupo).
- `parciales`, `parcial_fuentes`, `parcial_tarjetas`, `parcial_resultados` (para Parciales).

Si tu gestor de Supabase te muestra un error de "ya existe" en algo, es normal al repetir el script; sigue ejecutándolo, el resto se aplica igual.

### 2. Grupo (agenda compartida)
- Ve a **Grupo** (en el celular: barra inferior → Más → Grupo). Crea un espacio o únete con un código de 6 letras.
- Roles: **admin** (acceso total, puede ascender/quitar personas) y **miembro** (mismo acceso a las funciones del espacio, pensado para el día a día).
- **Pedir un espacio en la agenda**: propones un horario, la otra persona lo acepta o rechaza. Al aceptarse, aparece en la **agenda compartida** para todos.
- Por privacidad, la agenda compartida solo muestra los horarios que alguien pidió y fueron aceptados — no expone tus materias, bloques o tareas personales completas.
- **Tabla de posiciones**: compara los puntos de cada quien (los mismos que ya ganas completando tareas, Pomodoros y rachas).

### 3. Parciales
- Ve a **Parciales**, crea uno con su materia y fecha.
- Sube una **foto** de tus apuntes (usa reconocimiento de texto, tarda unos segundos), un **PDF**, un **Word** (.docx), un **Excel** (.xlsx), o pega el texto directamente. Todo se procesa en tu propio navegador, nada se sube a un servidor externo.
- La app genera **tarjetas de estudio** automáticamente (editables). Tiene **modo estudio** con repetición espaciada, **mini test**, **simulación de examen** cronometrada, **mapa conceptual**, **diagrama de flujo** y **consejos de estudio** según cuántos días falten y cómo te ha ido.
- Las tarjetas y mapas se generan con reglas (frecuencia de palabras, patrones "X es Y", "X: Y"…), no con una IA externa: funciona sin conexión y no depende de un servicio de pago. Revisa y ajusta lo que genera; es un punto de partida, no un sustituto de leer tus apuntes.

Guías paso a paso más detalladas de ambas están en **Cómo se usa**, dentro de la app.
