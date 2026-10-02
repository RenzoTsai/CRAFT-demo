import { useLayoutEffect, useRef, useState } from "react";
import {
  FaPencilAlt,
  FaCamera,
  FaEyeSlash,
  FaEye,
  FaMicrophone,
  FaSpinner,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { MousePointer2 } from "lucide-react";
import { DISPLAY, fitDisplay } from "./stage.mjs";
import { isBusy, isRole, isDesktop, dialogue } from "./flow.mjs";
import { story } from "./story.mjs";
import { reflection, moments, characterDescriptions } from "./speech.mjs";
import PlotView from "./PlotView.tsx";
import "./wearer.css";
const asset = (name) => `${import.meta.env.BASE_URL}media/${name}`;
function Processing() {
  return (
    <div className="cv-processing" role="status">
      <FaSpinner size={48} className="spin" />
      <span>Processing...</span>
    </div>
  );
}
function Listening({ transcript, docked = false }) {
  return (
    <div className={`cv-listening ${docked ? "" : "cv-voice"}`}>
      <strong>Voice Input:</strong>
      <p>I am listening...</p>
      {transcript && (
        <>
          <strong>Current transcription:</strong>
          <p className="cv-transcript">{transcript}</p>
        </>
      )}
    </div>
  );
}
function StageEditor({ state, onAction, demo }) {
  const root = useRef(null);
  const [cursor, setCursor] = useState({ x: 18, y: 88 });
  useLayoutEffect(() => {
    const update = () => {
      const host = root.current;
      const nodeTarget = ['plot-node', 'plot-edit', 'plot-description', 'plot-apply'].includes(demo.target);
      const name = nodeTarget ? `${demo.target}-${demo.nodeId}` : demo.target;
      const target = host?.querySelector(`[data-demo="${name}"]`);
      if (!host || !target) return;
      const box = host.getBoundingClientRect(), item = target.getBoundingClientRect();
      const input = ['feedback', 'draft', 'generated', 'plot-description'].includes(demo.target);
      setCursor({ x: 100 * (item.left - box.left + item.width * (input ? 0.12 : 0.52)) / box.width,
        y: 100 * (item.top - box.top + item.height * (input ? 0.1 : 0.5)) / box.height });
    };
    update();
    const observer = new ResizeObserver(update);
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, [demo.target, demo.elapsed, demo.nodeId]);
  const view = { ...state, ...demo };
  return (
    <div className="cv-editor-backdrop">
      <section ref={root} className={`cv-editor cv-editor-animated ${demo.view === "plot" ? "cv-editor-plot" : ""} ${demo.paused ? "is-paused" : ""}`} aria-label="Story Editing Interface">
        {demo.view === 'plot' ? <PlotView graph={demo.plotGraph} onGraph={() => {}} onClose={() => {}} demo={demo} /> : <>
        <header>
          <h2>Story Editing Interface</h2>
          <div>
            <button
              className={`cv-context-button ${demo.pressing && demo.target === 'show-plot' ? 'cv-demo-click' : ''}`}
              data-demo="show-plot"
              aria-disabled={!demo.done}
              tabIndex={demo.done ? 0 : -1}
              onClick={() => demo.done && onAction({ type: "plot" })}
            >
              SHOW PLOT
            </button>
            <button
              className="cv-close"
              onClick={() => onAction({ type: "close-editor" })}
            >
              CLOSE
            </button>
          </div>
        </header>
        <div className="cv-editor-columns">
          <section>
            <h3>AI Generated Content</h3>
            <div className="cv-generated" data-demo="generated">
              <span className={demo.selecting ? "cv-demo-selection" : ""}>{view.generated ||
                'No AI generated content available. Click "Generate New Content" to create new content based on your recent interactions.'}</span>
            </div>
            <button
              data-demo="generate"
              className={demo.pressing && demo.target === "generate" ? "cv-demo-click" : ""}
              aria-disabled="true"
            >
              {view.pending === "generate"
                ? "Generating..."
                : "GENERATE NEW CONTENT BASED ON NEW INTERACTIONS"}
            </button>
          </section>
          <section>
            <h3>Modification Feedback</h3>
            <textarea
              aria-label="Modification Feedback"
              data-demo="feedback"
              readOnly
              value={view.feedback}
              placeholder={
                "Enter your modification suggestions here...\n\nExample: Make the moment more dramatic."
              }
            />
            <button
              data-demo="revise"
              className={`cv-feedback-button ${demo.pressing && demo.target === "revise" ? "cv-demo-click" : ""}`}
              aria-disabled="true"
            >
              {view.pending === "revise"
                ? "Regenerating..."
                : "REGENERATE WITH FEEDBACK"}
            </button>
          </section>
          <section>
            <h3>Your Saved Content</h3>
            <textarea
              aria-label="Your Saved Content"
              data-demo="draft"
              readOnly
              value={view.draft}
              placeholder="Your saved story content will appear here. Edit and modify as needed..."
            />
            <button
              data-demo="save"
              className={demo.pressing && demo.target === "save" ? "cv-demo-click" : ""}
              aria-disabled="true"
            >
              {demo.saved ? "SAVED ✓" : "SAVE AND UPDATE CONTEXT"}
            </button>
          </section>
        </div>
        </>}
        {!demo.done && <div className={`cv-demo-cursor ${demo.pressing ? 'is-clicking' : ''} ${demo.dragging ? 'is-dragging' : ''}`} style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }} aria-hidden="true">
          <MousePointer2 size={30} fill="white" stroke="#14212b" strokeWidth={1.5} />
          {demo.shortcut && <span>{demo.shortcut}</span>}
        </div>}
      </section>
    </div>
  );
}
export default function WearerView({
  state,
  editorDemo,
  suggestion,
  photo,
  videoRef,
  videoEvents,
  onDirection,
  onAction,
  onBackground,
  focus,
  voiceEnabled,
  speechPlayback,
  onVoiceToggle,
  graph,
  onGraph,
}) {
  const container = useRef(null),
    stage = useRef(null);
  useLayoutEffect(() => {
    const update = () => {
      if (!container.current || !stage.current) return;
      const { width, height } = container.current.getBoundingClientRect();
      const fit = fitDisplay(width, height);
      Object.assign(stage.current.style, {
        transform: `scale(${fit.scale})`,
        left: `${fit.left}px`,
        top: `${fit.top}px`,
      });
      stage.current.style.setProperty("--cv-scale", String(fit.scale || 1));
    };
    const observer = new ResizeObserver(update);
    observer.observe(container.current);
    update();
    return () => observer.disconnect();
  }, []);
  const roleplay = isRole(state),
    authoring = ["showing-image", "question"].includes(state.phase),
    busy = isBusy(state),
    selection = state.phase === "selection";
  const showControls =
    state.buttons && !busy && !["editing", "plot"].includes(state.phase);
  const keyButton = (key, label, children) => (
    <button
      className={`cv-${key} ${focus === key ? "cv-next-control" : ""}`}
      aria-label={label}
      onClick={() =>
        onDirection(
          {
            left: "ArrowLeft",
            right: "ArrowRight",
            top: "ArrowUp",
            bottom: "ArrowDown",
          }[key],
        )
      }
    >
      {children}
    </button>
  );
  return (
    <div
      className={`wearer-viewport ${isDesktop(state) ? "desktop-display" : ""}`}
      ref={container}
      aria-label={isDesktop(state) ? "CRAFT desktop editor" : "CRAFT glasses display"}
    >
      <div
        className="wearer-display"
        ref={stage}
        style={{ width: DISPLAY.width, height: DISPLAY.height }}
        onClick={(e) => {
          if (e.target === e.currentTarget || e.target === videoRef.current)
            onBackground();
        }}
      >
        <video
          className="cv-world-video"
          ref={videoRef}
          src={asset("world-camera.mp4")}
          poster={asset("world-camera.jpg")}
          muted
          playsInline
          loop
          preload="metadata"
          {...videoEvents}
        />
        {state.phase === "none" && suggestion && (
          <div className="cv-suggestion">
            <span aria-hidden="true">💡</span>
            <span>{story.seed}</span>
          </div>
        )}
        {state.phase === "photo" && (
          <div className="cv-photo">
            <strong>Any Comments?</strong>
            <img src={photo} alt="Captured world-camera view" />
            {state.transcript ? (
              <p>
                <strong>You said:</strong> {state.transcript}
              </p>
            ) : (
              <small>Listening...</small>
            )}
          </div>
        )}
        {authoring && (
          <>
            <div className="cv-authoring-panel">
              <div className="cv-transformation">
                <div
                  className="cv-transformation-text"
                  tabIndex={0}
                  aria-label="Transformation text"
                >
                  <h2>Transformation</h2>
                  <h3>SCENE</h3>
                  <p>
                    {state.answered
                      ? reflection.scene
                      : story.scene}
                  </p>
                  <h3>PLOT</h3>
                  <p>
                    {state.answered
                      ? reflection.plot
                      : story.plot}
                  </p>
                  <h3>CHARACTERS</h3>
                  <ul>
                    {characterDescriptions.map(description => <li key={description}>{description}</li>)}
                  </ul>
                </div>
                <div className="cv-generated-image">
                  <img
                    src={asset("imagined-shadow.png")}
                    alt="Imagined branching shadow on the same wall"
                  />
                </div>
              </div>
              <div className="cv-mode">
                Current Mode:{" "}
                {state.recording
                  ? "Answering Question"
                  : "Viewing Generated Content"}{" "}
                | Press ↑ to switch to Role-Play
              </div>
            </div>
            <div className="cv-question">
              <div>
                {state.answered && (
                  <div className="cv-answer">
                    <strong>💡 Answer:</strong>
                    <p>
                      {reflection.answer}
                    </p>
                  </div>
                )}
                <strong>Question:</strong>
                <p>
                  {state.answered
                    ? reflection.question
                    : story.question}
                </p>
                {state.transcript && (
                  <>
                    <strong>Your response:</strong>
                    <p className="cv-transcript">{state.transcript}</p>
                  </>
                )}
              </div>
              <small>
                {state.recording ? "Listening for your answer..."
                  : speechPlayback.status === 'playing' ? `Speaking (${speechPlayback.index}/${speechPlayback.total})`
                  : speechPlayback.status === 'blocked' ? 'Tap Play voice to listen.'
                  : speechPlayback.status === 'error' ? 'Audio unavailable. Tap Play voice to retry.'
                  : "Press right to record your answer."}
              </small>
            </div>
          </>
        )}
        {roleplay && (
          <div className="cv-roleplay-layout">
            <div className="cv-roleplay">
              <header>
                <h2>🎭 Role-Play Mode</h2>
                <p>
                  Your Role: <strong>{story.role}</strong>
                </p>
              </header>
              <div className="cv-character">
                <img src={asset("roleplay-fellow-student.png")} alt="The fictional fellow student in front of the captured car park wall" />
                <div>
                  <h3>{story.character}</h3>
                  <blockquote>“{dialogue(state)}”</blockquote>
                </div>
              </div>
              <footer>
                {state.recording ? (
                  "Press → to submit your dialogue"
                ) : (
                  <>
                    Press → to speak as <strong>{story.role}</strong>
                  </>
                )}{" "}
                • Press ← to exit role-play
              </footer>
            </div>
            {state.phase === "role-play-listening" && (
              <Listening transcript={state.transcript} docked />
            )}
          </div>
        )}
        {state.phase === "voice" && <Listening transcript={state.transcript} />}
        {selection && (
          <div className="cv-moments">
            <header>
              <h2>Moments:</h2>
              <button onClick={() => onDirection("ArrowLeft")}>Close</button>
            </header>
            {!state.textHidden &&
              (state.hasScene ? (
                <ol>
                  <li>{moments.scene}</li>
                  {state.answered && (
                    <li>{moments.answer}</li>
                  )}
                  {state.roleTurn > 0 && (
                    <li>
                      {moments.role}
                    </li>
                  )}
                </ol>
              ) : (
                <p>
                  No moments yet. Press ← to close, then ↓ to capture a photo.
                </p>
              ))}
          </div>
        )}
        {state.phase === "editing" && (
          <StageEditor state={state} onAction={onAction} demo={editorDemo} />
        )}
        {state.phase === "plot" && (
          <PlotView
            graph={graph}
            onGraph={onGraph}
            onClose={() => onAction({ type: "edit" })}
          />
        )}
        {busy && state.phase !== "editing" && <Processing />}
        {showControls && (
          <div className="cv-controls">
            {!authoring && !roleplay && (
              <>
                {selection ? (
                  <button
                    className="cv-top"
                    aria-label="Toggle speech"
                    onClick={onVoiceToggle}
                  >
                    {voiceEnabled ? (
                      <FaVolumeUp size={24} />
                    ) : (
                      <FaVolumeMute size={24} />
                    )}
                  </button>
                ) : (
                  keyButton(
                    "top",
                    "View story moments (up arrow)",
                    <FaPencilAlt size={24} />,
                  )
                )}
                {keyButton(
                  "bottom",
                  selection
                    ? "Toggle moments text"
                    : "Take a photo (down arrow)",
                  selection ? (
                    state.textHidden ? (
                      <FaEye size={24} />
                    ) : (
                      <FaEyeSlash size={24} />
                    )
                  ) : (
                    <FaCamera size={24} />
                  ),
                )}
              </>
            )}
            {keyButton(
              "left",
              roleplay
                ? "Exit role-play (left arrow)"
                : "Clear display (left arrow)",
              <FaEyeSlash size={24} />,
            )}
            {keyButton(
              "right",
              state.recording
                ? "Submit recording (right arrow)"
                : "Start recording (right arrow)",
              <FaMicrophone size={24} />,
            )}
          </div>
        )}
        {state.hasScene &&
          !busy &&
          !["editing", "plot"].includes(state.phase) && (
            <button
              className="cv-edit-launcher"
              aria-label="Open story editor"
              onClick={() => onAction({ type: "edit" })}
            >
              e
            </button>
          )}
      </div>
    </div>
  );
}
