# ConexionFit

Aplicación web (Vite + React + Supabase) para gestión de gimnasio / asistencia e importaciones.

## Sincronizar con Lovable

Lovable enlaza el proyecto con **GitHub**. Lo que está en `origin/main` es lo que ve Lovable al abrir o actualizar el proyecto.

1. **Traer cambios desde Lovable / GitHub** (por si editaste en la nube):

   ```powershell
   git fetch origin
   git pull origin main
   ```

2. **Enviar tu trabajo local a Lovable** (sube commits a GitHub):

   ```powershell
   git push origin main
   ```

3. Si `git push` devuelve **403** o *Permission denied* para una cuenta que no es la del dueño del repo, Git está usando credenciales equivocadas. En Windows: **Panel de control → Administrador de credenciales → Credenciales de Windows** y edita o elimina la entrada de `git:https://github.com`, luego vuelve a hacer `git push` e inicia sesión con la cuenta que **sí** tenga acceso a `rafaelcastro7/conexionfit` (o usa un [PAT](https://github.com/settings/tokens) con permiso `repo`).

Hasta que el `push` termine bien, Lovable **no** recibirá los commits que solo existen en tu máquina.

## Desarrollo local

- `npm install` — dependencias  
- `npm run dev` — app en http://127.0.0.1:8080  
- Supabase local: ver `Docs/LOCAL_SUPABASE.md` (migraciones, seed, volcado remoto → local).

## Stack

React 18, TypeScript, Tailwind, shadcn-style UI, Supabase, Vite. En desarrollo se usa [lovable-tagger](https://www.npmjs.com/package/lovable-tagger) (plugin de Vite) para el flujo de edición en Lovable.
