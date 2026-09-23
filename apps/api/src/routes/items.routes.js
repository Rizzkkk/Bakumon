import { Router } from 'express';
import { limiter } from '../middleware/rateLimit.js';
import { getItemList, getItemById } from '../controllers/items.controller.js';

export const itemRoutes = Router();

itemRoutes.get('/', limiter('search', 120), getItemList);

// itemId carries a colon (cobblemon:ability_capsule). Express decodes the segment, so
// both the raw and the percent-encoded form arrive here identically - nothing downstream
// may split on ':'.
itemRoutes.get('/:itemId', limiter('detail', 60), getItemById);
