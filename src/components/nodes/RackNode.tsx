import { Rect, Text } from 'react-konva';
import type { WarehouseNode } from '../../types';
import { DraggableNode } from './DraggableNode';

interface Props {
  node: WarehouseNode;
  isSelected: boolean;
  gridSize: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WarehouseNode>) => void;
  onDblClick: (node: WarehouseNode) => void;
  readOnly: boolean;
}

export function RackNode({ node, isSelected, gridSize, onSelect, onUpdate, onDblClick, readOnly }: Props) {
  return (
    <DraggableNode
      node={node}
      isSelected={isSelected}
      gridSize={gridSize}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDblClick={onDblClick}
      readOnly={readOnly}
    >
      <Rect
        width={node.width}
        height={node.height}
        fill={node.color ?? 'lightblue'}
        opacity={0.85}
        stroke={isSelected ? '#0066ff' : '#999'}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={2}
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
    </DraggableNode>
  );
}
