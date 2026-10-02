import test from 'node:test';
import assert from 'node:assert/strict';
import { editorFrame, EDITOR_FEEDBACK, EDITOR_SAVE_AT, EDITOR_DURATION, PLOT_DURATION, PLOT_SAVE_AT, PLOT_DESCRIPTION, plotFrame } from '../src/editor-demo.mjs';
import { initialState, reduce, exportContext } from '../src/flow.mjs';
import { initialGraph } from '../src/plot-graph.mjs';
import { story } from '../src/story.mjs';
const context = { ...initialState(), started: true, hasScene: true, phase: 'editing' };

test('desktop sequence generates before typing feedback, revises before copying, and saves last', () => {
  assert.equal(editorFrame(PLOT_DURATION + 0, context).draft, '');
  assert.equal(editorFrame(PLOT_DURATION + 1000, context).pressing, true);
  assert.equal(editorFrame(PLOT_DURATION + 1500, context).pending, 'generate');
  assert.ok(editorFrame(PLOT_DURATION + 2400, context).generated);
  const typing = editorFrame(PLOT_DURATION + 7000, context);
  assert.ok(typing.feedback.length > 0 && typing.feedback.length < EDITOR_FEEDBACK.length);
  assert.equal(editorFrame(PLOT_DURATION + 9000, context).feedback, EDITOR_FEEDBACK);
  assert.equal(editorFrame(PLOT_DURATION + 10000, context).pending, 'revise');
  assert.equal(editorFrame(PLOT_DURATION + 11300, context).generated, story.revisedDraft);
  assert.equal(editorFrame(PLOT_DURATION + 15000, context).selecting, true);
  assert.equal(editorFrame(PLOT_DURATION + 16000, context).shortcut, '⌘ C');
  assert.equal(editorFrame(PLOT_DURATION + 17699, context).draft, '');
  assert.equal(editorFrame(PLOT_DURATION + 18000, context).draft, story.revisedDraft);
  assert.equal(editorFrame(PLOT_DURATION + 18000, context).shortcut, '⌘ V');
  assert.equal(editorFrame(PLOT_DURATION + 20400, context).pressing, true);
  assert.equal(editorFrame(EDITOR_SAVE_AT - 1, context).saved, false);
  assert.equal(editorFrame(EDITOR_SAVE_AT, context).saved, true);
  assert.equal(editorFrame(EDITOR_DURATION, context).done, true);
});
test('animation saves the revised passage and feedback atomically into exported context', () => {
  const frame = editorFrame(EDITOR_SAVE_AT, context);
  const state = reduce({ ...context, draft: 'Old draft' }, { ...frame, type: 'demo-editor-save' });
  assert.equal(state.draft, story.revisedDraft);
  assert.equal(state.generated, state.draft);
  assert.equal(state.feedback, EDITOR_FEEDBACK);
  assert.equal(state.saved, true);
  assert.equal(state.revision, 1);
  assert.equal(exportContext(state).fiction.draft, story.revisedDraft);
  const exited = { ...context, phase: 'none' };
  assert.equal(reduce(exited, { ...frame, type: 'demo-editor-save' }), exited);
});


test('plot prelude opens, moves and edits a moment, saves, then returns to writing', () => {
  const graph = initialGraph();
  const before = JSON.stringify(graph);
  assert.equal(editorFrame(0, context, graph).target, 'show-plot');
  assert.equal(editorFrame(1000, context, graph).pressing, true);
  assert.equal(editorFrame(1400, context, graph).view, 'plot');
  const moving = plotFrame(5100, graph);
  assert.equal(moving.dragging, true);
  assert.equal(moving.plotGraph.nodes[1].position.y, 75);
  const typing = plotFrame(9000, graph);
  assert.equal(typing.editing, true);
  assert.ok(typing.description.length > 0 && typing.description.length < PLOT_DESCRIPTION.length);
  assert.equal(plotFrame(11900, graph).plotGraph.nodes[1].data.moment.description, PLOT_DESCRIPTION);
  assert.equal(plotFrame(PLOT_SAVE_AT - 1, graph).plotSaved, false);
  const saved = plotFrame(PLOT_SAVE_AT, graph);
  assert.equal(saved.plotSaved, true);
  assert.deepEqual(saved.plotGraph.nodes[1].data.moment.parents, ['1']);
  assert.deepEqual(saved.plotGraph.nodes[1].position, { x: 360, y: 150 });
  assert.equal(JSON.stringify(graph), before, 'animation must not mutate the initial graph');
  assert.equal(editorFrame(PLOT_DURATION, context, graph).view, 'editor');
  assert.equal(editorFrame(PLOT_DURATION, context, graph).target, 'generate');
  assert.equal(editorFrame(PLOT_DURATION, context, graph).generated, '');
});
