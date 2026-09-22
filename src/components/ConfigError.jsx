export default function ConfigError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-lg2 bg-white p-8 shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-dangerSoft text-2xl">⚙️</div>
        <h1 className="text-center text-lg font-extrabold text-textPrimary">Falta conectar la base de datos</h1>
        <p className="mt-2 text-center text-sm text-textSecondary">
          La app no encontró las claves de Supabase, por eso no puede cargar.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-textPrimary">
          <li>
            En <b>Vercel</b> → tu proyecto → <b>Settings → Environment Variables</b>, agrega:
            <pre className="mt-1.5 overflow-x-auto rounded-sm2 bg-bg p-2.5 text-[11px]">
{`VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY`}
            </pre>
          </li>
          <li>
            Ve a <b>Deployments → ⋯ → Redeploy</b> (las variables solo se aplican al volver a desplegar).
          </li>
          <li>
            En tu computador: copia <code>.env.example</code> a <code>.env</code> y pon tus datos reales.
          </li>
        </ol>
      </div>
    </div>
  );
}
