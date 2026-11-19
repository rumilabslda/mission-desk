import fs from 'node:fs';
import { nativeImage } from 'electron';
import { fitWithin } from './sources';

const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Reads an image the user picked and returns it as a PNG data URL (at most 96px), or null. */
export function loadCustomImage(filePath: string): string | null {
  try {
    if (fs.statSync(filePath).size > MAX_FILE_BYTES) return null;
    const image = nativeImage.createFromPath(filePath);
    if (image.isEmpty()) return null;
    return image.resize({ ...fitWithin(image.getSize(), 96), quality: 'best' }).toDataURL();
  } catch {
    return null;
  }
}
