import { apiGet } from './client.js';

// The only file where an /api path is spelled. Without it the string '/api/items' would
// appear in WikiHome, ItemDetail and useWikiSearch, and the parameter list in two of them.
export const listPokemon = (params, options) => apiGet('/api/pokemon', params, options);

export const listItems = (params, options) => apiGet('/api/items', params, options);

// Item IDs carry a colon (cobblemon:ability_capsule) and a few carry a slash, so the
// segment has to be encoded or it splits the route.
export const getPokemon = (slug, options) =>
  apiGet(`/api/pokemon/${encodeURIComponent(slug)}`, null, options);

export const getItem = (itemId, options) =>
  apiGet(`/api/items/${encodeURIComponent(itemId)}`, null, options);

export const listBiomes = (options) => apiGet('/api/biomes', null, options);
