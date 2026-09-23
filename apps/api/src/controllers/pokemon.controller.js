import { listPokemon, findPokemonBySlug } from '../queries/pokemon.queries.js';
import { biomeTokensExist } from '../queries/biomes.queries.js';
import { assertKnownParams, readSearch, readEnumList, readStringList, readPaging, echo } from '../lib/validate.js';
import { SPAWN_BUCKETS, MAX_BUCKET_FILTERS, MAX_BIOME_FILTERS } from '../constants.js';
import { ApiError } from '../lib/errors.js';
import { cacheable } from '../lib/cache.js';

export async function getPokemonList(req, res) {
  assertKnownParams(req.query, ['search', 'bucket', 'biome', 'page', 'pageSize']);

  const search = readSearch(req.query);
  const buckets = readEnumList(req.query, 'bucket', SPAWN_BUCKETS, MAX_BUCKET_FILTERS, 'bucket');
  const biomes = readStringList(req.query, 'biome', MAX_BIOME_FILTERS);
  const { page, pageSize, limit, offset } = readPaging(req.query);

  // GET /api/biomes publishes the closed list, so a token that is not in it is a client
  // bug. An empty grid would look like "no results" and teach the caller nothing. Every
  // member is checked, not just the first requested, so the 400 names the actual offender.
  if (biomes) {
    const existing = await biomeTokensExist(biomes);
    const missing = biomes.find((token) => !existing.has(token));
    if (missing) throw new ApiError(400, `Unknown biome: ${echo(missing)}`);
  }

  const { data, total } = await listPokemon({ search, buckets, biomes, limit, offset });
  cacheable(res);
  res.json({ data, page, pageSize, total });
}

export async function getPokemonBySlug(req, res) {
  assertKnownParams(req.query, []);
  const pokemon = await findPokemonBySlug(req.params.slug);
  if (!pokemon) throw new ApiError(404, 'Pokemon not found');
  cacheable(res);
  res.json(pokemon);
}
