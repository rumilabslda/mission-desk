import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createModelManager, type Manifest } from '../src/main/meetings/models';

const sha = (b: Uint8Array) => crypto.createHash('sha256').update(b).digest('hex');
const A = new Uint8Array(3000).map((_, i) => i % 251);
const B = new Uint8Array(500).map((_, i) => (i * 7) % 256);

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-models-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function manifest(bHash = sha(B)): Manifest {
  return {
    whisper: {
      revision: 'abc123',
      files: [
        { url: 'https://huggingface.co/x/resolve/abc123/model/weights.bin', path: 'model/weights.bin', size: A.length, sha256: sha(A) },
        { url: 'https://huggingface.co/x/resolve/abc123/config.json', path: 'config.json', size: B.length, sha256: bHash },
      ],
    },
    parakeet: { revision: 'def456', files: [] },
  };
}

function server(opts: { failAfter?: number } = {}) {
  const requests: { url: string; range: string | null }[] = [];
  let served = 0;
  const files: Record<string, Uint8Array> = { 'weights.bin': A, 'config.json': B };
  const fetch = async (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => {
    const range = init?.headers?.Range ?? null;
    requests.push({ url, range });
    const body = files[url.split('/').pop()!];
    const from = range ? Number(/bytes=(\d+)-/.exec(range)![1]) : 0;
    let chunk = body.slice(from);
    if (opts.failAfter !== undefined && served + chunk.length > opts.failAfter) {
      chunk = chunk.slice(0, Math.max(0, opts.failAfter - served));
      served += chunk.length;
      let sent = false;
      const stream = new ReadableStream({
        pull(c) {
          if (!sent) {
            sent = true;
            c.enqueue(chunk);
          } else c.error(new Error('connection lost'));
        },
      });
      return new Response(stream, { status: range ? 206 : 200 });
    }
    served += chunk.length;
    return new Response(chunk, { status: range ? 206 : 200 });
  };
  return { fetch: fetch as unknown as typeof globalThis.fetch, requests };
}

test('a complete download is checked and becomes ready', async () => {
  const { fetch } = server();
  const m = createModelManager({ dir, fetch, manifest: manifest() });
  expect(m.status('whisper')).toMatchObject({ id: 'whisper', state: 'notDownloaded', bytes: 3500 });
  const progress: number[] = [];
  await m.download('whisper', (f) => progress.push(f));
  expect(m.status('whisper').state).toBe('ready');
  expect(progress.at(-1)).toBe(1);
  const where = m.installed('whisper')!;
  expect(fs.readFileSync(path.join(where, 'model/weights.bin'))).toEqual(Buffer.from(A));
  expect(fs.existsSync(`${where}.partial`)).toBe(false);
});

test('a file with the wrong checksum is refused and nothing is kept', async () => {
  const { fetch } = server();
  const m = createModelManager({ dir, fetch, manifest: manifest('0'.repeat(64)) });
  await expect(m.download('whisper', () => {})).rejects.toMatchObject({ code: 'modelInvalid' });
  expect(m.status('whisper').state).toBe('notDownloaded');
  expect(fs.readdirSync(path.join(dir, 'whisper'))).toEqual([]);
});

test('an interrupted download resumes where it stopped', async () => {
  const first = server({ failAfter: 1200 });
  const m = createModelManager({ dir, fetch: first.fetch, manifest: manifest() });
  await expect(m.download('whisper', () => {})).rejects.toThrow();
  const second = server();
  const m2 = createModelManager({ dir, fetch: second.fetch, manifest: manifest() });
  await m2.download('whisper', () => {});
  expect(second.requests[0]).toEqual({ url: expect.stringContaining('weights.bin'), range: 'bytes=1200-' });
  expect(m2.status('whisper').state).toBe('ready');
});

test('cancel stops the download and removes the partial files', async () => {
  const { fetch } = server();
  const m = createModelManager({ dir, fetch, manifest: manifest() });
  const p = m.download('whisper', () => {});
  m.cancel('whisper');
  await expect(p).rejects.toThrow();
  expect(fs.existsSync(path.join(dir, 'whisper', 'abc123.partial'))).toBe(false);
  expect(m.status('whisper').state).toBe('notDownloaded');
});

test('remove frees the space it used', async () => {
  const { fetch } = server();
  const m = createModelManager({ dir, fetch, manifest: manifest() });
  await m.download('whisper', () => {});
  expect(m.remove('whisper')).toBe(3500);
  expect(m.installed('whisper')).toBeNull();
});

test('only https downloads', async () => {
  const { fetch } = server();
  const bad = manifest();
  bad.whisper.files[0].url = 'http://huggingface.co/x/weights.bin';
  const m = createModelManager({ dir, fetch, manifest: bad });
  await expect(m.download('whisper', () => {})).rejects.toMatchObject({ code: 'modelInvalid' });
});
