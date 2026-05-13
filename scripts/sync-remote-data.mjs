/**
 * Sincroniza datos del proyecto Supabase enlazado (--linked) hacia la base local.
 *
 * Uso (desde conexionfit/):
 *   node scripts/sync-remote-data.mjs
 *   node scripts/sync-remote-data.mjs --no-reset
 *   node scripts/sync-remote-data.mjs --dump-only
 *   node scripts/sync-remote-data.mjs --restore-only
 *   node scripts/sync-remote-data.mjs --schema=public,storage
 *
 * Requiere: Docker + supabase start, `supabase login`, `supabase link --project-ref <ref>`.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dumpDir = join(root, "supabase", ".temp", "dumps");
const defaultDump = join(dumpDir, "remote_public_data.sql");

const argv = process.argv.slice(2);
const dumpOnly = argv.includes("--dump-only");
const restoreOnly = argv.includes("--restore-only");
const noReset = argv.includes("--no-reset");

const schemaArg = argv.find((a) => a.startsWith("--schema="));
const schemas = schemaArg ? schemaArg.slice("--schema=".length) : "public";

const fileArg = argv.find((a) => a.startsWith("--file="));
const dumpFile = fileArg ? fileArg.slice("--file=".length) : defaultDump;

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function supabaseArgs(subcommand, ...rest) {
  return ["--yes", "supabase@latest", subcommand, ...rest];
}

function run(label, args) {
  console.error(`\n→ ${label}\n${[npx, ...args].join(" ")}\n`);
  const r = spawnSync(npx, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!restoreOnly) {
  mkdirSync(dumpDir, { recursive: true });
}

if (restoreOnly) {
  if (!existsSync(dumpFile)) {
    console.error(`No existe el archivo de dump: ${dumpFile}`);
    process.exit(1);
  }
  run("Restaurar en Postgres local", [
    ...supabaseArgs("db", "query", "--local", "--yes", "-f", dumpFile),
  ]);
  process.exit(0);
}

if (dumpOnly) {
  run("Volcar solo datos (remoto enlazado)", [
    ...supabaseArgs(
      "db",
      "dump",
      "--linked",
      "--data-only",
      `--schema=${schemas}`,
      "-f",
      dumpFile,
    ),
  ]);
  console.error(`\nListo. Dump en: ${dumpFile}`);
  console.error("Para importar en local: npm run supabase:restore-remote-dump");
  process.exit(0);
}

if (!noReset) {
  run("Recrear esquema local (migraciones, sin seed.sql)", [
    ...supabaseArgs("db", "reset", "--local", "--yes", "--no-seed"),
  ]);
}

run("Volcar datos del remoto enlazado", [
  ...supabaseArgs(
    "db",
    "dump",
    "--linked",
    "--data-only",
    `--schema=${schemas}`,
    "-f",
    dumpFile,
  ),
]);

run("Aplicar dump en la base local", [
  ...supabaseArgs("db", "query", "--local", "--yes", "-f", dumpFile),
]);

console.error(
  "\nHecho. Revisa usuarios/auth: este flujo vuelca los esquemas indicados (--schema); auth suele requerir pasos aparte.",
);
