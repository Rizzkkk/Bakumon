-- 0001 initial schema
--
-- Supersedes the schema in ground-truth/00-project/architecture.md section 2. The
-- differences are all driven by ground-truth/reports/workbook-audit.md:
--   * pokemon is keyed on species (904), not on the spawn selector (1107)
--   * spawn selectors carry form aspects, which the original schema discarded entirely
--   * buckets are five values, not three; contexts are six, not two
--   * items.used_in_evolutions was a boolean; the column holds a count
--   * item category is two axes - four canonical buckets plus a thirteen-value source

CREATE TABLE pokemon (
  id              SERIAL PRIMARY KEY,
  species_slug    TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  national_dex_id INTEGER,
  image_url       TEXT,
  thumb_url       TEXT,
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pokemon_spawns (
  id            SERIAL PRIMARY KEY,
  pokemon_id    INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
  selector      TEXT NOT NULL,
  aspects       JSONB NOT NULL DEFAULT '{}'::jsonb,
  form_label    TEXT,
  bucket        TEXT,
  weight        NUMERIC,
  level_min     INTEGER,
  level_max     INTEGER,
  context       TEXT,
  biomes        TEXT[] NOT NULL DEFAULT '{}',
  conditions    TEXT,
  raw_row_index INTEGER NOT NULL,
  parse_flag    TEXT
);

CREATE TABLE items (
  id                  SERIAL PRIMARY KEY,
  item_id             TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  category            TEXT NOT NULL
                        CHECK (category IN ('consumable', 'held', 'evolution', 'other')),
  source_category     TEXT,
  wiki_category       TEXT,
  description         TEXT,
  -- Scraped from the Cobblemon wiki. Deliberately separate: the workbook stays
  -- authoritative and a re-run of the miner must never clobber it.
  wiki_description    TEXT,
  evolution_use_count INTEGER,
  evolution_uses      TEXT,
  image_url           TEXT,
  search_vector       TSVECTOR,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Populated from the spawn data so the biome filter can offer a closed list. Most
-- spawns reference a tag rather than a concrete biome, so a free-text biome filter
-- would miss most of the dex.
CREATE TABLE biome_tokens (
  token       TEXT PRIMARY KEY,
  namespace   TEXT NOT NULL,
  is_tag      BOOLEAN NOT NULL,
  spawn_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX pokemon_search_idx        ON pokemon USING GIN (search_vector);
CREATE INDEX items_search_idx          ON items USING GIN (search_vector);
CREATE INDEX pokemon_spawns_pokemon_idx ON pokemon_spawns (pokemon_id);
CREATE INDEX pokemon_spawns_bucket_idx ON pokemon_spawns (bucket);
-- Array containment, not equality: the biome filter asks "which spawns list this token".
CREATE INDEX pokemon_spawns_biomes_idx ON pokemon_spawns USING GIN (biomes);
CREATE INDEX items_category_idx        ON items (category);
CREATE INDEX items_source_category_idx ON items (source_category);

CREATE FUNCTION pokemon_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector := to_tsvector('english',
    coalesce(new.display_name, '') || ' ' || coalesce(new.species_slug, ''));
  new.updated_at := now();
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER pokemon_search_update BEFORE INSERT OR UPDATE ON pokemon
  FOR EACH ROW EXECUTE FUNCTION pokemon_search_trigger();

CREATE FUNCTION items_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector := to_tsvector('english',
    coalesce(new.name, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(new.wiki_description, ''));
  new.updated_at := now();
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_search_update BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION items_search_trigger();
