import { listBiomes } from '../queries/biomes.queries.js';
import { cacheable } from '../lib/cache.js';

const ONE_HOUR_SECONDS = 3600;

export async function getBiomes(req, res) {
  const data = await listBiomes();
  // An hour rather than the list default: this is a closed vocabulary of 112 tokens that
  // changes with the schema, not with the data.
  cacheable(res, ONE_HOUR_SECONDS);
  res.json({ data });
}
