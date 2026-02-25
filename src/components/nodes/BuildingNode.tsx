import { Rect } from 'react-konva';
import type { WarehouseNode } from '../../types';

interface Props {
  node: WarehouseNode;
}

export function BuildingNode({ node }: Props) {
  return (
    <Rect
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
      fill="rgba(0,0,0,0.05)"
      stroke="black"
      strokeWidth={2}
      listening={false}
    />
  );
}
