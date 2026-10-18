/**
 * Reference images for Pigmento cards. The picture is decoded in the browser,
 * scaled so its longest side is at most 1024px and re-encoded as JPEG, which
 * keeps the request small (the model reads layout and copy, not pixels).
 */

export type ReferenceMode = 'recreate' | 'inspire';

export interface CardReference {
  /** Base64 without the data: prefix. */
  data: string;
  mimeType: 'image/jpeg';
  mode: ReferenceMode;
  /** data: URL for the chat thumbnail. */
  previewUrl: string;
}

const MAX_SIDE = 1024;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

export const isReferenceImage = (file: File) => /^image\/(png|jpe?g|webp|gif|avif|heic|heif)$/i.test(file.type);

export async function prepareReferenceImage(file: File, mode: ReferenceMode = 'inspire'): Promise<CardReference> {
  if (!isReferenceImage(file)) throw new Error('Use a PNG, JPG or WebP image.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('That image is over 15 MB.');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('That image could not be opened.'));
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('That image could not be read.');
    ctx.fillStyle = '#ffffff'; // flatten transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
    return { data: previewUrl.slice(previewUrl.indexOf(',') + 1), mimeType: 'image/jpeg', mode, previewUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}
