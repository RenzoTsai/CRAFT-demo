import { useEffect, useRef, useState } from 'react';
import { editorFrame, EDITOR_DURATION, EDITOR_SAVE_AT, PLOT_SAVE_AT } from './editor-demo.mjs';

export function useEditorDemo(active, state, onAction, graph) {
  const latest = useRef({ state, onAction, graph });
  latest.current = { state, onAction, graph };
  const context = useRef(state);
  const saved = useRef(false);
  const plotSaved = useRef(false);
  const initialPlot = useRef(graph);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!active) return;
    context.current = latest.current.state;
    initialPlot.current = latest.current.graph;
    plotSaved.current = true;
    saved.current = true;
    setElapsed(0);
    setPaused(false);
  }, [active, run]);
  const finished = elapsed >= EDITOR_DURATION;
  useEffect(() => {
    if (!active || paused || finished) return;
    let previous = performance.now();
    const resetClock = () => { previous = performance.now(); };
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      if (!document.hidden) setElapsed(t => Math.min(EDITOR_DURATION, t + delta));
    }, 40);
    document.addEventListener('visibilitychange', resetClock);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', resetClock); };
  }, [active, paused, run, finished]);
  useEffect(() => {
    if (!active) return;
    if (elapsed < EDITOR_SAVE_AT) { saved.current = false; return; }
    if (saved.current) return;
    saved.current = true;
    const frame = editorFrame(elapsed, context.current);
    latest.current.onAction({ type: 'demo-editor-save', generated: frame.generated, feedback: frame.feedback, draft: frame.draft });
  }, [active, elapsed]);
  useEffect(() => {
    if (!active) return;
    if (elapsed < PLOT_SAVE_AT) { plotSaved.current = false; return; }
    if (plotSaved.current) return;
    plotSaved.current = true;
    const frame = editorFrame(elapsed, context.current, initialPlot.current);
    latest.current.onAction({ type: 'demo-plot-save', graph: frame.plotGraph });
  }, [active, elapsed]);
  return { ...editorFrame(elapsed, context.current, initialPlot.current), paused,
    replay: () => setRun(value => value + 1),
    togglePause: () => setPaused(value => !value),
  };
}
