-- Artwork stops coming from one source. The Cobblemon wiki has renders for 66 of the 904
-- species (measured 2026-09-24, ADR 0012); PokeAPI covers all 904. The site now prefers a
-- wiki render where one exists and falls back to PokeAPI, so a row can no longer be read
-- as "PokeAPI, official artwork" by convention.
--
-- Two consequences the schema has to carry rather than the miner remembering them:
--
-- image_source decides the attribution. Wiki images are CC BY 4.0 and must be credited;
-- PokeAPI images are not under that licence. A footer that credits both for everything is
-- wrong in one direction or the other, so the credit has to be per image.
--
-- image_variant is the honest part. The wiki stores almost no plain portraits - exactly
-- one, Bulbasaur - so 65 of the 66 are a regional form or a costume: Hisuian Cyndaquil,
-- Alolan Cubone, a Dragonite wearing a messenger bag. The page has to be able to say which
-- variant it is showing, or it silently asserts that this is what the species looks like.
ALTER TABLE pokemon ADD COLUMN IF NOT EXISTS image_source  TEXT;
ALTER TABLE pokemon ADD COLUMN IF NOT EXISTS image_variant TEXT;

-- Only the two the miner can produce. A future third source is a new migration, not a
-- silently widened column.
ALTER TABLE pokemon DROP CONSTRAINT IF EXISTS pokemon_image_source_check;
ALTER TABLE pokemon ADD CONSTRAINT pokemon_image_source_check
  CHECK (image_source IS NULL OR image_source IN ('wiki', 'pokeapi'));

-- A variant without a source is meaningless, and only a wiki render ever has one.
ALTER TABLE pokemon DROP CONSTRAINT IF EXISTS pokemon_image_variant_requires_wiki;
ALTER TABLE pokemon ADD CONSTRAINT pokemon_image_variant_requires_wiki
  CHECK (image_variant IS NULL OR image_source = 'wiki');

-- 0002 revoked table-wide SELECT and re-granted per table. A new column on an already
-- granted table inherits the table grant, but being explicit costs nothing and the next
-- person adding a column to a restricted table should see this line and copy it.
GRANT SELECT (image_source, image_variant) ON pokemon TO bakumon_api;
