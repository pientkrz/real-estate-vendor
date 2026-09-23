import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { getOfferRuntimeConfig } from '../../server/offerState.js';
import { getLogger } from '../../server/logger.js';

const MIME_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export const prerender = false;
const logger = getLogger('astro');

/** Serve only images that the ingestion worker previously extracted. */
export const GET: APIRoute = async ({ params }) => {
  const requestedPath = String(params.path ?? '');
  const segments = requestedPath.split('/').filter(Boolean);
  if (segments.length < 3 || segments.some((segment) => segment === '.' || segment === '..')) {
    return new Response('Not found', { status: 404 });
  }

  const extension = path.extname(segments.at(-1) || '').toLowerCase();
  const contentType = MIME_TYPES[extension];
  if (!contentType) return new Response('Not found', { status: 404 });

  const root = path.resolve(getOfferRuntimeConfig(process.env).photoRoot);
  const candidate = path.resolve(root, ...segments);
  if (!candidate.startsWith(`${root}${path.sep}`)) return new Response('Not found', { status: 404 });

  try {
    const image = await fs.readFile(candidate);
    const isCurrentAsset = segments.includes('current')
      && /^\w{32,64}(?:-\d+)?\.(?:avif|gif|jpe?g|png|webp)$/i.test(segments.at(-1) || '');
    return new Response(image, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': isCurrentAsset
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      logger.error('offer_photo_read_failed', { component: 'photos', extension, error });
    }
    return new Response('Not found', { status: 404 });
  }
};
