import { Group, Rect, Text } from 'react-konva';
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
  onDblClick: (node: WarehouseNode) => void;
  readOnly: boolean;
}

export function StationNode({ node, isSelected, gridSize, onSelect, onUpdate, onDblClick, readOnly }: Props) {
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
      <Group
        x={node.x}
        y={node.y}
        draggable={draggable}
        onClick={() => onSelect(node.id)}
        onTap={() => onSelect(node.id)}
        onDragEnd={handleDragEnd}
        onDragStart={() => onSelect(node.id)}
        onDblClick={() => !readOnly && onDblClick(node)}
        onDblTap={() => !readOnly && onDblClick(node)}
      >
        <Rect
          width={node.width}
          height={node.height}
          fill={node.color ?? '#f7d679'}
          stroke={isSelected ? '#0066ff' : '#b89b3e'}
          strokeWidth={isSelected ? 2 : 1}
        />
        {node.label && (
          <Text
            width={node.width}
            height={node.height}
            text={node.label}
            fontStyle="italic"
            fontSize={13}
            fill="#333"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        )}
      </Group>
      {isSelected && !readOnly && (
        <ResizeHandles
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          gridSize={gridSize}
          onResize={handleResize}
        />
      )}
    </Group>
  );
}
