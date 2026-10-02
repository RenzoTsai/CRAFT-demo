import { story } from './story.mjs';

export const characterDescriptions = [
  'The protagonist: A student discovering changes after an experiment',
  'A fellow student: A witness who may become a confidant',
];
export const reflection = {
  answer: 'Curiosity leads him to inspect the shadow, while fear makes him keep the discovery to himself.',
  scene: 'The student steps closer to the car park wall, comparing his ordinary-looking body with its unnaturally dense shadow.',
  plot: 'He decides to investigate the experiment before telling anyone about the changes.',
  question: 'What might make him trust someone enough to reveal what he has noticed?',
};
export const moments = {
  scene: 'In the car park, an unusually dense shadow reveals the first sign of a student’s transformation.',
  answer: 'He chooses to investigate quietly before sharing his discovery.',
  role: 'A conversation with a fellow student explores whether he can trust someone with his secret.',
};
export const speechClips = {
  scene: story.scene,
  plot: story.plot,
  characters: characterDescriptions.join('. '),
  question: story.question,
  answer: reflection.answer,
  'updated-scene': reflection.scene,
  'updated-plot': reflection.plot,
  'updated-question': reflection.question,
  'role-opening': story.opening,
  ...Object.fromEntries(story.replies.map((reply, index) => [`role-reply-${index}`, reply.answer])),
  'moments-scene': `Moments. ${moments.scene}`,
  'moments-answer': moments.answer,
  'moments-role': moments.role,
};

// Match the application's speaking states. Notifications and recording stay silent.
export function speechForState(state) {
  if (state.recording || state.pending) return [];
  if (state.phase === 'showing-image') {
    return state.answered
      ? ['answer', 'updated-scene', 'updated-plot', 'characters', 'updated-question']
      : ['scene', 'plot', 'characters', 'question'];
  }
  if (state.phase === 'role-play') {
    return [state.roleTurn ? `role-reply-${(state.roleTurn - 1) % story.replies.length}` : 'role-opening'];
  }
  if (state.phase === 'selection' && state.hasScene) {
    return ['moments-scene', ...(state.answered ? ['moments-answer'] : []), ...(state.roleTurn ? ['moments-role'] : [])];
  }
  return [];
}
