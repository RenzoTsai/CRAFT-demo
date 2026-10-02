// Prepared moments use the same fields as the interactive plot editor.
export function initialGraph() {
  const moments = [
    { id: '1', description: 'An unusually dense shadow reveals the first sign of the student’s transformation.', parents: [], imageUrl: `${import.meta.env?.BASE_URL ?? '/'}media/imagined-shadow.png`, relevantToCurrentEnvironment: 'yes', currentDetailLevel: 'high' },
    { id: '2', description: 'The student investigates the experiment before sharing his discovery.', parents: ['1'], relevantToCurrentEnvironment: 'yes', currentDetailLevel: 'high' },
    { id: '3', description: 'A fellow student notices something is wrong. The protagonist must decide whether to trust them.', parents: ['2'], relevantToCurrentEnvironment: 'yes', currentDetailLevel: 'low' },
  ];
  return {
    nodes: moments.map((moment, index) => ({ id: moment.id, type: 'momentNode', position: { x: index * 300, y: 0 }, data: { moment } })),
    edges: moments.flatMap(moment => moment.parents.map(parent => ({ id: `${parent}->${moment.id}`, source: parent, target: moment.id, sourceHandle: `${parent}-source`, targetHandle: `${moment.id}-target` }))),
  };
}

// Rebuild parents from live edges and omit runtime callbacks/selection on export.
export function serializeGraph({ nodes, edges }) {
  const ids = new Set(nodes.map(node => node.id));
  const seen = new Set();
  const validEdges = edges.filter(edge => {
    const pair = `${edge.source}->${edge.target}`;
    if (!ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target || seen.has(pair)) return false;
    seen.add(pair);
    return true;
  }).map(edge => ({ id: edge.id, source: edge.source, target: edge.target, sourceHandle: `${edge.source}-source`, targetHandle: `${edge.target}-target` }));
  return {
    nodes: nodes.map(node => ({ id: node.id, type: 'momentNode', position: { ...node.position }, data: { moment: { ...node.data.moment, parents: validEdges.filter(edge => edge.target === node.id).map(edge => edge.source) } } })),
    edges: validEdges,
  };
}
