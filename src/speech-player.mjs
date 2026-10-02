// Play bundled clips in order; obsolete play promises cannot restart a stopped queue.
export function createSpeechPlayer(audio, urlFor, onStatus) {
  let version = 0;
  const stop = () => {
    version++;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.currentTime = 0;
    onStatus({ status: 'idle', index: 0, total: 0 });
  };
  const play = (clips) => {
    stop();
    if (!clips.length) return;
    const current = version;
    let index = 0;
    const report = (status) => {
      if (current === version) onStatus({ status, index: index + 1, total: clips.length });
    };
    const next = () => {
      if (current !== version) return;
      if (index === clips.length) {
        audio.onended = null;
        audio.onerror = null;
        onStatus({ status: 'complete', index, total: clips.length });
        return;
      }
      audio.src = urlFor(clips[index]);
      audio.onended = () => { index++; next(); };
      audio.onerror = () => { audio.onended = null; report('error'); };
      report('loading');
      audio.play().then(() => report('playing')).catch((error) => {
        if (current !== version) return;
        audio.onended = null;
        report(error.name === 'NotAllowedError' ? 'blocked' : 'error');
      });
    };
    next();
  };
  return { play, stop };
}
