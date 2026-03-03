import React from 'react';
import { Group } from 'react-konva';
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
  onDblClick?: (node: WarehouseNode) => void;
  readOnly: boolean;
  cornersOnly?: boolean;
  children: React.ReactNode;
}

export function DraggableNode({
  node,
  isSelected,
  gridSize,
  onSelect,
  onUpdate,
  onDblClick,
  readOnly,
  cornersOnly = false,
  children,
}: Props) {
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
        onDblClick={() => !readOnly && onDblClick?.(node)}
        onDblTap={() => !readOnly && onDblClick?.(node)}
      >
        {children}
      </Group>
      {isSelected && !readOnly && (
        <ResizeHandles
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          gridSize={gridSize}
          cornersOnly={cornersOnly}
          onResize={handleResize}
        />
      )}
    </Group>
  );
}
