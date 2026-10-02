import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { speechClips } from '../src/speech.mjs';

const key = process.env.OPENAI_API_KEY?.trim();
if (!key) throw new Error('Set OPENAI_API_KEY in the generation environment.');
const directory = new URL('../public/media/speech/', import.meta.url);
const manifestPath = new URL('../src/speech-manifest.json', import.meta.url);
const settings = {
  model: 'gpt-4o-mini-tts', voice: 'coral', speed: 1.2,
  response_format: 'mp3',
  instructions: 'Speak in natural, clear conversational English with short pauses. Sound engaged and curious. Avoid drawn-out or theatrical delivery. Read only the supplied text.',
};
let previous = {};
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); } catch {}
const manifest = { provider: 'OpenAI', ...settings, clips: { ...previous.clips } };
await mkdir(directory, { recursive: true });
for (const [id, input] of Object.entries(speechClips)) {
  const payload = { ...settings, input };
  const signature = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const file = `${id}.mp3`;
  const destination = new URL(file, directory);
  if (previous.clips?.[id]?.signature === signature && (await stat(destination).catch(() => null))?.size > 1024) {
    console.log(`Using prepared audio: ${id}`);
    continue;
  }
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) {
    // Do not print credentials, headers or provider response bodies.
    throw new Error(`OpenAI speech request failed for ${id}: HTTP ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024 || response.headers.get('content-type')?.includes('json')) {
    throw new Error(`OpenAI did not return a usable audio file for ${id}.`);
  }
  await writeFile(destination, bytes);
  manifest.clips[id] = { file, text: input, signature, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'), generatedAt: new Date().toISOString() };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Prepared ${id}: ${bytes.length} bytes`);
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Ready: ${Object.keys(manifest.clips).length} clips in ${fileURLToPath(directory)}`);
