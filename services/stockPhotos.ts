/**
 * Stock photos from Pexels (server side).
 *
 * The playground cards and Pigmento cards ask for a photo by a short query
 * ("salmon poke bowl"); this resolves it against the Pexels search API and
 * caches the answer, so the key never reaches the browser and popular queries
 * cost one API call per instance. Without PEXELS_API_KEY everything returns
 * null and the cards keep their palette gradient.
 */

export type PhotoOrientation = 'landscape' | 'portrait' | 'square';

export interface StockPhoto {
  src: string;      // ~940px wide, for heroes and posts
  small: string;    // ~130px tall, for thumbnails
  alt: string;
  credit: string;   // photographer name
  link: string;     // photo page on Pexels
}

const CACHE_LIMIT = 500;
const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; photo: StockPhoto | null }>();

const clean = (query: string) => query.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

const apiKey = () => {
  let key = (process.env.PEXELS_API_KEY || '').trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) key = key.slice(1, -1);
  return key;
};

export const stockPhotosEnabled = () => apiKey().length > 10;

export async function findStockPhoto(rawQuery: string, orientation: PhotoOrientation = 'landscape'): Promise<StockPhoto | null> {
  const query = clean(rawQuery);
  const key = apiKey();
  if (!query || !key) return null;

  const cacheKey = `${orientation}:${query}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.photo;

  let photo: StockPhoto | null = null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=1&size=medium`;
    const response = await fetch(url, { headers: { Authorization: key }, signal: AbortSignal.timeout(6000) });
    if (response.ok) {
      const data: any = await response.json();
      const p = data?.photos?.[0];
      if (p?.src?.large && typeof p.src.large === 'string' && p.src.large.startsWith('https://images.pexels.com/')) {
        photo = {
          src: p.src.large,
          small: p.src.small || p.src.large,
          alt: (typeof p.alt === 'string' && p.alt.trim()) || query,
          credit: typeof p.photographer === 'string' ? p.photographer : 'Pexels',
          link: typeof p.url === 'string' ? p.url : 'https://www.pexels.com',
        };
      }
    } else {
      console.warn(`[Pexels] ${response.status} for "${query}"`);
      // Don't cache rate limits or outages for a whole day.
      if (response.status === 429 || response.status >= 500) return null;
    }
  } catch (error: any) {
    console.warn('[Pexels] lookup failed:', error?.message || error);
    return null;
  }

  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  cache.set(cacheKey, { at: Date.now(), photo });
  return photo;
}

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Pigmento writes photo slots as <div class="photo" data-photo="query" …></div>.
 * Swap each one (up to `max`) for a real <img> from Pexels, keeping the slot's
 * inline style (aspect ratio, size) and aria-label as alt text. Slots that
 * can't be resolved stay as palette-gradient placeholders.
 */
export async function fillPhotoSlots(html: string, max = 3): Promise<string> {
  const slot = /<div\b([^>]*?)\bdata-photo=(["'])([^"']{2,80})\2([^>]*)>\s*<\/div>/gi;
  const slots = [...html.matchAll(slot)].slice(0, max);
  if (!slots.length || !stockPhotosEnabled()) return html;

  const photos = await Promise.all(slots.map(m => {
    const attrs = `${m[1]} ${m[4]}`;
    const orientation: PhotoOrientation = /data-orientation=["']portrait/i.test(attrs) ? 'portrait' : /data-orientation=["']square/i.test(attrs) ? 'square' : 'landscape';
    return findStockPhoto(m[3], orientation);
  }));

  let out = html;
  slots.forEach((m, i) => {
    const photo = photos[i];
    if (!photo) return;
    const attrs = `${m[1]} ${m[4]}`;
    const style = attrs.match(/\bstyle=(["'])([^"']*)\1/i)?.[2] ?? '';
    const label = attrs.match(/\baria-label=(["'])([^"']*)\1/i)?.[2] || photo.alt;
    const thumb = /(?:width|height)\s*:\s*(\d+)px/i.exec(style);
    const src = thumb && Number(thumb[1]) <= 120 ? photo.small : photo.src;
    const img = `<img class="photo" src="${escapeAttr(src)}" alt="${escapeAttr(label)}" title="Photo: ${escapeAttr(photo.credit)} / Pexels" loading="lazy" referrerpolicy="no-referrer"${style ? ` style="${escapeAttr(style)}"` : ''}>`;
    out = out.replace(m[0], img);
  });
  return out;
}
