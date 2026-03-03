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

export function ZoneNode({ node, isSelected, gridSize, onSelect, onUpdate, onDblClick, readOnly }: Props) {
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
    </DraggableNode>
  );
}
