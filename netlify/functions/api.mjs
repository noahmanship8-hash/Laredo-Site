// Netlify entry point. All /api/* requests land here. The logic itself is in core.mjs.
import { getStore } from '@netlify/blobs';
import { createApi } from './core.mjs';

export const config = { path: ['/api', '/api/*'] };

const handle = createApi({
  store: getStore({ name: 'laredo', consistency: 'strong' }),
  env: process.env
});

export default async (req) => handle(req);
