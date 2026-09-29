#!/usr/bin/env node
/**
 * Corre las migraciones de db/migrations/*.sql contra Postgres directo, NO
 * contra el CLI de Supabase (`supabase db push`) — ver PRD sección 8 y la
 * nota en db/migrations/0001_init.sql: ese CLI lleva un solo historial de
 * migraciones por proyecto y confundiría las 11 de LandingPilot con
 * "faltantes". Este script lleva su propio registro, en
 * propel.schema_migrations, y solo toca ese schema.
 *
 * Uso:
 *   SUPABASE_DB_URL=postgres://... npm run db:migrate
 */
import { Client } from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MIGRATIONS_DIR = path.join(ROOT, "db/migrations");

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error(
      "Falta SUPABASE_DB_URL. Cópiala de Supabase → Project Settings → Database → Connection string (modo 'Session', puerto 5432, no el pooler de transacción) y ponla en .env.local.",
    );
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("create schema if not exists propel");
    await client.query(`
      create table if not exists propel.schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const { rows } = await client.query<{ version: string }>(
      "select version from propel.schema_migrations",
    );
    const applied = new Set(rows.map((r) => r.version));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  ya aplicada: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`  aplicando: ${file}`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into propel.schema_migrations (version) values ($1)", [file]);
        await client.query("commit");
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    }
    console.log("Migraciones al día.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
