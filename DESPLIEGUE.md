# Cómo subir Workversity a GitHub y a Vercel

## 0. Antes de empezar
- Cuenta en **GitHub** (github.com) y en **Vercel** (vercel.com; entra con "Continue with GitHub").
- Instala **Git**: https://git-scm.com/download/win (deja las opciones por defecto).
- Tu proyecto de Supabase ya creado, con `supabase/schema.sql` ejecutado.
- ⚠️ **Nunca subas el archivo `.env`**. Ya está en `.gitignore`; igual verifica en el paso 3.

## 1. Crear el repositorio en GitHub
1. GitHub → **New repository**.
2. Nombre: `workversity`. Elige **Private** (recomendado).
3. **No** marques "Add a README", ni `.gitignore`, ni licencia (el proyecto ya los trae). Crea el repositorio.

## 2. Subir el código (desde tu computador)
Abre una terminal (cmd o PowerShell) **en la carpeta del proyecto** (`C:\xampp1\htdocs\workversity`):

```
git init
git branch -M main
git config user.name "Tu Nombre"
git config user.email "tu-correo@ejemplo.com"
git add .
git commit -m "Workversity 1.6.0"
git remote add origin https://github.com/TU-USUARIO/workversity.git
git push -u origin main
```
La primera vez se abre el navegador para iniciar sesión en GitHub.

## 3. Verifica que no se subió nada secreto
```
git ls-files | findstr /i ".env"
```
Debe mostrar solo `.env.example`. Si aparece `.env`, ejecuta `git rm --cached .env`, haz `git commit -m "Quitar .env"` y `git push`, y cambia tus claves en Supabase (Project Settings → API).

## 4. Publicar en Vercel
1. Vercel → **Add New… → Project** → importa `workversity`.
2. Se detecta **Vite** solo. Deja: Build Command `npm run build`, Output Directory `dist`.
3. Abre **Environment Variables** y agrega (para Production, Preview y Development):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY`
4. Pulsa **Deploy**. Al terminar tendrás una dirección como `https://workversity-xxxx.vercel.app`.

## 5. Conectar Supabase con tu dirección de Vercel
Supabase → **Authentication → URL Configuration**:
- **Site URL**: tu dirección de Vercel.
- **Redirect URLs**: agrega `https://TU-DIRECCION.vercel.app/**` (y `http://localhost:5173/**` para desarrollo).

Sin esto, los correos de "olvidé mi contraseña" o confirmación apuntan a otra dirección.

## 6. Probar
Abre tu dirección de Vercel, inicia sesión e instala la app (botón "Instalar" del navegador, o en iPhone: Compartir → Añadir a pantalla de inicio).

## 7. Actualizar la app (el día a día)
```
git add .
git commit -m "Descripción del cambio"
git push
```
Vercel publica solo en 1–2 minutos. Las apps instaladas se actualizan solas y muestran el reporte de cambios.
**Antes de publicar cambios importantes:** agrega la entrada en `src/changelog.js` y sube `version` en `package.json`.

## 8. Funciones extra (una sola vez)
- **Notificaciones push y calendario suscrito**: despliega las funciones de Supabase (`enviar-recordatorios`, `calendario`) y programa el envío. Pasos en `MANUAL.md`.

## Problemas frecuentes
| Síntoma | Solución |
|---|---|
| Pantalla en blanco o "Falta conectar la base de datos" | Faltan las variables de entorno en Vercel → agrégalas y **Redeploy**. |
| Cambié variables y no pasa nada | Las variables solo se aplican al volver a desplegar (Deployments → ⋯ → Redeploy). |
| Falla el build | Abre el log del deployment. En tu computador prueba `npm run lint`, `npm test` y `npm run build`. |
| Error 404 al recargar una página | No debería pasar: `vercel.json` ya redirige todo al `index.html`. |
| Sigo viendo la versión vieja | La app se actualiza sola (hasta 12 s tras abrirla). Ajustes → «Buscar actualizaciones». |

## Sin GitHub (alternativa rápida)
Con la CLI de Vercel: `npx vercel` en la carpeta del proyecto (te guía paso a paso) y `npx vercel --prod` para publicar.
