# Supabase en local (réplica del esquema)

Replica el **esquema** aplicando las mismas migraciones que en la nube. Los **datos** de producción no se aplican solos al hacer `db reset`; para acercarte a la nube puedes usar el CLI (`db dump` enlazado + `db query` local) o un `pg_dump` / restore manual — ver [Datos de la nube en local](#datos-de-la-nube-en-local).

## Requisitos

1. **Docker Desktop** instalado y **en ejecución** (el error `dockerDesktopLinuxEngine` indica que Docker está apagado).
2. **Node.js** (ya lo usas con Vite).

No hace falta instalar el CLI globalmente: los scripts usan `npx supabase`.

## 1. Arrancar Supabase local

En la carpeta `conexionfit`:

```powershell
npm run supabase:start
```

La primera vez descarga imágenes (varios minutos). Al terminar verás la **API URL**, la **anon key** y enlaces a **Studio** (54323) e **Inbucket** (correo de prueba).

## 2. Aplicar migraciones + seed

Recrea la base desde cero y ejecuta `supabase/seed.sql`:

```powershell
npm run supabase:reset
```

Si una migración falla, revisa el mensaje en consola o en los logs del contenedor `supabase_db_conexionfit`.

## 3. Variables de entorno para la app

Tras `supabase start`, ejecuta:

```powershell
npm run supabase:status
```

Copia **API URL** (suele ser `http://127.0.0.1:54321`) y la **anon key**.

Crea el archivo **`conexionfit/.env.local`** (no lo subas a git; ya está en `.gitignore` habitual):

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...pega_la_anon_key_local...
VITE_SUPABASE_PROJECT_ID=conexionfit
```

Vite carga `.env.local` con prioridad sobre `.env`, así sigues pudiendo tener `.env` apuntando a la nube cuando quieras.

## 4. Usuario administrador local

1. Abre **Studio**: http://127.0.0.1:54323  
2. **Authentication → Users → Add user** (ej. `admin@local.test` + contraseña).  
3. **SQL → New query** y sigue el comentario en `supabase/scripts/seed_local_admin.sql` para insertar el rol `admin` en `user_roles` con el UUID de ese usuario.

Sin rol `admin` no verás **Importaciones** ni podrás ejecutar las RPC de staging.

## 5. Arrancar la app contra local

```powershell
npm run dev
```

Abre `http://127.0.0.1:8080` (coincide con `site_url` en `supabase/config.toml`).

## Comandos útiles

| Comando | Acción |
|--------|--------|
| `npm run supabase:start` | Levanta stack |
| `npm run supabase:stop` | Apaga stack |
| `npm run supabase:status` | URL y claves |
| `npm run supabase:reset` | Borra DB local, migra de nuevo + `seed.sql` |
| `npm run supabase:sync-from-remote` | Reset sin seed + dump datos `public` del remoto enlazado + restore local (ver sección siguiente) |
| `npm run supabase:dump-remote-data` | Solo genera el dump SQL del remoto |
| `npm run supabase:restore-remote-dump` | Solo aplica el último dump contra local |

## Volver a la base en la nube

Quita o renombra `.env.local` y reinicia `npm run dev` para que Vite use de nuevo `VITE_*` del `.env` remoto.

## Datos de la nube en local

Objetivo: misma **forma** de tablas que ya te dan las migraciones, más un volcado de **filas** desde el proyecto enlazado.

### Requisitos previos

1. **Docker** en marcha y stack local levantado: `npm run supabase:start`.
2. Sesión CLI: `npx supabase login`.
3. Enlazar el repo al proyecto remoto (el `ref` sale de la URL del dashboard, `https://supabase.com/dashboard/project/<ref>`):

   ```powershell
   npx supabase link --project-ref <TU_PROJECT_REF>
   ```

   Si pide contraseña de Postgres, es la del proyecto (Settings → Database).

### Opción A — script del repo (recomendado)

Hace, en orden: `db reset --local --no-seed` (solo migraciones, sin `seed.sql`), volcado **solo datos** del remoto enlazado del esquema `public`, y carga en local con `db query`:

```powershell
npm run supabase:sync-from-remote
```

Comandos sueltos:

| Comando | Acción |
|--------|--------|
| `npm run supabase:dump-remote-data` | Solo genera `supabase/.temp/dumps/remote_public_data.sql` (no toca la DB local salvo lo que implique el dump remoto). |
| `npm run supabase:restore-remote-dump` | Solo ejecuta ese SQL contra local (útil si ya tienes el archivo). |
| `node scripts/sync-remote-data.mjs --no-reset` | Dump + restore **sin** `db reset` antes (riesgo de duplicados si ya había datos). |
| `node scripts/sync-remote-data.mjs --schema=public,storage` | Incluye varios esquemas (lista separada por comas, como en el CLI). |

Los dumps van a `supabase/.temp/dumps/` (ignorados por git: pueden llevar **datos personales**; no los subas).

### Opción B — comandos manuales (equivalente)

```powershell
npx supabase db reset --local --yes --no-seed
npx supabase db dump --linked --data-only --schema=public -f supabase/.temp/dumps/remote_public_data.sql
npx supabase db query --local --yes -f supabase/.temp/dumps/remote_public_data.sql
```

### Limitaciones importantes

- Por defecto se vuelca el esquema **`public`** (tablas de la app). **`auth.users`**, **Storage** u otros esquemas no se incluyen salvo que los añadas con `--schema=...` y el dump lo permita; copiar auth completo a local suele ser delicado (JWT, URLs, triggers). Para probar login local suele bastar con crear un usuario en Studio y `seed_local_admin.sql`.
- El remoto debe tener **las mismas migraciones** (o al menos tablas compatibles) que tu carpeta `supabase/migrations/`; si en la nube falta una migración, el `db dump` puede generar datos para tablas que en local no existen hasta que alinees migraciones.
- Si el restore falla por FKs, orden o políticas, revisa el SQL generado o reduce el conjunto de tablas (`-x` / `--exclude` en `db dump`, ver `npx supabase db dump --help`).
