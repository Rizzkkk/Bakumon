import { Router } from 'express';
import { limiter } from '../middleware/rateLimit.js';
import { getHealth } from '../controllers/health.controller.js';

export const healthRoutes = Router();

healthRoutes.get('/', limiter('health', 60), getHealth);
