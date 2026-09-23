import { Router } from 'express';
import { limiter } from '../middleware/rateLimit.js';
import { getBiomes } from '../controllers/biomes.controller.js';

export const biomeRoutes = Router();

// Fetched once per session and cached client-side.
biomeRoutes.get('/', limiter('reference', 20), getBiomes);
