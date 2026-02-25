export type NodeType = 'building' | 'rack' | 'zone' | 'station' | 'obstacle';

export type ToolType = 'select' | 'addRack' | 'addZone' | 'addStation' | 'addObstacle' | 'addArrow';

export interface WarehouseNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  color?: string;
  locked?: boolean;
}

export interface WarehouseLink {
  id: string;
  points: [number, number][];
  label?: string;
  animated?: boolean;
}

export interface WarehouseData {
  nodes: WarehouseNode[];
  links: WarehouseLink[];
}
