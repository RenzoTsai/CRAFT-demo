import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../src/flow.mjs';
import { speechForState, speechClips } from '../src/speech.mjs';
import { createSpeechPlayer } from '../src/speech-player.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
function fakeAudio(play = () => Promise.resolve()) {
  return { src: '', currentTime: 0, onended: null, onerror: null,
    paused: false, played: [],
    pause() { this.paused = true; },
    play() { this.paused = false; this.played.push(this.src); return play(); },
  };
}

test('suggestions, capture, recording, processing and editing are silent', () => {
  for (const phase of ['none', 'photo', 'voice', 'question', 'submitted', 'starting-role-play', 'role-play-listening', 'role-play-waiting', 'editing', 'plot']) {
    assert.deepEqual(speechForState({ ...initialState(), phase, hasScene: true }), [], phase);
  }
  assert.deepEqual(speechForState({ ...initialState(), phase: 'showing-image', recording: true }), []);
  assert.deepEqual(speechForState({ ...initialState(), phase: 'role-play', pending: 'role-turn' }), []);
});
test('generated content follows the source speech order with optional answer first', () => {
  const state = { ...initialState(), phase: 'showing-image' };
  assert.deepEqual(speechForState(state), ['scene', 'plot', 'characters', 'question']);
  assert.deepEqual(speechForState({ ...state, answered: true }), ['answer', 'updated-scene', 'updated-plot', 'characters', 'updated-question']);
});
test('role-play speaks only the current character turn; moments reflect completed interactions', () => {
  const state = { ...initialState(), phase: 'role-play', hasScene: true };
  assert.deepEqual(speechForState(state), ['role-opening']);
  assert.deepEqual(speechForState({ ...state, roleTurn: 2 }), ['role-reply-1']);
  assert.deepEqual(speechForState({ ...state, phase: 'selection', answered: true, roleTurn: 1 }), ['moments-scene', 'moments-answer', 'moments-role']);
  assert.deepEqual(speechForState({ ...state, phase: 'selection', hasScene: false }), []);
  for (const text of Object.values(speechClips)) assert.ok(text.trim());
});
test('clips play in sequence, and stopping prevents queued clips and late promises', async () => {
  let resolve;
  const audio = fakeAudio(() => new Promise(done => { resolve = done; }));
  const status = [];
  const player = createSpeechPlayer(audio, id => `/speech/${id}.mp3`, value => status.push(value.status));
  player.play(['scene', 'plot']);
  const staleEnded = audio.onended;
  player.stop();
  resolve();
  staleEnded();
  await tick();
  assert.deepEqual(audio.played, ['/speech/scene.mp3']);
  assert.equal(audio.paused, true);
  assert.equal(status.at(-1), 'idle');
});
test('a completed clip advances once, and an exhausted queue finishes', async () => {
  const audio = fakeAudio();
  const states = [];
  const player = createSpeechPlayer(audio, id => id, value => states.push(value));
  player.play(['scene', 'question']);
  await tick();
  audio.onended();
  await tick();
  assert.deepEqual(audio.played, ['scene', 'question']);
  audio.onended();
  assert.equal(states.at(-1).status, 'complete');
  assert.equal(audio.onended, null);
});
test('autoplay rejection stops the queue and permits a direct user-initiated retry', async () => {
  let blocked = true;
  const audio = fakeAudio(() => blocked ? Promise.reject(Object.assign(new Error('autoplay'), { name: 'NotAllowedError' })) : Promise.resolve());
  const states = [];
  const player = createSpeechPlayer(audio, id => id, value => states.push(value));
  player.play(['scene', 'question']);
  await tick();
  assert.equal(states.at(-1).status, 'blocked');
  assert.equal(audio.onended, null);
  assert.deepEqual(audio.played, ['scene']);
  blocked = false;
  player.play(['scene', 'question']);
  await tick();
  assert.equal(states.at(-1).status, 'playing');
});
