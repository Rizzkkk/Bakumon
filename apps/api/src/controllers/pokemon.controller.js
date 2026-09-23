import { listPokemon, findPokemonBySlug } from '../queries/pokemon.queries.js';
import { biomeTokenExists } from '../queries/biomes.queries.js';
import { assertKnownParams, readSearch, readEnum, readString, readPaging, echo } from '../lib/validate.js';
import { SPAWN_BUCKETS } from '../constants.js';
import { ApiError } from '../lib/errors.js';
import { cacheable } from '../lib/cache.js';

export async function getPokemonList(req, res) {
  assertKnownParams(req.query, ['search', 'bucket', 'biome', 'page', 'pageSize']);

  const search = readSearch(req.query);
  const bucket = readEnum(req.query, 'bucket', SPAWN_BUCKETS, 'bucket');
  const biome = readString(req.query, 'biome');
  const { page, pageSize, limit, offset } = readPaging(req.query);

  // GET /api/biomes publishes the closed list, so a token that is not in it is a client
  // bug. An empty grid would look like "no results" and teach the caller nothing.
  if (biome && !(await biomeTokenExists(biome))) {
    throw new ApiError(400, `Unknown biome: ${echo(biome)}`);
  }

  const { data, total } = await listPokemon({ search, bucket, biome, limit, offset });
  cacheable(res);
  res.json({ data, page, pageSize, total });
}

export async function getPokemonBySlug(req, res) {
  const pokemon = await findPokemonBySlug(req.params.slug);
  if (!pokemon) throw new ApiError(404, 'Pokemon not found');
  cacheable(res);
  res.json(pokemon);
}
