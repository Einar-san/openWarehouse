import { Group, Line, RegularPolygon, Circle, Label, Tag, Text } from 'react-konva';
import type Konva from 'konva';
import type { WarehouseLink } from '../types';
import { snapToGrid } from '../utils/grid';

interface Props {
  links: WarehouseLink[];
  selectedId: string | null;
  gridSize: number;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onUpdateLink: (id: string, updates: Partial<WarehouseLink>) => void;
}

function getArrowRotation(points: [number, number][]): number {
  if (points.length < 2) return 0;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  return (Math.atan2(last[1] - prev[1], last[0] - prev[0]) * 180) / Math.PI + 90;
}

function getMidpoint(points: [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  const midIdx = Math.floor((points.length - 1) / 2);
  const a = points[midIdx];
  const b = points[midIdx + 1];
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function LinkLayer({ links, selectedId, gridSize, readOnly, onSelect, onUpdateLink }: Props) {
  const handleWaypointDragEnd = (
    link: WarehouseLink,
    waypointIndex: number,
    e: Konva.KonvaEventObject<DragEvent>
  ) => {
    const target = e.target;
    const newPoints = link.points.map((p, i) =>
      i === waypointIndex
        ? [snapToGrid(target.x(), gridSize), snapToGrid(target.y(), gridSize)] as [number, number]
        : p
    );
    onUpdateLink(link.id, { points: newPoints });
  };

  return (
    <>
      {links.map((link) => {
        const isSelected = link.id === selectedId;
        const flatPoints = link.points.flatMap(([x, y]) => [x, y]);
        const lastPoint = link.points[link.points.length - 1];
        const rotation = getArrowRotation(link.points);
        const mid = getMidpoint(link.points);

        return (
          <Group key={link.id} onClick={() => onSelect(link.id)}>
            {/* Invisible wider hit area */}
            <Line
              points={flatPoints}
              stroke="transparent"
              strokeWidth={14}
              hitStrokeWidth={14}
            />
            {/* Visible line */}
            <Line
              points={flatPoints}
              stroke={isSelected ? '#0066ff' : '#555'}
              strokeWidth={3}
              dash={[12, 8]}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
            {/* Arrowhead */}
            {link.points.length >= 2 && (
              <RegularPolygon
                x={lastPoint[0]}
                y={lastPoint[1]}
                sides={3}
                radius={8}
                fill={isSelected ? '#0066ff' : '#555'}
                rotation={rotation}
                listening={false}
              />
            )}
            {/* Label badge */}
            {link.label && (
              <Label x={mid[0]} y={mid[1]} offsetX={0} offsetY={10} listening={false}>
                <Tag
                  fill="#f8f8f8"
                  stroke="#ccc"
                  strokeWidth={1}
                  cornerRadius={4}
                  pointerDirection="none"
                />
                <Text
                  text={link.label}
                  fontSize={11}
                  fill="#333"
                  padding={4}
                />
              </Label>
            )}
            {/* Draggable waypoint handles when selected */}
            {isSelected && !readOnly &&
              link.points.map(([px, py], i) => (
                <Circle
                  key={`${link.id}-wp${i}`}
                  x={px}
                  y={py}
                  radius={6}
                  fill="#0066ff"
                  stroke="white"
                  strokeWidth={2}
                  draggable
                  onDragEnd={(e) => handleWaypointDragEnd(link, i, e)}
                />
              ))}
          </Group>
        );
      })}
    </>
  );
}
