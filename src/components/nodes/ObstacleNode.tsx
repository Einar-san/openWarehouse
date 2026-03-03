import { Rect } from 'react-konva';
import type { WarehouseNode } from '../../types';
import { DraggableNode } from './DraggableNode';

interface Props {
  node: WarehouseNode;
  isSelected: boolean;
  gridSize: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WarehouseNode>) => void;
  readOnly: boolean;
}

export function ObstacleNode({ node, isSelected, gridSize, onSelect, onUpdate, readOnly }: Props) {
  return (
    <DraggableNode
      node={node}
      isSelected={isSelected}
      gridSize={gridSize}
      onSelect={onSelect}
      onUpdate={onUpdate}
      readOnly={readOnly}
      cornersOnly
    >
      <Rect
        width={node.width}
        height={node.height}
        fill={node.color ?? '#444'}
        stroke={isSelected ? '#0066ff' : '#222'}
        strokeWidth={isSelected ? 2 : 1}
      />
    </DraggableNode>
  );
}
