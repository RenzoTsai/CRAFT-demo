import { story } from "./story.mjs";
export const PHOTO_LINE =
  "The protagonist wasn’t aware his body was changing until one day he accidentally noticed his shadow looked slightly different than usual. The torso seemed denser, blocking more light than it should.";
export const ANSWER_LINE =
  "He is curious, but frightened of what others might think. He investigates before telling anyone.";
export const initialState = () => ({
  phase: "none",
  started: false,
  buttons: false,
  recording: false,
  transcript: "",
  pending: null,
  hasScene: false,
  answered: false,
  roleTurn: 0,
  draft: "",
  generated: "",
  feedback: "",
  saved: false,
  revision: 0,
  textHidden: false,
});
export const isBusy = (s) => Boolean(s.pending);
export const isRole = (s) =>
  ["role-play", "role-play-listening", "role-play-waiting"].includes(s.phase);
export const recordingLine = (s) =>
  s.phase === "photo" || s.phase === "voice"
    ? PHOTO_LINE
    : s.phase === "question"
      ? ANSWER_LINE
      : story.replies[s.roleTurn % story.replies.length].line;
export const dialogue = (s) =>
  s.roleTurn
    ? story.replies[(s.roleTurn - 1) % story.replies.length].answer
    : story.opening;
export function draftFor(s) {
  const reply = s.roleTurn
    ? story.replies[(s.roleTurn - 1) % story.replies.length]
    : null;
  return (
    story.draft +
    (reply
      ? `\n\n“${reply.line}” I asked.\n\n“${reply.answer}”\n\n${reply.ending}`
      : "")
  );
}
export function reduce(s, a) {
  if (a.type === "demo-editor-save")
    return s.phase === 'editing' ? { ...s, generated: a.generated, feedback: a.feedback, draft: a.draft, saved: true, pending: null, revision: s.revision + 1 } : s;
  if (a.type === "reset") return initialState();
  if (a.type === "start") return { ...s, started: true, buttons: true };
  if (a.type === "background")
    return { ...s, started: true, buttons: !s.buttons };
  if (a.type === "transcript")
    return s.recording ? { ...s, transcript: a.text } : s;
  if (a.type === "draft") return { ...s, draft: a.text, saved: false };
  if (a.type === "feedback") return { ...s, feedback: a.text };
  if (a.type === "save")
    return s.draft.trim() ? { ...s, saved: true, revision: s.revision + 1 } : s;
  if (a.type === "edit")
    return s.hasScene
      ? {
          ...s,
          phase: "editing",
          buttons: false,
          recording: false,
          transcript: "",
          pending: null,
        }
      : s;
  if (a.type === "close-editor")
    return { ...s, phase: "none", buttons: false, pending: null };
  if (a.type === "generate")
    return s.hasScene && !s.pending
      ? { ...s, phase: "editing", pending: "generate" }
      : s;
  if (a.type === "revise")
    return s.feedback.trim() && !s.pending ? { ...s, pending: "revise" } : s;
  if (a.type === "plot")
    return { ...s, phase: "plot", buttons: false, pending: null };
  if (a.type === "complete") {
    if (s.pending === "authoring")
      return {
        ...s,
        pending: null,
        phase: "showing-image",
        hasScene: true,
        transcript: "",
        buttons: true,
      };
    if (s.pending === "answer")
      return {
        ...s,
        pending: null,
        phase: "showing-image",
        hasScene: true,
        answered: true,
        transcript: "",
        buttons: true,
      };
    if (s.pending === "role-start")
      return {
        ...s,
        pending: null,
        phase: "role-play",
        transcript: "",
        buttons: true,
      };
    if (s.pending === "role-turn")
      return {
        ...s,
        pending: null,
        phase: "role-play",
        roleTurn: s.roleTurn + 1,
        transcript: "",
        buttons: true,
      };
    if (s.pending === "generate")
      return { ...s, pending: null, generated: draftFor(s) };
    if (s.pending === "revise")
      return {
        ...s,
        pending: null,
        generated: story.revisedDraft,
      };
    return s;
  }
  if (a.type !== "direction") return s;
  if (a.key === "ArrowLeft" || a.key === "Escape")
    return {
      ...s,
      phase: "none",
      buttons: false,
      recording: false,
      transcript: "",
      pending: null,
      textHidden: false,
    };
  if (s.pending) return s;
  if (a.key === "ArrowDown") {
    if (s.phase === "none")
      return {
        ...s,
        started: true,
        phase: "photo",
        buttons: true,
        recording: true,
        transcript: "",
      };
    if (s.phase === "selection") return { ...s, textHidden: !s.textHidden };
    return s;
  }
  if (a.key === "ArrowUp") {
    if (["showing-image", "question"].includes(s.phase))
      return {
        ...s,
        phase: "starting-role-play",
        pending: "role-start",
        recording: false,
        transcript: "",
      };
    if (s.phase === "none")
      return { ...s, started: true, phase: "selection", buttons: true };
    return s;
  }
  if (a.key === "ArrowRight") {
    if (s.phase === "photo" || s.phase === "voice")
      return {
        ...s,
        phase: "submitted",
        pending: "authoring",
        recording: false,
        transcript: "",
      };
    if (["showing-image", "question"].includes(s.phase))
      return s.recording
        ? {
            ...s,
            phase: "submitted",
            pending: "answer",
            recording: false,
            transcript: "",
          }
        : { ...s, phase: "question", recording: true, transcript: "" };
    if (s.phase === "role-play")
      return {
        ...s,
        phase: "role-play-listening",
        recording: true,
        transcript: "",
      };
    if (s.phase === "role-play-listening")
      return {
        ...s,
        phase: "role-play-waiting",
        pending: "role-turn",
        recording: false,
        transcript: "",
      };
    if (s.phase === "none" || s.phase === "selection")
      return {
        ...s,
        started: true,
        phase: "voice",
        buttons: true,
        recording: true,
        transcript: "",
      };
  }
  return s;
}
export function nextMove(s) {
  if (!s.started)
    return {
      title: "A suggestion catches your attention.",
      description:
        "Read the blue suggestion, then press ↓ to capture the shadow.",
      label: "Take a photo",
      key: "ArrowDown",
      focus: "down",
    };
  if (s.pending)
    return {
      title:
        s.phase === "role-play-waiting"
          ? "The character is responding."
          : "CRAFT is processing.",
      description: "Wait for the result to appear in the glasses view.",
      label: "Processing…",
      focus: null,
    };
  if (s.recording)
    return {
      title:
        s.phase === "photo"
          ? "Your photo is captured. Now add an idea."
          : s.phase === "question"
            ? "Answer the question on the right."
            : "Speak to the character.",
      description:
        "Watch the example words appear, then press → to submit.",
      label: s.phase === "photo" ? "Submit idea" : "Submit reply",
      key: "ArrowRight",
      focus: "right",
    };
  if (s.phase === "showing-image")
    return {
      title: "See how the moment becomes fiction.",
      description:
        "Read the transformation. When you are ready, press ↑ to meet the character.",
      label: "Enter role-play",
      key: "ArrowUp",
      focus: "up",
    };
  if (s.phase === "role-play")
    return s.roleTurn
      ? {
          title: "The fellow student has replied.",
          description:
            "Press ← to end role-play and clear the display. Your story stays in this session.",
          label: "Finish role-play",
          key: "ArrowLeft",
          focus: "left",
        }
      : {
          title: "Rehearse what happens next.",
          description:
            "Try a conversation with a fellow student. Press → to speak as the protagonist.",
          label: "Start speaking",
          key: "ArrowRight",
          focus: "right",
        };
  if (s.phase === "editing")
    return {
      title: "Back home, develop the scene on your computer.",
      description: "Watch the writer generate, revise and save the scene.",
      label: "Watch the editing sequence",
      focus: null,
    };
  if (s.phase === "plot")
    return {
      title: "Connect moments into a plot.",
      description:
        "Drag between handles to connect moments. Select a line to delete it.",
      label: "Return to writing",
      action: "edit",
      focus: null,
    };
  if (s.phase === "selection")
    return {
      title: "Review your captured moments.",
      description:
        "Press ← to close this view, then ↓ to capture another moment.",
      label: "Close moments",
      key: "ArrowLeft",
      focus: "left",
    };
  if (s.hasScene)
    return {
      title: "The display is clear. Your story remains.",
      description: "Return to your computer to organize the moments and continue drafting.",
      label: "Continue at home",
      action: "edit",
      focus: null,
    };
  return {
    title: "Capture the shadow.",
    description:
      "Press ↓ or click the camera at the bottom of the glasses view.",
    label: "Take a photo",
    key: "ArrowDown",
    focus: "down",
  };
}
export function exportContext(s) {
  return {
    title: story.title,
    format: "CRAFT guided demo",
    environment: "White car park wall with a shadow",
    writingPlan: story.premise,
    fiction: {
      scene: story.scene,
      plot: story.plot,
      characters: [story.role, story.character],
      authoring: PHOTO_LINE,
      answer: s.answered ? ANSWER_LINE : null,
      dialogue: s.roleTurn ? dialogue(s) : null,
      draft: s.draft,
      revisionNote: s.feedback,
    },
    revision: s.revision,
  };
}

export const isDesktop = (state) => ["editing", "plot"].includes(state.phase);
