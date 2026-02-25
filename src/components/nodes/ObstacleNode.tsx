import { Group, Rect } from 'react-konva';
import type Konva from 'konva';
import type { WarehouseNode } from '../../types';
import { snapToGrid } from '../../utils/grid';
import { ResizeHandles } from './ResizeHandles';

interface Props {
  node: WarehouseNode;
  isSelected: boolean;
  gridSize: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WarehouseNode>) => void;
  readOnly: boolean;
}

export function ObstacleNode({ node, isSelected, gridSize, onSelect, onUpdate, readOnly }: Props) {
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target;
    onUpdate(node.id, {
      x: snapToGrid(target.x(), gridSize),
      y: snapToGrid(target.y(), gridSize),
    });
  };

  const handleResize = (bounds: { x: number; y: number; width: number; height: number }) => {
    onUpdate(node.id, bounds);
  };

  const draggable = !readOnly && !node.locked;

  return (
    <Group>
      <Rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        fill={node.color ?? '#444'}
        stroke={isSelected ? '#0066ff' : '#222'}
        strokeWidth={isSelected ? 2 : 1}
        draggable={draggable}
        onClick={() => onSelect(node.id)}
        onTap={() => onSelect(node.id)}
        onDragEnd={handleDragEnd}
        onDragStart={() => onSelect(node.id)}
      />
      {isSelected && !readOnly && (
        <ResizeHandles
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          gridSize={gridSize}
          cornersOnly
          onResize={handleResize}
        />
      )}
    </Group>
  );
}
