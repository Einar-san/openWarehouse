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

export function ZoneNode({ node, isSelected, gridSize, onSelect, onUpdate, onDblClick, readOnly }: Props) {
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
          fill={node.color ?? 'rgba(100, 200, 100, 0.15)'}
          stroke={isSelected ? '#0066ff' : '#aaa'}
          strokeWidth={isSelected ? 2 : 1}
          dash={[8, 8]}
          cornerRadius={12}
        />
        {node.label && (
          <Text
            width={node.width}
            height={node.height}
            text={node.label}
            fontFamily="Georgia"
            fontStyle="italic"
            fontSize={13}
            fill="#555"
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
