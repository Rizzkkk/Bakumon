-- The API is read-only by design - every statement in apps/api/src/queries/ is a SELECT -
-- but nothing enforced it. Connecting as the schema-owning role made "no writes" a
-- convention held up by nobody having typed INSERT. This makes it a constraint.

-- Guarded because a role is cluster-wide while schema_migrations is per-database. A second
-- database in the same cluster replays this file and a bare CREATE ROLE aborts the whole
-- migration on a role that already exists.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bakumon_api') THEN
    -- No password here. This file is committed and checksummed; the password is set once
    -- per environment by the runbook, out of band.
    CREATE ROLE bakumon_api LOGIN;
  END IF;
END
$$;

-- GRANT will not take an expression for the database name, and the name differs between
-- environments, so this is the one statement that has to be built as text.
DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO bakumon_api', current_database());
END
$$;

GRANT USAGE ON SCHEMA public TO bakumon_api;

-- Named explicitly rather than ALL TABLES: schema_migrations is the deploy ledger and the
-- API has no business reading it.
GRANT SELECT ON pokemon, pokemon_spawns, items, biome_tokens TO bakumon_api;

-- So a later migration's new table is not invisible to the API. It does not cover a new
-- table created by a different role, and it does not cover columns on a table whose grants
-- were revoked - migrations.md rule 4, which now cuts both ways: anything added from here
-- on must reach this role or the API reports a clean migration and then cannot read it.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO bakumon_api;
