import React, { useMemo, useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Typography, IconButton, Button, TextField, useMediaQuery } from '@mui/material';
import { Trash2, Edit2, Check, Link2 } from 'lucide-react';
import { 
  ReactFlow, 
  Background,
  Controls, 
  Position, 
  Handle, 
  MarkerType,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge
} from '@xyflow/react';
import type { Node, Edge, NodeProps, Connection, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface Moment {
  id: string;
  description: string;
  parents?: string[];
  imageUrl?: string | null;
  relevantToCurrentEnvironment?: string;
  currentDetailLevel?: string;
}
interface PlotData {
  currentFPV?: string;
  moments: Moment[];
}
type DeleteMoment = (id: string) => void;
type UpdateMoment = (id: string, description: string) => void;
type MomentGraphNode = Node<{
  moment: Moment;
  onDelete: DeleteMoment;
  onUpdateDescription: UpdateMoment;
  demoEditing?: boolean;
  demoDescription?: string;
}>;

import { serializeGraph } from './plot-graph.mjs';

// Custom node component with edit functionality
const MomentNode = ({ id, data }: NodeProps<MomentGraphNode>) => {
  const moment = data.moment;
  const handleDelete = data.onDelete;
  const handleUpdateDescription = data.onUpdateDescription;
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(moment.description);
  const editingVisible = data.demoEditing ?? isEditing;
  
  // Determine node styling based on relevance and detail level
  const isRelevant = moment.relevantToCurrentEnvironment === "yes";
  const isDetailedLevel = moment.currentDetailLevel === "high";
  
  // Set colors based on relevance
  const nodeColor = isRelevant ? '#4CAF50' : '#1A472A';  // Bright green vs dark green
  
  // Set border style based on detail level
  const borderStyle = isDetailedLevel ? 'solid' : 'dashed';
  
  const handleEditToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset to original value when entering edit mode
      setEditedDescription(moment.description);
    }
  };
  
  const handleSaveEdit = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    if (handleUpdateDescription) {
      handleUpdateDescription(id, editedDescription);
    }
    setIsEditing(false);
  };
  
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedDescription(event.target.value);
  };

  return (
    <div
      className="craft-moment-node"
      data-demo={`plot-node-${id}`}
      style={{
        width: 220,
        minHeight: 180,
        padding: '36px 16px 40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.4)',
        border: `2px ${borderStyle} ${nodeColor}`,
        color: nodeColor,
        boxShadow: 'none',
        borderRadius: 12,
        position: 'relative',
      }}
    >
      <Handle 
        id={`${id}-target`} 
        type="target" 
        position={Position.Left} 
        style={{ background: nodeColor }} 
      />
      <Handle 
        id={`${id}-source`} 
        type="source" 
        position={Position.Right} 
        style={{ background: nodeColor }} 
      />
      
      {/* Control buttons in top right */}
      <div className="craft-moment-actions nodrag nopan" style={{ position: 'absolute', top: 4, right: 4, display: 'flex' }}>
        {editingVisible ? (
          <IconButton
            size="small"
            aria-label="Save moment description"
            data-demo={`plot-apply-${id}`}
            onClick={handleSaveEdit}
            sx={{ color: nodeColor, background: 'rgba(0,0,0,0.2)', marginRight: '4px' }}
          >
            <Check size={16} />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            aria-label="Edit moment description"
            data-demo={`plot-edit-${id}`}
            onClick={handleEditToggle}
            sx={{ color: nodeColor, background: 'rgba(0,0,0,0.2)', marginRight: '4px' }}
          >
            <Edit2 size={16} />
          </IconButton>
        )}
        <IconButton
          size="small"
          aria-label="Delete moment"
          onClick={(event) => {
            event.stopPropagation();
            if (handleDelete) {
              handleDelete(id);
            }
          }}
          sx={{ color: nodeColor, background: 'rgba(0,0,0,0.2)' }}
        >
          <Trash2 size={16} />
        </IconButton>
      </div>
      
      {moment.imageUrl && (
        <img
          src={moment.imageUrl}
          alt={moment.description}
          style={{
            width: '100%',
            height: 180,
            objectFit: 'cover',
            marginBottom: 12,
            borderRadius: 8,
            border: `1.5px ${borderStyle} ${nodeColor}`,
          }}
        />
      )}
      
      {editingVisible ? (
        <TextField
          className="nodrag nopan nowheel"
          fullWidth
          multiline
          variant="outlined"
          value={data.demoDescription ?? editedDescription}
          data-demo={`plot-description-${id}`}
          onChange={handleTextChange}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            // Save on Enter + Ctrl/Cmd
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSaveEdit(e);
            }
          }}
          InputProps={{
            style: {
              color: nodeColor,
              fontSize: '0.875rem',
              padding: '8px',
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: `${nodeColor}80`,
                borderStyle: borderStyle,
              },
              '&:hover fieldset': {
                borderColor: nodeColor,
              },
              '&.Mui-focused fieldset': {
                borderColor: nodeColor,
              },
            },
          }}
        />
      ) : (
        <Typography variant="body2" sx={{ color: nodeColor }}>
          {moment.description}
        </Typography>
      )}
      
      {/* Status indicators */}
      <div style={{ 
        position: 'absolute', 
        bottom: 8, 
        left: 8, 
        display: 'flex', 
        gap: '8px',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.7)'
      }}>
        <span style={{ 
          padding: '2px 6px', 
          borderRadius: '14px', 
          background: isRelevant ? 'rgba(76,175,80,0.2)' : 'rgba(26,71,42,0.2)', 
          border: `1px solid ${nodeColor}`
        }}>
          {isRelevant ? 'Relevant' : 'Irrelevant'}
        </span>
        <span style={{ 
          padding: '2px 6px', 
          borderRadius: '14px', 
          background: 'rgba(0,0,0,0.2)', 
          border: `1px ${borderStyle} ${nodeColor}`
        }}>
          {isDetailedLevel ? 'High Detail' : 'Low Detail'}
        </span>
        <span style={{ 
          padding: '2px 6px', 
          borderRadius: '14px', 
          background: 'rgba(0,0,0,0.2)', 
          border: `1px solid ${nodeColor}`
        }}>
          ID: {id}
        </span>
      </div>
    </div>
  );
};

const getInitialNodesAndEdges = (data: PlotData, onDeleteNode: DeleteMoment, onUpdateDescription: UpdateMoment) => {
  // Layout: assign x/y positions for a simple left-to-right, multi-row layout
  const levels: Record<number, Moment[]> = {};
  const idToLevel: Record<string, number> = {};
  let maxLevel = 0;

  function getLevel(moment: Moment) {
    if (!moment.parents || moment.parents.length === 0) return 0;
    const parentLevels = moment.parents.map(pid => idToLevel[pid] ?? 0);
    return Math.max(...parentLevels) + 1;
  }

  data.moments.forEach((moment) => {
    const level = getLevel(moment);
    idToLevel[moment.id] = level;
    if (!levels[level]) levels[level] = [];
    levels[level].push(moment);
    if (level > maxLevel) maxLevel = level;
  });

  const nodes: MomentGraphNode[] = [];
  const ySpacing = 200;
  const xSpacing = 300;

  for (let level = 0; level <= maxLevel; level++) {
    const row = levels[level] || [];
    row.forEach((moment, idx) => {
      nodes.push({
        id: moment.id,
        type: 'momentNode',
        data: {
          moment: moment,
          onDelete: onDeleteNode,
          onUpdateDescription: onUpdateDescription
        },
        position: {
          x: level * xSpacing,
          y: idx * ySpacing,
        },
      });
    });
  }

  const edges: Edge[] = [];

  data.moments.forEach((moment) => {
    if (moment.parents && moment.parents.length > 0) {
      moment.parents.forEach((parentId) => {
        // Determine color for edge based on source and target node relevance
        const parentMoment = data.moments.find(m => m.id === parentId);
        const isSourceRelevant = parentMoment?.relevantToCurrentEnvironment === "yes";
        const isTargetRelevant = moment.relevantToCurrentEnvironment === "yes";
        
        // Use the color of the most relevant node, or darker color if both are low relevance
        const edgeColor = isSourceRelevant || isTargetRelevant ? '#4CAF50' : '#1A472A';
        
        // Set edge style based on detail level
        const isSourceDetailed = parentMoment?.currentDetailLevel === "high";
        const isTargetDetailed = moment.currentDetailLevel === "high";
        
        // If either node has high detail, use solid line, otherwise dashed
        const edgeStyle = isSourceDetailed || isTargetDetailed ? 'solid' : 'dashed';
        
        edges.push({
          id: `${parentId}->${moment.id}`,
          source: parentId,
          target: moment.id,
          sourceHandle: `${parentId}-source`,
          targetHandle: `${moment.id}-target`,
          style: { 
            stroke: edgeColor, 
            strokeWidth: 2,
            strokeDasharray: edgeStyle === 'dashed' ? '5 5' : undefined
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: edgeColor,
          },
        });
      });
    }
  });

  return { nodes, edges };
};

interface PlotDemoFrame {
  plotGraph: { nodes: MomentGraphNode[]; edges: Edge[] };
  nodeId?: string;
  editing: boolean;
  description: string;
  plotSaved: boolean;
  target: string;
  pressing: boolean;
}
const PlotDemonstration = ({ graph, onGraph, onClose, demo }: {
  graph: { nodes: MomentGraphNode[]; edges: Edge[] };
  onGraph: (graph: { nodes: MomentGraphNode[]; edges: Edge[] }) => void;
  onClose?: () => void;
  demo?: PlotDemoFrame;
}) => {
  const initial = useRef(graph).current;
  const data = useMemo(() => ({ moments: initial.nodes.map(node => node.data.moment) }), [initial]);
  const smallScreen = useMediaQuery('(max-width: 1100px)');
  const compact = smallScreen && !demo;
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<ReactFlowInstance<MomentGraphNode, Edge> | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; description: string } | null>(null);
  const [status, setStatus] = useState('');
  const isProcessing = false;
  const [undoDelete, setUndoDelete] = useState<{ nodes: MomentGraphNode[]; edges: Edge[] } | null>(null);

  useLayoutEffect(() => {
    if (!compact) return;
    const update = () => {
      const visible = window.visualViewport;
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.style.width = `${visible?.width ?? window.innerWidth}px`;
      viewport.style.height = `${visible?.height ?? window.innerHeight}px`;
      viewport.style.left = `${visible?.offsetLeft ?? 0}px`;
      viewport.style.top = `${visible?.offsetTop ?? 0}px`;
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [compact]);
  const [nodes, setNodes, onNodesChange] = useNodesState<MomentGraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const selectedNode = nodes.find(node => node.id === selectedNodeId);
  const selectedEdge = edges.find(edge => edge.id === selectedEdgeId);

  // Track reconnection status
  const edgeReconnectSuccessful = useRef(true);
  
  // Handle node deletion
  const handleDeleteNode = useCallback((nodeId: string) => {

    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
  }, [setNodes, setEdges]);
  
  // Handle text update
  const handleUpdateDescription = useCallback((nodeId: string, newDescription: string) => {
    setUndoDelete(null);
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === nodeId) {
          // Create a new object to ensure React detects the change
          const updatedNode = { 
            ...node,
            data: {
              ...node.data,
              moment: {
                ...node.data.moment,
                description: newDescription
              }
            }
          };
          return updatedNode;
        }
        return node;
      })
    );
  }, [setNodes]);
  
  // Initialize nodes and edges with the handlers
  useEffect(() => {
    const { nodes: initialNodes, edges: initialEdges } = getInitialNodesAndEdges(
      data, 
      handleDeleteNode,
      handleUpdateDescription
    );
    setNodes(initialNodes.map(node => ({ ...node,
      position: initial.nodes.find(saved => saved.id === node.id)?.position ?? node.position,
    })));
    setEdges(initialEdges.map(edge => ({ ...edge,
      ...initial.edges.find(saved => saved.source === edge.source && saved.target === edge.target),
    })));
    setSelectedNodeId(null); setSelectedEdgeId(null); setConnecting(false); setConnectionSource(null); setEditing(null); setUndoDelete(null);
  }, [data, initial, handleDeleteNode, handleUpdateDescription, setNodes, setEdges]);
  
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    if (!demo) onGraph(serializeGraph({ nodes, edges }));
  }, [nodes, edges, onGraph, demo]);

  // Connect handler
  const onConnect = useCallback(
    (params: Connection) => {
      // Get source and target node information to determine edge styling
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (sourceNode && targetNode && params.source !== params.target
          && !edges.some(edge => edge.source === params.source && edge.target === params.target)) {
        const isSourceRelevant = sourceNode.data.moment.relevantToCurrentEnvironment === "yes";
        const isTargetRelevant = targetNode.data.moment.relevantToCurrentEnvironment === "yes";
        const edgeColor = isSourceRelevant || isTargetRelevant ? '#4CAF50' : '#1A472A';
        
        const isSourceDetailed = sourceNode.data.moment.currentDetailLevel === "high";
        const isTargetDetailed = targetNode.data.moment.currentDetailLevel === "high";
        const edgeStyle = isSourceDetailed || isTargetDetailed ? 'solid' : 'dashed';
        
        // Update target node's parents array
        setNodes(nodes => nodes.map(node => {
          if (node.id === params.target) {
            const currentParents = node.data.moment.parents || [];
            // Only add if parent doesn't already exist
            if (!currentParents.includes(params.source)) {
              return {
                ...node,
                data: {
                  ...node.data,
                  moment: {
                    ...node.data.moment,
                    parents: [...currentParents, params.source]
                  }
                }
              };
            }
          }
          return node;
        }));

        setUndoDelete(null);
        setEdges((eds) => addEdge({
          ...params,
          style: { 
            stroke: edgeColor, 
            strokeWidth: 2,
            strokeDasharray: edgeStyle === 'dashed' ? '5 5' : undefined
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: edgeColor,
          },
        }, eds));
      }
    },
    [nodes, edges, setNodes, setEdges]
  );
  
  // Reconnect handlers
  const onReconnectStart = useCallback(() => {

    edgeReconnectSuccessful.current = false;
  }, []);
  
  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {

    edgeReconnectSuccessful.current = true;
    
    // Get source and target node information to determine edge styling
    const sourceNode = nodes.find(n => n.id === newConnection.source);
    const targetNode = nodes.find(n => n.id === newConnection.target);
    
    if (sourceNode && targetNode) {
      const isSourceRelevant = sourceNode.data.moment.relevantToCurrentEnvironment === "yes";
      const isTargetRelevant = targetNode.data.moment.relevantToCurrentEnvironment === "yes";
      const edgeColor = isSourceRelevant || isTargetRelevant ? '#4CAF50' : '#1A472A';
      
      const isSourceDetailed = sourceNode.data.moment.currentDetailLevel === "high";
      const isTargetDetailed = targetNode.data.moment.currentDetailLevel === "high";
      const edgeStyle = isSourceDetailed || isTargetDetailed ? 'solid' : 'dashed';
      
      // Update target node's parents array
      setNodes(nodes => nodes.map(node => {
        if (node.id === newConnection.target) {
          const parents = node.data.moment.parents || [];
          const newParents = parents.filter(p => p !== oldEdge.source).concat(newConnection.source);
          return {
            ...node,
            data: {
              ...node.data,
              moment: {
                ...node.data.moment,
                parents: newParents
              }
            }
          };
        }
        return node;
      }));
      
      // Need to create new edge with updated styling based on the nodes
      const newEdge = {
        ...oldEdge,
        source: newConnection.source,
        target: newConnection.target,
        sourceHandle: newConnection.sourceHandle,
        targetHandle: newConnection.targetHandle,
        style: { 
          stroke: edgeColor, 
          strokeWidth: 2,
          strokeDasharray: edgeStyle === 'dashed' ? '5 5' : undefined
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edgeColor,
        },
      };
      
      setEdges((eds) => {
        const filteredEdges = eds.filter(e => e.id !== oldEdge.id);
        return [...filteredEdges, newEdge];
      });
    } else {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    }
  }, [nodes, setNodes, setEdges]);
  
  const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {

    if (!edgeReconnectSuccessful.current) {

      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      
      // Also update the target node's parents array
      setNodes((nds) => nds.map((node) => {
        if (node.id === edge.target) {
          const parents = node.data.moment.parents || [];
          return {
            ...node,
            data: {
              ...node.data,
              moment: {
                ...node.data.moment,
                parents: parents.filter(p => p !== edge.source)
              }
            }
          };
        }
        return node;
      }));
    }
    edgeReconnectSuccessful.current = true;
  }, [setEdges, setNodes]);
  
  // Node deletion handler for ReactFlow's built-in deletion
  const onNodesDelete = useCallback(
    (deletedNodes: MomentGraphNode[]) => {

      // Remove any edges connected to deleted nodes
      setEdges((eds) => eds.filter(edge => 
        !deletedNodes.some(node => 
          node.id === edge.source || node.id === edge.target
        )
      ));
      
      // Update parent references for all remaining nodes
      setNodes((nds) => nds.map(node => {
        const nodeParents = node.data.moment.parents || [];
        const updatedParents = nodeParents.filter(parentId => 
          !deletedNodes.some(deletedNode => deletedNode.id === parentId)
        );
        
        if (updatedParents.length !== nodeParents.length) {
          return {
            ...node,
            data: {
              ...node.data,
              moment: {
                ...node.data.moment,
                parents: updatedParents
              }
            }
          };
        }
        return node;
      }));
    },
    [setEdges, setNodes]
  );

  // Edge deletion handler
  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {

      // Update parents array for target nodes
      setNodes(nodes => nodes.map(node => {
        const deletedSources = deletedEdges
          .filter(edge => edge.target === node.id)
          .map(edge => edge.source);
        
        if (deletedSources.length > 0) {
          const currentParents = node.data.moment.parents || [];
          const newParents = currentParents.filter(p => !deletedSources.includes(p));
          return {
            ...node,
            data: {
              ...node.data,
              moment: {
                ...node.data.moment,
                parents: newParents
              }
            }
          };
        }
        return node;
      }));
    },
    [setNodes]
  );

  const synchronizeParentsWithEdges = useCallback(() => {
    const snapshot = serializeGraph({ nodes, edges });
    return snapshot.nodes.map(node => ({ ...node, data: { ...node.data,
      onDelete: handleDeleteNode, onUpdateDescription: handleUpdateDescription,
    }}));
  }, [nodes, edges, handleDeleteNode, handleUpdateDescription]);

  const handleSave = () => {
    const snapshot = serializeGraph({ nodes, edges });
    onGraph(snapshot);
    try {
      localStorage.setItem('craft-demo-plot-v1', JSON.stringify(snapshot));
      setStatus('Plot saved in this browser.');
    } catch {
      setStatus('Plot kept for this session. Browser storage is unavailable.');
    }
  };
  const handleClose = () => {
    onGraph(serializeGraph({ nodes, edges }));
    onClose?.();
  };

  // Reset layout
  const handleResetLayout = () => {
    const { nodes: resetNodes } = getInitialNodesAndEdges(
      { ...data, moments: synchronizeParentsWithEdges().map(node => node.data.moment) }, 
      handleDeleteNode, 
      handleUpdateDescription
    );
    setNodes(current => current.map(node => ({ ...node, position: resetNodes.find(reset => reset.id === node.id)?.position ?? node.position })));
    setUndoDelete(null);
    setStatus('Layout reset.');
  };

  const nodeTypes = useMemo(() => ({ momentNode: MomentNode }), []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!compact || !canvas) return;
    let width = canvas.clientWidth;
    const observer = new ResizeObserver(() => {
      if (Math.abs(canvas.clientWidth - width) < 1) return;
      width = canvas.clientWidth;
      void flowRef.current?.fitView({ minZoom: 0.5, maxZoom: 1, padding: 0.16 });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [compact]);

  const selectMoment = (_: React.MouseEvent, node: MomentGraphNode) => {
    setSelectedNodeId(node.id); setSelectedEdgeId(null);
    if (!connecting) return;
    if (!connectionSource) {
      setConnectionSource(node.id); setStatus(`Moment ${node.id} selected. Tap the next moment.`); return;
    }
    if (node.id === connectionSource) { setStatus('Choose a different moment.'); return; }
    if (edges.some(edge => edge.source === connectionSource && edge.target === node.id)) { setStatus('These moments are already connected. Choose another moment.'); return; }
    onConnect({ source: connectionSource, target: node.id, sourceHandle: `${connectionSource}-source`, targetHandle: `${node.id}-target` });
    setConnecting(false); setConnectionSource(null); setStatus('Connection added. Save to update the plot.');
  };
  const toggleConnect = () => {
    if (connecting) {
      setConnecting(false);
      setConnectionSource(null);
      setStatus('');
      return;
    }
    const source = selectedNode?.id ?? null;
    setConnecting(true);
    setConnectionSource(source);
    setStatus(source ? `Moment ${source} is the start. Tap the next moment.` : 'Tap the starting moment, then the next moment.');
  };
  const deleteSelected = () => {
    if (!selectedNode && !selectedEdge) return;
    setUndoDelete({ nodes, edges });
    if (selectedNode) { handleDeleteNode(selectedNode.id); onNodesDelete([selectedNode]); }
    else if (selectedEdge) { setEdges(current => current.filter(edge => edge.id !== selectedEdge.id)); onEdgesDelete([selectedEdge]); }
    setSelectedNodeId(null); setSelectedEdgeId(null); setStatus('Deleted. Save to update the plot.');
  };

  const displayedNodes = demo ? nodes.map(node => {
    const prepared = demo.plotGraph.nodes.find(item => item.id === node.id);
    return { ...node, position: prepared?.position ?? node.position, selected: node.id === demo.nodeId,
      data: { ...node.data, moment: prepared?.data.moment ?? node.data.moment,
        demoEditing: node.id === demo.nodeId && demo.editing,
        demoDescription: node.id === demo.nodeId && demo.editing ? demo.description : undefined,
      },
    };
  }) : nodes;
  const editor = (
    <div ref={viewportRef} inert={demo ? true : undefined} className={compact ? 'craft-plot-touch' : `cv-plot craft-plot-desktop ${demo ? 'craft-plot-demo' : ''}`}
      onClick={event => event.stopPropagation()}
      style={compact ? undefined : { width: '100%', height: 'calc(825px * 0.8)', background: 'transparent' }}>
      <div className="craft-plot-toolbar" style={{ display: 'flex', gap: '8px', marginBottom: compact ? 0 : '16px', flexWrap: 'wrap' }}>
        {compact && <strong className="craft-plot-title">Plot</strong>}
        <Button
          variant="contained"
          color="success"
          onClick={handleSave}
          data-demo="plot-save"
          className={demo?.pressing && demo.target === "plot-save" ? "cv-demo-click" : undefined}
          disabled={isProcessing}
        >
          {demo?.plotSaved ? 'Saved ✓' : compact ? 'Save plot' : 'Save Plot Connections'}
        </Button>
        {!compact && <Button
          variant="outlined"
          onClick={handleResetLayout}
          sx={{ color: '#aaa', borderColor: '#666' }}
        >
          Reset Layout
        </Button>}
        {onClose && <Button data-demo="plot-close" className={demo?.pressing && demo.target === "plot-close" ? "cv-demo-click" : undefined} onClick={handleClose} sx={{ color: '#60a5fa' }}>Close</Button>}
      </div>
      {compact && <div className="craft-plot-actions">
        <Button disabled={!selectedNode || connecting || isProcessing} startIcon={<Edit2 size={18} />} onClick={() => selectedNode && setEditing({ id: selectedNode.id, description: selectedNode.data.moment.description })}>Edit</Button>
        <Button disabled={isProcessing} aria-pressed={connecting} startIcon={<Link2 size={18} />} onClick={toggleConnect}>{connecting ? 'Cancel' : 'Connect'}</Button>
        <Button disabled={(!selectedNode && !selectedEdge) || connecting || isProcessing} startIcon={<Trash2 size={18} />} onClick={deleteSelected}>Delete</Button>
        <Button disabled={isProcessing} onClick={handleResetLayout}>Reset layout</Button>
      </div>}

      <div ref={canvasRef} className="craft-flow-canvas" style={{ 
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <ReactFlow
          onInit={instance => { flowRef.current = instance; }}
          onViewportChange={viewport => setZoom(viewport.zoom)}
          nodes={displayedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={compact ? selectMoment : undefined}
          onEdgeClick={compact ? (_, edge) => { if (!connecting) { setSelectedEdgeId(edge.id); setSelectedNodeId(null); setStatus(`Connection ${edge.source} → ${edge.target} selected.`); } } : undefined}
          onPaneClick={compact ? () => { if (!connecting) { setSelectedNodeId(null); setSelectedEdgeId(null); } } : undefined}
          onSelectionChange={compact ? ({ nodes: selectedNodes, edges: selectedEdges }) => { setSelectedNodeId(selectedNodes[0]?.id ?? null); setSelectedEdgeId(selectedEdges[0]?.id ?? null); } : undefined}
          defaultEdgeOptions={{ interactionWidth: compact ? 44 / Math.max(zoom, 0.1) : 20 }}
          edgesReconnectable={!compact}
          nodeDragThreshold={compact ? 8 : 1}
          onNodeDragStop={() => setUndoDelete(null)}
          fitViewOptions={{ minZoom: compact ? 0.5 : 0.1, maxZoom: 1 }}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onReconnect={onReconnect}
          onReconnectStart={onReconnectStart}
          onReconnectEnd={onReconnectEnd}
          fitView
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          nodesDraggable={!demo}
          nodesConnectable={!compact && !demo}
          elementsSelectable={!demo}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#222" gap={16} />
          {compact && <Controls showInteractive={false} />} 
          
          <details className="craft-plot-legend" open={compact ? undefined : true}
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              padding: 12,
              borderRadius: 12,
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#aaa',
              fontSize: 14,
              maxWidth: 300
            }}
          >
            <summary style={{ marginBottom: 8, fontWeight: 'bold' }}>Legend</summary>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, backgroundColor: '#4CAF50', marginRight: 6 }}></div>
              <span>High Relevance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, backgroundColor: '#1A472A', marginRight: 6 }}></div>
              <span>Low Relevance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ width: 24, height: 2, borderTop: '2px solid #4CAF50', marginRight: 6 }}></div>
              <span>High Detail</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 24, height: 2, borderTop: '2px dashed #4CAF50', marginRight: 6 }}></div>
              <span>Low Detail</span>
            </div>

          </details>
        </ReactFlow>
      </div>
      <div className="craft-plot-status" role="status">
        {status || (compact ? 'Tap to select · Drag to move · Pinch to zoom' : '')}
        {compact && undoDelete && <Button onClick={() => { setNodes(undoDelete.nodes); setEdges(undoDelete.edges); setUndoDelete(null); setStatus('Deletion undone.'); }}>Undo delete</Button>}
      </div>
      {compact && editing && <div className="craft-plot-edit" role="dialog" aria-modal="true" aria-label="Edit moment">
        <header><strong>Moment {editing.id}</strong><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" color="success" onClick={() => { handleUpdateDescription(editing.id, editing.description); setEditing(null); setStatus('Description updated. Save to update the plot.'); }}>Apply</Button></header>
        <label htmlFor="craft-moment-description">Description</label>
        <textarea id="craft-moment-description" autoFocus value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} />
      </div>}
    </div>
  );
  return compact ? createPortal(editor, document.body) : editor;
};

export default PlotDemonstration;