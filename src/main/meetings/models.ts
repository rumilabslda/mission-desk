import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { EngineStatus } from '../../shared/meeting';

/**
 * Downloads, checks and deletes the transcription models (Whisper, Parakeet). Every file is pinned
 * in a manifest (URL at a fixed revision, size, SHA-256): a model is only "ready" when every file
 * matches. Downloads go to <dir>/<id>/<revision>.partial and resume after an interruption.
 */

export type ModelId = 'whisper' | 'parakeet';
export interface ManifestFile {
  url: string;
  /** Where it goes in the model folder. */
  path: string;
  size: number;
  sha256: string;
}
export type Manifest = Record<ModelId, { revision: string; files: ManifestFile[] }>;

const fail = (code: string, message: string): Error & { code: string } => Object.assign(new Error(message), { code });

export function createModelManager(deps: { dir: string; fetch: typeof globalThis.fetch; manifest: Manifest }) {
  const active = new Map<ModelId, { ac: AbortController; progress: number; done: Promise<void> }>();
  const finalDir = (id: ModelId): string => path.join(deps.dir, id, deps.manifest[id].revision);
  const total = (id: ModelId): number => deps.manifest[id].files.reduce((n, f) => n + f.size, 0);

  async function fetchFile(f: ManifestFile, target: string, ac: AbortController, onBytes: (n: number) => void): Promise<void> {
    let have = fs.existsSync(target) ? fs.statSync(target).size : 0;
    if (have > f.size) {
      fs.rmSync(target, { force: true });
      have = 0;
    }
    const hash = crypto.createHash('sha256');
    if (have > 0) hash.update(fs.readFileSync(target));
    onBytes(have);
    if (have < f.size) {
      const res = await deps.fetch(f.url, { headers: have > 0 ? { Range: `bytes=${have}-` } : {}, signal: ac.signal });
      if (!res.ok || !res.body) throw fail('downloadFailed', `${res.status} for ${f.path}`);
      if (have > 0 && res.status !== 206) {
        // The server sent the whole file: start this one again.
        fs.rmSync(target, { force: true });
        have = 0;
        hash.update(Buffer.alloc(0));
        return fetchFile(f, target, ac, onBytes);
      }
      const fd = fs.openSync(target, have > 0 ? 'a' : 'w');
      try {
        const reader = res.body.getReader();
        for (;;) {
          if (ac.signal.aborted) throw fail('cancelled', 'Cancelled.');
          const { done, value } = await reader.read();
          if (done) break;
          fs.writeSync(fd, value);
          hash.update(value);
          onBytes(value.length);
        }
      } finally {
        fs.closeSync(fd);
      }
    }
    if (fs.statSync(target).size !== f.size || hash.digest('hex') !== f.sha256) throw fail('modelInvalid', `${f.path} doesn't match its checksum.`);
  }

  const manager = {
    /** The model's folder when every file is there and checked; null otherwise. */
    installed: (id: ModelId): string | null => (fs.existsSync(finalDir(id)) ? finalDir(id) : null),
    status(id: ModelId): EngineStatus {
      const a = active.get(id);
      if (manager.installed(id)) return { id, state: 'ready', bytes: total(id) };
      if (a) return { id, state: 'downloading', progress: a.progress, bytes: total(id) };
      return { id, state: 'notDownloaded', bytes: total(id) };
    },
    download(id: ModelId, onProgress: (fraction: number) => void): Promise<void> {
      if (manager.installed(id)) return Promise.resolve();
      const running = active.get(id);
      if (running) return running.done;
      const ac = new AbortController();
      const partial = `${finalDir(id)}.partial`;
      const entry = { ac, progress: 0, done: Promise.resolve() };
      entry.done = (async () => {
        try {
          const files = deps.manifest[id].files;
          if (files.some((f) => !/^https:\/\//.test(f.url))) throw fail('modelInvalid', 'Models are only downloaded over https.');
          fs.mkdirSync(partial, { recursive: true });
          const sum = total(id) || 1;
          let done = 0;
          for (const f of files) {
            const target = path.resolve(partial, f.path);
            if (!target.startsWith(path.resolve(partial) + path.sep)) throw fail('modelInvalid', `Bad path ${f.path}`);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            await fetchFile(f, target, ac, (n) => {
              done += n;
              entry.progress = Math.min(1, done / sum);
              onProgress(entry.progress);
            });
          }
          fs.renameSync(partial, finalDir(id));
          entry.progress = 1;
          onProgress(1);
        } catch (e) {
          // A bad file or a cancel leaves nothing behind; a dropped connection keeps what came, to resume.
          const code = (e as { code?: string }).code;
          if (ac.signal.aborted || code === 'modelInvalid' || code === 'cancelled') fs.rmSync(partial, { recursive: true, force: true });
          throw ac.signal.aborted && code !== 'modelInvalid' ? fail('cancelled', 'Cancelled.') : e;
        } finally {
          active.delete(id);
        }
      })();
      active.set(id, entry);
      return entry.done;
    },
    cancel(id: ModelId): void {
      active.get(id)?.ac.abort();
    },
    /** Deletes the model; returns the bytes freed. */
    remove(id: ModelId): number {
      const bytes = manager.installed(id) ? total(id) : 0;
      manager.cancel(id);
      fs.rmSync(path.join(deps.dir, id), { recursive: true, force: true });
      return bytes;
    },
  };
  return manager;
}
export type ModelManager = ReturnType<typeof createModelManager>;
