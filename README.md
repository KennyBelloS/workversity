# Workversity

Organiza tu vida entre **trabajo y universidad**: tareas, agenda, materias, notas por cortes, finanzas, metas de ahorro, asistente inteligente y notificaciones. Es una **PWA** (se instala como app y funciona sin conexión) hecha con React + Vite + Supabase.

## Funciones principales
- Tareas (tablero, día, semana, mes, por materia), captura rápida en lenguaje natural, repeticiones y deshacer.
- Agenda unificada: clases, trabajo, reuniones y tareas; exportación a Google Calendar / iPhone / Outlook.
- Notas por cortes (35 · 35 · 30) con actividades, desglose en partes iguales y veredicto ganando/perdiendo.
- Finanzas: ingresos, gastos, ahorro, presupuesto inteligente y metas (de ahorro y de progreso, como leer un libro) con categorías propias.
- Vista previa dinámica de tareas y clases (cuenta regresiva en vivo, hueco sugerido, notas…).
- Asistente: qué hacer ahora, huecos libres, planificador de entregas, referencias APA, hábitos.
- Revisión semanal, logros, resumen semanal/mensual.
- Funciona sin internet (IndexedDB + Service Worker), notificaciones push, modo oscuro y personalización.
- Se actualiza sola y muestra un reporte de cambios.

## Puesta en marcha
```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env  (y completa tus claves)
npm run dev               # http://localhost:5173
```

### Variables de entorno (`.env`)
| Variable | Para qué |
|---|---|
| `VITE_SUPABASE_URL` | URL de tu proyecto de Supabase (sin `/` final) |
| `VITE_SUPABASE_ANON_KEY` | Clave pública `anon` de Supabase |
| `VITE_VAPID_PUBLIC_KEY` | Clave pública para notificaciones push (`npx web-push generate-vapid-keys`) |

> El archivo `.env` **no se sube a Git** (está en `.gitignore`). En Vercel las variables se configuran en el panel del proyecto.

### Base de datos
Ejecuta `supabase/schema.sql` completo en el **SQL Editor** de Supabase (es seguro repetirlo).

### Comandos
| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (sin Service Worker) |
| `npm run build` | Compila para producción (genera el Service Worker y `version.json`) |
| `npm run preview` | Sirve la versión compilada (aquí funcionan el modo sin conexión y las notificaciones) |
| `npm run lint` | Revisa el código |
| `npm test` | Pruebas automáticas (Vitest) |

## Estructura
```
src/
  pages/            pantallas (Dashboard, Tareas, Agenda, Finanzas, Metas, Asistente…)
  components/       piezas de interfaz por sección
  lib/              lógica pura y probada (notas, alertas, resumen, logros, presupuesto…)
  offline/          almacenamiento local, cola de sincronización y repositorio
  services/         acceso a datos (Supabase) por tabla
  pwa/              Service Worker, instalación y actualizaciones automáticas
  changelog.js      historial de versiones (reporte de cambios)
supabase/
  schema.sql        base de datos completa
  functions/        Edge Functions (recordatorios push y calendario)
tests/              pruebas automáticas
```

## Publicar
Mira **DESPLIEGUE.md** (GitHub + Vercel paso a paso).

## Publicar una versión nueva
1. Agrega una entrada arriba en `src/changelog.js`.
2. Sube `"version"` en `package.json` (deben coincidir; hay una prueba que lo verifica).
3. `git add . && git commit -m "Versión X.Y.Z" && git push`. Vercel la publica y las apps instaladas se actualizan solas.
