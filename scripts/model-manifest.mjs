#!/usr/bin/env node
// Writes src/main/meetings/model-manifest.json: every file of each transcription model, pinned to
// the repository's current commit, with its size and SHA-256 (LFS files from Hugging Face's own
// record, small files hashed here). Run it when moving to newer models; review the diff.
//   node scripts/model-manifest.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';

/** What each engine needs: Hugging Face repos, the files to take, and where they go in the model folder. */
const SOURCES = {
  whisper: [
    { repo: 'argmaxinc/whisperkit-coreml', from: 'openai_whisper-large-v3-v20240930_turbo/', to: 'model/' },
    { repo: 'openai/whisper-large-v3', files: ['tokenizer.json', 'tokenizer_config.json'], to: 'tokenizer/' },
  ],
  parakeet: [
    {
      repo: 'FluidInference/parakeet-tdt-0.6b-v3-coreml',
      files: [/^Preprocessor\.mlmodelc\//, /^Encoder\.mlmodelc\//, /^Decoder\.mlmodelc\//, /^JointDecisionv3\.mlmodelc\//, /^parakeet_vocab\.json$/],
      to: '',
    },
  ],
};

const api = async (p) => {
  const r = await fetch(`https://huggingface.co/api/${p}`);
  if (!r.ok) throw new Error(`${r.status} ${p}`);
  return r.json();
};

const out = {};
for (const [id, sources] of Object.entries(SOURCES)) {
  const files = [];
  const revisions = [];
  for (const s of sources) {
    const { sha } = await api(`models/${s.repo}`);
    revisions.push(sha.slice(0, 12));
    const tree = await api(`models/${s.repo}/tree/${sha}${s.from ? `/${s.from.replace(/\/$/, '')}` : ''}?recursive=true`);
    for (const e of tree) {
      if (e.type !== 'file') continue;
      const rel = s.from ? e.path.slice(s.from.length) : e.path;
      const wanted = s.files ? s.files.some((f) => (typeof f === 'string' ? f === e.path : f.test(e.path))) : e.path.startsWith(s.from);
      if (!wanted) continue;
      const url = `https://huggingface.co/${s.repo}/resolve/${sha}/${e.path}`;
      let sha256 = e.lfs?.oid;
      let size = e.lfs?.size ?? e.size;
      if (!sha256) {
        const body = Buffer.from(await (await fetch(url)).arrayBuffer());
        sha256 = crypto.createHash('sha256').update(body).digest('hex');
        size = body.length;
      }
      files.push({ url, path: `${s.to}${rel}`, size, sha256 });
    }
  }
  out[id] = { revision: revisions.join('-'), files };
  console.log(id, files.length, 'files', (files.reduce((n, f) => n + f.size, 0) / 1e9).toFixed(2), 'GB');
}
fs.writeFileSync(new URL('../src/main/meetings/model-manifest.json', import.meta.url), `${JSON.stringify(out, null, 1)}\n`);
