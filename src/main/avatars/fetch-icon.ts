import { nativeImage, type Session } from 'electron';
import { fitWithin, isDefaultWorkspaceLogo } from './sources';

const MAX_BYTES = 1024 * 1024;
const MIN_SIZE = 48; // smaller is a placeholder (e.g. the generic globe favicon)
const OUT_SIZE = 96;

/** Downloads the first usable candidate and returns it as a PNG data URL, at most 96px. */
export async function fetchIcon(candidates: string[], ses: Session): Promise<string | null> {
  for (const url of candidates) {
    try {
      const res = await ses.fetch(url, { redirect: 'follow', credentials: 'include' }); // Workspace images need the account's cookies
      if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0 || buf.length > MAX_BYTES) continue;
      const image = nativeImage.createFromBuffer(buf); // raster formats only; SVG is rejected
      const { width, height } = image.getSize();
      if (image.isEmpty() || Math.min(width, height) < MIN_SIZE) continue;
      if (isDefaultWorkspaceLogo(url, { width, height })) continue; // no company logo: try the next source
      return image.resize({ ...fitWithin({ width, height }, OUT_SIZE), quality: 'best' }).toDataURL();
    } catch {
      // try the next candidate
    }
  }
  return null;
}
