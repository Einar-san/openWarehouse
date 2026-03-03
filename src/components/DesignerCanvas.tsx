import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Line, Group } from 'react-konva';
import type Konva from 'konva';
import type { WarehouseNode, WarehouseLink, ToolType } from '../types';
import { useWarehouseStore, useWarehouseStoreApi } from '../store/useStore';
import { snapToGrid } from '../utils/grid';
import { BuildingNode } from './nodes/BuildingNode';
import { RackNode } from './nodes/RackNode';
import { ZoneNode } from './nodes/ZoneNode';
import { StationNode } from './nodes/StationNode';
import { ObstacleNode } from './nodes/ObstacleNode';
import { LinkLayer } from './LinkLayer';

interface Props {
  width: number;
  height: number;
  gridSize: number;
  readOnly: boolean;
}

const Z_ORDER: Record<string, number> = {
  building: 0,
  obstacle: 1,
  zone: 2,
  rack: 3,
  station: 4,
};

interface GridLayerProps {
  viewportWidth: number;
  viewportHeight: number;
  gridSize: number;
  stageX: number;
  stageY: number;
  stageScale: number;
}

function GridLayer({ viewportWidth, viewportHeight, gridSize, stageX, stageY, stageScale }: GridLayerProps) {
  const lines = useMemo(() => {
    // Calculate visible area in world coordinates with a one-cell buffer
    const x0 = Math.floor(-stageX / stageScale / gridSize - 1) * gridSize;
    const y0 = Math.floor(-stageY / stageScale / gridSize - 1) * gridSize;
    const x1 = Math.ceil((-stageX + viewportWidth) / stageScale / gridSize + 1) * gridSize;
    const y1 = Math.ceil((-stageY + viewportHeight) / stageScale / gridSize + 1) * gridSize;

    const vLines: { x: number; isMain: boolean }[] = [];
    for (let x = x0; x <= x1; x += gridSize) {
      vLines.push({ x, isMain: x % (gridSize * 5) === 0 });
    }
    const hLines: { y: number; isMain: boolean }[] = [];
    for (let y = y0; y <= y1; y += gridSize) {
      hLines.push({ y, isMain: y % (gridSize * 5) === 0 });
    }
    return { vLines, hLines, y0, y1, x0, x1 };
  }, [viewportWidth, viewportHeight, gridSize, stageX, stageY, stageScale]);

  return (
    <Group>
      {lines.vLines.map((line, i) => (
        <Line
          key={`v${i}`}
          points={[line.x, lines.y0, line.x, lines.y1]}
          stroke={line.isMain ? '#ccc' : '#eee'}
          strokeWidth={line.isMain ? 1 : 0.5}
          listening={false}
        />
      ))}
      {lines.hLines.map((line, i) => (
        <Line
          key={`h${i}`}
          points={[lines.x0, line.y, lines.x1, line.y]}
          stroke={line.isMain ? '#ccc' : '#eee'}
          strokeWidth={line.isMain ? 1 : 0.5}
          listening={false}
        />
      ))}
    </Group>
  );
}

const TOOL_TO_NODE_TYPE: Partial<Record<ToolType, WarehouseNode['type']>> = {
  addRack: 'rack',
  addZone: 'zone',
  addStation: 'station',
  addObstacle: 'obstacle',
};

const DEFAULT_NODE_SIZES: Record<string, { width: number; height: number }> = {
  rack: { width: 120, height: 60 },
  zone: { width: 140, height: 100 },
  station: { width: 100, height: 60 },
  obstacle: { width: 20, height: 20 },
};

const DEFAULT_NODE_LABELS: Record<string, string> = {
  rack: 'New Rack',
  zone: 'New Zone',
  station: 'New Station',
};

export function DesignerCanvas({ width, height, gridSize, readOnly }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const nodes = useWarehouseStore((s) => s.nodes);
  const links = useWarehouseStore((s) => s.links);
  const selectedId = useWarehouseStore((s) => s.selectedId);
  const tool = useWarehouseStore((s) => s.tool);
  const storeApi = useWarehouseStoreApi();

  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [arrowStart, setArrowStart] = useState<[number, number] | null>(null);

  // Inline rename overlay
  const [editingNode, setEditingNode] = useState<WarehouseNode | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => (Z_ORDER[a.type] ?? 0) - (Z_ORDER[b.type] ?? 0));
  }, [nodes]);

  const handleSelect = useCallback(
    (id: string) => {
      if (!readOnly) storeApi.getState().setSelected(id);
    },
    [readOnly, storeApi]
  );

  const handleUpdateNode = useCallback(
    (id: string, updates: Partial<WarehouseNode>) => {
      storeApi.getState().updateNode(id, updates);
    },
    [storeApi]
  );

  const handleUpdateLink = useCallback(
    (id: string, updates: Partial<WarehouseLink>) => {
      storeApi.getState().updateLink(id, updates);
    },
    [storeApi]
  );

  const handleDblClick = useCallback((node: WarehouseNode) => {
    setEditingNode(node);
    setEditLabel(node.label ?? '');
  }, []);

  const handleRenameConfirm = useCallback(() => {
    if (editingNode) {
      storeApi.getState().updateNode(editingNode.id, { label: editLabel });
      setEditingNode(null);
    }
  }, [editingNode, editLabel, storeApi]);

  const getPointerPos = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale,
    };
  }, [stagePos, stageScale]);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only handle clicks on empty stage area
      if (e.target !== e.target.getStage()) return;

      if (readOnly) return;

      const state = storeApi.getState();

      // Tool-based creation
      const nodeType = TOOL_TO_NODE_TYPE[state.tool];
      if (nodeType) {
        const pos = getPointerPos();
        if (!pos) return;
        const size = DEFAULT_NODE_SIZES[nodeType];
        state.addNode({
          type: nodeType,
          x: snapToGrid(pos.x - size.width / 2, gridSize),
          y: snapToGrid(pos.y - size.height / 2, gridSize),
          width: size.width,
          height: size.height,
          label: DEFAULT_NODE_LABELS[nodeType],
          color: nodeType === 'rack' ? 'lightblue' : nodeType === 'station' ? '#f7d679' : undefined,
        });
        state.setTool('select');
        return;
      }

      // Arrow creation tool
      if (state.tool === 'addArrow') {
        const pos = getPointerPos();
        if (!pos) return;
        const snappedX = snapToGrid(pos.x, gridSize);
        const snappedY = snapToGrid(pos.y, gridSize);

        if (!arrowStart) {
          setArrowStart([snappedX, snappedY]);
        } else {
          state.addLink({
            points: [arrowStart, [snappedX, snappedY]],
            label: 'path',
          });
          setArrowStart(null);
          state.setTool('select');
        }
        return;
      }

      // Deselect
      state.setSelected(null);
    },
    [readOnly, storeApi, getPointerPos, gridSize, arrowStart]
  );

  // Pan & zoom handlers
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.08;
      const newScale =
        e.evt.deltaY < 0
          ? Math.min(oldScale * scaleBy, 3.0)
          : Math.max(oldScale / scaleBy, 0.1);

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      setStageScale(newScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [stageScale, stagePos]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (spaceDown && e.evt.button === 0) {
        setIsPanning(true);
      }
    },
    [spaceDown]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanning) {
        setStagePos((prev) => ({
          x: prev.x + e.evt.movementX,
          y: prev.y + e.evt.movementY,
        }));
      }
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Keyboard events for space (pan mode)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) {
      setSpaceDown(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setSpaceDown(false);
      setIsPanning(false);
    }
  }, []);

  // Attach keyboard listeners for space (pan mode)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const cursor = isPanning ? 'grabbing' : spaceDown ? 'grab' : tool !== 'select' ? 'crosshair' : 'default';

  const renderNode = (node: WarehouseNode) => {
    const isSelected = node.id === selectedId;
    switch (node.type) {
      case 'building':
        return <BuildingNode key={node.id} node={node} />;
      case 'rack':
        return (
          <RackNode
            key={node.id}
            node={node}
            isSelected={isSelected}
            gridSize={gridSize}
            onSelect={handleSelect}
            onUpdate={handleUpdateNode}
            onDblClick={handleDblClick}
            readOnly={readOnly}
          />
        );
      case 'zone':
        return (
          <ZoneNode
            key={node.id}
            node={node}
            isSelected={isSelected}
            gridSize={gridSize}
            onSelect={handleSelect}
            onUpdate={handleUpdateNode}
            onDblClick={handleDblClick}
            readOnly={readOnly}
          />
        );
      case 'station':
        return (
          <StationNode
            key={node.id}
            node={node}
            isSelected={isSelected}
            gridSize={gridSize}
            onSelect={handleSelect}
            onUpdate={handleUpdateNode}
            onDblClick={handleDblClick}
            readOnly={readOnly}
          />
        );
      case 'obstacle':
        return (
          <ObstacleNode
            key={node.id}
            node={node}
            isSelected={isSelected}
            gridSize={gridSize}
            onSelect={handleSelect}
            onUpdate={handleUpdateNode}
            readOnly={readOnly}
          />
        );
    }
  };

  return (
    <div style={{ position: 'relative', cursor }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Layer 0: Grid */}
        <Layer listening={false}>
          <GridLayer
            viewportWidth={width}
            viewportHeight={height}
            gridSize={gridSize}
            stageX={stagePos.x}
            stageY={stagePos.y}
            stageScale={stageScale}
          />
        </Layer>
        {/* Layer 1: Content */}
        <Layer>
          {sortedNodes.map(renderNode)}
          <LinkLayer
            links={links}
            selectedId={selectedId}
            gridSize={gridSize}
            readOnly={readOnly}
            onSelect={handleSelect}
            onUpdateLink={handleUpdateLink}
          />
        </Layer>
      </Stage>
      {/* Inline rename overlay */}
      {editingNode && (
        <div
          style={{
            position: 'absolute',
            left: editingNode.x * stageScale + stagePos.x,
            top: editingNode.y * stageScale + stagePos.y,
            zIndex: 1000,
          }}
        >
          <input
            autoFocus
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameConfirm();
              if (e.key === 'Escape') setEditingNode(null);
            }}
            onBlur={handleRenameConfirm}
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              padding: '2px 6px',
              border: '2px solid #0066ff',
              borderRadius: 3,
              outline: 'none',
              width: editingNode.width * stageScale,
            }}
          />
        </div>
      )}
    </div>
  );
}
