import { draftFor } from './flow.mjs';
import { story } from './story.mjs';
import { initialGraph, serializeGraph } from './plot-graph.mjs';

export const PLOT_DURATION = 15500;
export const PLOT_SAVE_AT = 13500;
export const EDITOR_DURATION = PLOT_DURATION + 22000;
export const EDITOR_SAVE_AT = PLOT_DURATION + 20800;
export const PLOT_DESCRIPTION = 'The student investigates how the experiment changed his body before deciding whom to trust.';

export function plotFrame(elapsed, graph = initialGraph()) {
  const t = Math.max(0, elapsed);
  const nodeId = graph.nodes.find(node => node.id === '2')?.id ?? graph.nodes[0]?.id;
  const progress = Math.max(0, Math.min(1, (t - 4200) / 1800));
  const editing = t >= 7600 && t < 11900;
  const description = PLOT_DESCRIPTION.slice(0, Math.floor(Math.max(0, Math.min(1, (t - 7900) / 2500)) * PLOT_DESCRIPTION.length));
  const plotGraph = serializeGraph({ ...graph, nodes: graph.nodes.map(node => node.id !== nodeId ? node : {
    ...node, position: { x: node.position.x + 60 * progress, y: node.position.y + 150 * progress },
    data: { ...node.data, moment: { ...node.data.moment, description: t >= 11900 ? PLOT_DESCRIPTION : node.data.moment.description } },
  }) });
  let target = 'show-plot', label = 'Open the plot to organize the captured moments.';
  if (t >= 3000) { target = 'plot-node'; label = 'Move a plot point to organize the story.'; }
  if (t >= 6400) { target = 'plot-edit'; label = 'Refine the plot point before drafting.'; }
  if (t >= 7600) target = 'plot-description';
  if (t >= 10800) { target = 'plot-apply'; label = 'Keep the revised plot point.'; }
  if (t >= 12300) { target = 'plot-save'; label = 'Save the organized plot.'; }
  if (t >= 14500) { target = 'plot-close'; label = 'Return to the writing editor.'; }
  return { plotGraph, nodeId, editing, description, target, label,
    view: t >= 1400 && t < PLOT_DURATION ? 'plot' : 'editor',
    dragging: t >= 4200 && t < 6000, progress,
    pressing: [[900,1200],[3900,6000],[7300,7600],[11600,11900],[13200,13500],[15200,15500]].some(([a,b]) => t >= a && t < b),
    plotSaved: t >= PLOT_SAVE_AT,
  };
}
export const EDITOR_FEEDBACK = 'Make the discovery more tense. Use shorter sentences and focus on the unusually dense shadow.';

export function editorFrame(elapsed, context, graph = initialGraph()) {
  const plot = plotFrame(elapsed, graph);
  if (elapsed < PLOT_DURATION) return { ...plot, elapsed, generated: '', feedback: '', draft: '', pending: null, selecting: false, shortcut: '', saved: false, done: false };
  const t = Math.max(0, elapsed - PLOT_DURATION);
  const generated = t < 2400 ? '' : t < 11300 ? draftFor(context) : story.revisedDraft;
  const feedback = EDITOR_FEEDBACK.slice(0, Math.floor(Math.max(0, Math.min(1, (t - 5400) / 3200)) * EDITOR_FEEDBACK.length));
  const draft = t < 17700 ? '' : story.revisedDraft;
  const pending = t >= 1200 && t < 2400 ? 'generate' : t >= 9800 && t < 11300 ? 'revise' : null;
  let target = 'generate', label = 'Generate a draft from the captured moments.';
  if (t >= 4500) { target = 'feedback'; label = 'Type a modification to the draft.'; }
  if (t >= 8900) { target = 'revise'; label = 'Regenerate using the writer’s feedback.'; }
  if (t >= 13500) { target = 'generated'; label = 'Select the revised passage.'; }
  if (t >= 15700) label = 'Copy the revised passage.';
  if (t >= 16500) { target = 'draft'; label = 'Paste the passage into the saved draft.'; }
  if (t >= 19500) { target = 'save'; label = 'Save the draft and update the story context.'; }
  if (elapsed >= EDITOR_SAVE_AT) label = 'The revised story and context are saved.';
  const pressing = [[900,1200],[5100,5400],[9500,9800],[17100,17400],[20400,20800]].some(([a,b]) => t >= a && t < b);
  return { ...plot, elapsed, view: 'editor', generated, feedback, draft, pending, target, label, pressing,
    selecting: t >= 14500 && t < 16500,
    shortcut: t >= 15700 && t < 16500 ? '⌘ C' : t >= 17700 && t < 18600 ? '⌘ V' : '',
    saved: elapsed >= EDITOR_SAVE_AT, done: elapsed >= EDITOR_DURATION,
  };
}
