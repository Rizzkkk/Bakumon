import { listItems, findItemById } from '../queries/items.queries.js';
import { assertKnownParams, readSearch, readEnum, readString, readPaging } from '../lib/validate.js';
import { ITEM_CATEGORIES } from '../constants.js';
import { ApiError } from '../lib/errors.js';
import { cacheable } from '../lib/cache.js';

export async function getItemList(req, res) {
  assertKnownParams(req.query, ['search', 'category', 'sourceCategory', 'page', 'pageSize']);

  const search = readSearch(req.query);
  const category = readEnum(req.query, 'category', ITEM_CATEGORIES, 'category');
  // Not validated against a list. The 13 source categories are derived from the workbook
  // and no endpoint publishes them, so rejecting an unknown one would punish the client
  // for a gap on our side. An unknown value simply matches nothing.
  const sourceCategory = readString(req.query, 'sourceCategory');
  const { page, pageSize, limit, offset } = readPaging(req.query);

  const { data, total } = await listItems({ search, category, sourceCategory, limit, offset });
  cacheable(res);
  res.json({ data, page, pageSize, total });
}

export async function getItemById(req, res) {
  assertKnownParams(req.query, []);
  const item = await findItemById(req.params.itemId);
  if (!item) throw new ApiError(404, 'Item not found');
  cacheable(res);
  res.json(item);
}
