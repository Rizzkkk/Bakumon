import { Router } from 'express';
import { limiter } from '../middleware/rateLimit.js';
import { getPokemonList, getPokemonBySlug } from '../controllers/pokemon.controller.js';

export const pokemonRoutes = Router();

// A 300ms-debounced search box emits roughly 3 req/s while typing, so 120 covers about
// two minutes of continuous typing plus filter clicks.
pokemonRoutes.get('/', limiter('search', 120), getPokemonList);

// Navigation rather than typing - one request per click.
pokemonRoutes.get('/:slug', limiter('detail', 60), getPokemonBySlug);
