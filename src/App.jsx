import { useEffect, useReducer, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Check,
  Info,
  Monitor,
  Home,
} from "lucide-react";
import WearerView from "./WearerView.jsx";
import RingMouse from "./RingMouse.jsx";
import { SimilarityContext, AuthenticityContext, DesignGoals } from "./ResearchContext.jsx";
import { useEditorDemo } from "./useEditorDemo.jsx";
import { initialGraph } from "./plot-graph.mjs";
import {
  initialState,
  reduce,
  isBusy,
  isDesktop,
  recordingLine,
  nextMove,
  exportContext,
} from "./flow.mjs";
import { story } from "./story.mjs";
import { useDemoSpeech } from "./useDemoSpeech.jsx";
const asset = (name) => `${import.meta.env.BASE_URL}media/${name}`;
const arrows = { ArrowDown, ArrowRight, ArrowUp, ArrowLeft };
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function ExperienceJourney({ activeStep = null, compact = false }) {
  return (
        <section className={compact ? "intro-journey journey-progress" : "intro-journey wrap"} aria-label="The CRAFT experience">
            <h2 className="section-heading">The CRAFT experience</h2>
            <ol aria-label="From everyday inspiration to fiction writing">
              {[
                { title: 'Find inspiration', detail: 'AI suggests connections between your surroundings and your story.' },
                { title: 'Capture a moment', detail: 'Take a photo and voice your idea, right where it happens.' },
                { title: 'Turn reality into fiction', detail: 'Shape everyday details into scenes, characters, and plots.' },
                { title: 'Step into a character', detail: 'Explore dialogue through role-play with an AI character.' },
                { title: 'Develop the full draft', detail: 'Organize plot points, generate a draft, and revise it on desktop.' },
              ].map((step, index) => <li key={step.title} className={activeStep === index ? 'is-current' : undefined} aria-current={activeStep === index ? 'step' : undefined}>
                <span className="journey-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div><h3>{step.title}</h3>{!compact && <p>{step.detail}</p>}</div>
              </li>)}
            </ol>
        </section>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reduce, undefined, initialState);
  const [photo, setPhoto] = useState(asset("world-camera.jpg"));
  const [suggestion, setSuggestion] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [started, setStarted] = useState(false);
  const [pressedKey, setPressedKey] = useState(null);
  const pressTimer = useRef(null);
  useEffect(() => () => clearTimeout(pressTimer.current), []);
  const [message, setMessage] = useState("");
  const [graph, setGraph] = useState(initialGraph);
  const video = useRef(null),
    experience = useRef(null);
  const speech = useDemoSpeech(state, started && voiceEnabled);
  const next = nextMove(state),
    NextIcon = arrows[next.key],
    busy = isBusy(state);
  const desktop = isDesktop(state);
  const activeStep = desktop ? 4
    : state.phase.includes('role-play') ? 3
    : ['photo', 'voice'].includes(state.phase) ? 1
    : state.phase === 'submitted' || ['showing-image', 'question'].includes(state.phase) ? 2
    : state.hasScene ? (state.roleTurn ? 3 : 2) : 0;
  useEffect(() => {
    if (!state.recording) return;
    const words = recordingLine(state).split(" ");
    let count = 0;
    const timer = setInterval(() => {
      count++;
      dispatch({ type: "transcript", text: words.slice(0, count).join(" ") });
      if (count >= words.length) clearInterval(timer);
    }, 170);
    return () => clearInterval(timer);
  }, [state.phase, state.recording]);
  useEffect(() => {
    if (!state.pending) return;
    const timer = setTimeout(() => dispatch({ type: "complete" }), 1000);
    return () => clearTimeout(timer);
  }, [state.pending]);
  useEffect(() => {
    setSuggestion(state.phase === "none" && !state.hasScene);
    setMessage("");
  }, [state.phase, state.hasScene]);
  useEffect(() => {
    if (started && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      video.current?.play().catch(() => {});
    if (started) {
      experience.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
      experience.current?.focus({ preventScroll: true });
    }
  }, [started]);
  const capture = () => {
    if (video.current?.readyState >= 2) {
      const c = document.createElement("canvas");
      c.width = 1280;
      c.height = 720;
      const ctx = c.getContext("2d");
      ctx.drawImage(video.current, 0, 0, 1280, 720);
      setPhoto(c.toDataURL("image/jpeg", 0.86));
    }
  };
  const direction = (key) => {
    if (arrows[key]) {
      clearTimeout(pressTimer.current);
      setPressedKey(key);
      pressTimer.current = setTimeout(() => setPressedKey(null), 380);
    }
    if (key === "ArrowUp" && state.phase === "selection") {
      setVoiceEnabled((v) => !v);
      return;
    }
    if (key === "ArrowDown" && state.phase === "none") capture();
    dispatch({ type: "direction", key });
  };
  const act = (action) => {
    if (action.type === 'demo-plot-save') {
      setGraph(action.graph);
      try { localStorage.setItem('craft-demo-plot-v1', JSON.stringify(action.graph)); } catch { /* Session state remains available. */ }
      return;
    }
    const saving = action.type === 'demo-editor-save' || (action.type === 'save' && state.draft.trim());
    if (saving) {
      try {
        localStorage.setItem(
          "craft-demo-draft-v2",
          JSON.stringify({
            ...exportContext(reduce(state, action)),
            graph,
          }),
        );
        setMessage("Your story and context are saved in this browser.");
      } catch {
        setMessage(
          "Browser storage is unavailable. Download the story to keep it.",
        );
      }
    }
    dispatch(action);
  };
  const editorDemo = useEditorDemo(started && desktop, state, act, graph);
  useEffect(() => {
    const handler = (e) => {
      if (!started) return;
      if (desktop) return;
      if (
        e.target instanceof Element &&
        e.target.closest(
          'textarea,input,select,[contenteditable="true"],.react-flow',
        )
      )
        return;
      if (
        !["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Escape"].includes(
          e.key,
        )
      )
        return;
      const rect = experience.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return;
      e.preventDefault();
      if (e.repeat) return;
      direction(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  const proceed = () => {
    if (next.key) direction(next.key);
    else if (next.action) act({ type: next.action });
    experience.current?.scrollIntoView({ block: "start", behavior: "auto" });
  };
  const openExperience = () => {
    if (!started) { setStarted(true); return; }
    experience.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    experience.current?.focus({ preventScroll: true });
  };
  const reset = () => {
    speech.stop();
    dispatch({ type: "reset" });
    setPhoto(asset("world-camera.jpg"));
    setGraph(initialGraph());
    setMessage("");
    clearTimeout(pressTimer.current);
    setPressedKey(null);
    if (video.current) video.current.currentTime = 0;
  };
  const toggleVideo = () => {
    if (!video.current) return;
    if (video.current.paused)
      video.current
        .play()
        .catch(() =>
          setMessage(
            "Video playback is unavailable. The still frame can be used for this demo.",
          ),
        );
    else video.current.pause();
  };
  return (
    <>
      <a className="skip-link" href="#experience" onClick={() => setStarted(true)}>
        Skip to demo
      </a>
      <header className="site-header wrap">
        <a className="wordmark" href="#">
          CRAFT<span>.</span>
        </a>
        <nav>
          <a
            href="https://dl.acm.org/doi/10.1145/3831952"
            target="_blank"
            rel="noreferrer"
          >
            Paper
          </a>
          <a
            href="https://github.com/RenzoTsai/CRAFT"
            target="_blank"
            rel="noreferrer"
          >
            Code
          </a>
        </nav>
      </header>
      <main>
        <section className="intro intro-welcome" aria-labelledby="intro-title">
          <div className="wrap">
            <div className="intro-copy">
              <p className="eyebrow">WEARABLE CREATIVE AI · IMWUT / UBICOMP 2026</p>
              <h1 id="intro-title" tabIndex={-1}>
                Everyday sights.<br />Unexpected stories<span>.</span>
              </h1>
                <p className="intro-description">CRAFT explores how AI on smart glasses can help writers turn real-world moments into fiction—through photos, spoken ideas, and conversations with imagined characters.</p>
                <div className="intro-action-row">
                <div className="writing-premise"><span>Writer’s plan</span><p>{story.premise}</p></div>
                <button className="primary-button intro-start" onClick={openExperience} aria-controls="experience" aria-expanded={started}>
                  {started || state.hasScene ? 'Continue the experience' : 'Try the demo'} <ArrowDown size={18} aria-hidden="true" />
                </button>
                </div>
            </div>
            <figure className="intro-example">
              <div className="intro-image-pair">
                <div>
                  <img src={asset('world-camera.jpg')} alt="An ordinary car park wall seen through the world camera" />
                  <span>THE EVERYDAY</span>
                </div>
                <div>
                  <img src={asset('imagined-shadow.png')} alt="An AI-generated shadow with branches growing from its silhouette on the same wall" />
                  <span>THE IMAGINED</span>
                </div>
                <ArrowRight className="intro-image-arrow" size={28} aria-hidden="true" />
              </div>
              <figcaption>
                <p>{story.seed}</p>
                <span>Everyday moments → elements of fiction: scenes, characters, and plots.</span>
              </figcaption>
            </figure>
          </div>
        </section>
        {started && <section
          id="experience"
          ref={experience}
          tabIndex={-1}
          className="experience wrap"
          aria-label="Interactive CRAFT demo"
        >
          <div className="experience-toolbar">
            <div className="experience-toolbar-start">
              <span className="view-label">
                {desktop ? "DESKTOP VIEW" : "FIRST-PERSON VIEW"} <span>· {desktop ? "BACK HOME, CONTINUE WRITING" : "THE FIRST SIGN OF CHANGE"}</span>
              </span>
              <button onClick={reset} aria-label="Replay demo" title="Replay demo">
                <RotateCcw size={15} /><span>Replay</span>
              </button>
            </div>
            <div>
              {speech.available && (
                <button
                  onClick={() => {
                    if (voiceEnabled && ['blocked', 'error'].includes(speech.status)) speech.replay();
                    else setVoiceEnabled(v => !v);
                  }}
                  aria-pressed={voiceEnabled}
                  title={voiceEnabled ? "Mute AI speech" : "Play AI speech"}
                >
                  {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>{['blocked', 'error'].includes(speech.status) ? 'Play voice' : `Voice ${voiceEnabled ? 'on' : 'off'}`}</span>
                </button>
              )}
            </div>
          </div>
          <div className="demo-frame">
            <div className="next-move" aria-live="polite">
              <div className="next-copy">
                <ExperienceJourney activeStep={activeStep} compact />
                <h2>{state.phase === "editing" ? "From captured moments to a revised draft." : next.title}</h2>
                <p>{state.phase === "editing" ? editorDemo.label : next.description}</p>

              </div>
              <div className="next-controls">
                {!desktop && (next.key || busy) && <RingMouse
                  suggestedKey={next.key}
                  pressedKey={pressedKey}
                  busy={busy}
                  onDirection={direction}
                />}
              {state.phase === 'editing' ? <button className="primary-button" onClick={editorDemo.done ? editorDemo.replay : editorDemo.togglePause}>
                {editorDemo.done ? <RotateCcw size={17} /> : editorDemo.paused ? <Play size={17} /> : <Pause size={17} />}
                {editorDemo.done ? 'Replay editing' : editorDemo.paused ? 'Resume' : 'Pause'}
              </button> : <button
                className="primary-button"
                disabled={busy}
                onClick={proceed}
              >
                {NextIcon && <NextIcon size={20} />} {next.label}
                {!NextIcon && !busy && (next.action === "edit" && !desktop ? <Home size={17} aria-hidden="true" /> : <ArrowRight size={17} />)}
              </button>}
              </div>
            </div>
            {state.phase === 'none' && !state.hasScene && <SimilarityContext />}
            {['showing-image', 'question'].includes(state.phase) && <AuthenticityContext />}
            <div className={desktop ? "desktop-scene" : "glasses-scene"}>
              {desktop && <div className="desktop-scene-heading"><Monitor size={18} /><div><strong>Later, back home</strong><p>Alex revisits the captured moments and develops the story on a computer.</p></div></div>}
              <div className={desktop ? "desktop-monitor" : undefined}>
            <WearerView
              state={state}
              editorDemo={editorDemo}
              suggestion={suggestion}
              photo={photo}
              videoRef={video}
              videoEvents={{
                onPlay: () => setPlaying(true),
                onPause: () => setPlaying(false),
                onError: () =>
                  setMessage(
                    "The clip is unavailable. You can still explore the demo with the captured frame.",
                  ),
              }}
              onDirection={direction}
              onAction={act}
              onBackground={() => dispatch({ type: "background" })}
              focus={
                next.focus === "down"
                  ? "bottom"
                  : next.focus === "up"
                    ? "top"
                    : next.focus
              }
              voiceEnabled={voiceEnabled}
              speechPlayback={speech}
              onVoiceToggle={() => setVoiceEnabled((v) => !v)}
              graph={graph}
              onGraph={setGraph}
            />
              </div>
              {desktop && <div className="desktop-stand" aria-hidden="true"><span /></div>}
            </div>
            <div className="viewer-footer">
              {desktop ? <span className="desktop-input-hint">Back home · Revising the story</span> : <button
                onClick={toggleVideo}
                aria-label={playing ? "Pause scene video" : "Play scene video"}
              >
                {playing ? <Pause size={13} /> : <Play size={13} />}{" "}
                {playing ? "Pause scene" : "Play scene"}
              </button>}
              <p>Prepared responses · AI-generated voice · no microphone needed</p>
              <span className="phone-note">
                For a larger view, turn your phone sideways.
              </span>
            </div>
          </div>
          {message && (state.phase !== "editing" || editorDemo.saved) && (
            <p className="status-message" role="status">
              <Info size={14} />
              {message}
            </p>
          )}
          {state.saved && (state.phase !== "editing" || editorDemo.saved) && (
            <div className="saved-bar">
              <span>
                <Check size={16} /> Story saved
              </span>
              <button
                onClick={() =>
                  download(
                    "the-first-sign.txt",
                    `${story.title}\n\n${state.draft}`,
                    "text/plain",
                  )
                }
              >
                <Download size={15} /> Download story
              </button>
              <button
                onClick={() =>
                  download(
                    "craft-context.json",
                    JSON.stringify({ ...exportContext(state), graph }, null, 2),
                    "application/json",
                  )
                }
              >
                Download context
              </button>
            </div>
          )}
        </section>}
        {!started && <ExperienceJourney />}
        <DesignGoals />
        <section className="publication wrap">
          <h2 className="paper-title">
            CRAFT: Exploring Wearable Creative AI on Smart Glasses for Fiction
            Writing in Real-World Contexts
          </h2>
          <p>
            <a className="author-link" href="https://runzecai.com/" target="_blank" rel="noreferrer">Runze Cai</a>, Yuxuan Huang, Lin-Ping Yuan, Kexin Xiang, David Hsu,
            Collier Nogues, Jussi Holopainen, and Shengdong Zhao.
          </p>
          <div>
            <a
              href="https://dl.acm.org/doi/10.1145/3831952"
              target="_blank"
              rel="noreferrer"
            >
              IMWUT / UbiComp 2026
            </a>
            <a
              href="https://dl.acm.org/doi/pdf/10.1145/3831952"
              target="_blank"
              rel="noreferrer"
            >
              PDF
            </a>
          </div>
        </section>
      </main>
      <footer className="site-footer wrap">
        <span>Context-aware Reality–Fiction Transformation</span>
      </footer>
    </>
  );
}
