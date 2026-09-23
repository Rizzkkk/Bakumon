import { Router } from 'express';
import { pokemonRoutes } from './pokemon.routes.js';
import { itemRoutes } from './items.routes.js';
import { biomeRoutes } from './biomes.routes.js';
import { healthRoutes } from './health.routes.js';

export const apiRoutes = Router();

apiRoutes.use('/pokemon', pokemonRoutes);
apiRoutes.use('/items', itemRoutes);
apiRoutes.use('/biomes', biomeRoutes);
apiRoutes.use('/health', healthRoutes);
