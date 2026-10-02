import test from 'node:test';
import assert from 'node:assert/strict';
import { initialGraph, serializeGraph } from '../src/plot-graph.mjs';

test('deleting a connection clears its parent reference in saved context', () => {
  const graph = initialGraph();
  graph.edges = graph.edges.filter(edge => edge.target !== '2');
  assert.deepEqual(serializeGraph(graph).nodes[1].data.moment.parents, []);
});
test('deleting a moment removes incident edges and dangling parents', () => {
  const graph = initialGraph();
  graph.nodes = graph.nodes.filter(node => node.id !== '2');
  const saved = serializeGraph(graph);
  assert.deepEqual(saved.edges, []);
  assert.deepEqual(saved.nodes[1].data.moment.parents, []);
});
test('reconnected edges update both old and new targets, without duplicates', () => {
  const graph = initialGraph();
  graph.edges = [{ id: 'new', source: '1', target: '3' }, { id: 'duplicate', source: '1', target: '3' }, { id: 'self', source: '1', target: '1' }];
  const saved = serializeGraph(graph);
  assert.equal(saved.edges.length, 1);
  assert.deepEqual(saved.nodes[1].data.moment.parents, []);
  assert.deepEqual(saved.nodes[2].data.moment.parents, ['1']);
});
test('saved graph retains edits and positions without component callbacks', () => {
  const graph = initialGraph();
  graph.nodes[0].data.moment.description = 'Edited moment';
  graph.nodes[0].position = { x: 42, y: 81 };
  graph.nodes[0].data.onDelete = () => {};
  graph.nodes[0].selected = true;
  const saved = serializeGraph(graph);
  assert.equal(saved.nodes[0].data.moment.description, 'Edited moment');
  assert.deepEqual(saved.nodes[0].position, { x: 42, y: 81 });
  assert.equal(saved.nodes[0].data.onDelete, undefined);
  assert.equal(saved.nodes[0].selected, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(saved)), saved);
});
