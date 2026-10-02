import { useEffect, useRef, useState } from 'react';
import { speechForState, speechClips } from './speech.mjs';
import { createSpeechPlayer } from './speech-player.mjs';
import manifest from './speech-manifest.json';

export function useDemoSpeech(state, enabled) {
  const queue = speechForState(state);
  const available = queue.length > 0 && queue.every(id => manifest.clips[id]?.text === speechClips[id]);
  const contentKey = available ? queue.join('|') : '';
  const player = useRef(null);
  const [playback, setPlayback] = useState({ status: 'idle', index: 0, total: 0 });
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    const controller = createSpeechPlayer(audio,
      id => `${import.meta.env.BASE_URL}media/speech/${manifest.clips[id].file}`,
      setPlayback);
    player.current = controller;
    return () => {
      controller.stop();
      audio.removeAttribute('src');
      audio.load();
      player.current = null;
    };
  }, []);
  useEffect(() => {
    if (enabled && contentKey) player.current?.play(contentKey.split('|'));
    else player.current?.stop();
    return () => player.current?.stop();
  }, [contentKey, enabled]);
  return { ...playback, available,
    replay: () => { if (available) player.current?.play(queue); },
    stop: () => player.current?.stop(),
  };
}
