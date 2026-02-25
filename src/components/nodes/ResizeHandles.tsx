import { Rect } from 'react-konva';
import type Konva from 'konva';
import { snapToGrid } from '../../utils/grid';

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  gridSize: number;
  cornersOnly?: boolean;
  onResize: (newBounds: { x: number; y: number; width: number; height: number }) => void;
}

type HandlePosition = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br';

const HANDLE_SIZE = 8;

function getHandlePositions(
  x: number,
  y: number,
  w: number,
  h: number,
  cornersOnly: boolean
): { pos: HandlePosition; hx: number; hy: number }[] {
  const half = HANDLE_SIZE / 2;
  const handles: { pos: HandlePosition; hx: number; hy: number }[] = [
    { pos: 'tl', hx: x - half, hy: y - half },
    { pos: 'tr', hx: x + w - half, hy: y - half },
    { pos: 'bl', hx: x - half, hy: y + h - half },
    { pos: 'br', hx: x + w - half, hy: y + h - half },
  ];
  if (!cornersOnly) {
    handles.push(
      { pos: 'tc', hx: x + w / 2 - half, hy: y - half },
      { pos: 'bc', hx: x + w / 2 - half, hy: y + h - half },
      { pos: 'ml', hx: x - half, hy: y + h / 2 - half },
      { pos: 'mr', hx: x + w - half, hy: y + h / 2 - half }
    );
  }
  return handles;
}

function getCursor(pos: HandlePosition): string {
  switch (pos) {
    case 'tl':
    case 'br':
      return 'nwse-resize';
    case 'tr':
    case 'bl':
      return 'nesw-resize';
    case 'tc':
    case 'bc':
      return 'ns-resize';
    case 'ml':
    case 'mr':
      return 'ew-resize';
  }
}

export function ResizeHandles({ x, y, width, height, gridSize, cornersOnly = false, onResize }: Props) {
  const minSize = gridSize;

  const handleDragMove = (pos: HandlePosition, e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target;
    const dx = snapToGrid(target.x() + HANDLE_SIZE / 2, gridSize);
    const dy = snapToGrid(target.y() + HANDLE_SIZE / 2, gridSize);

    let nx = x, ny = y, nw = width, nh = height;

    // Horizontal
    if (pos === 'tl' || pos === 'ml' || pos === 'bl') {
      const newX = Math.min(dx, x + width - minSize);
      nw = width + (x - newX);
      nx = newX;
    }
    if (pos === 'tr' || pos === 'mr' || pos === 'br') {
      nw = Math.max(dx - x, minSize);
    }

    // Vertical
    if (pos === 'tl' || pos === 'tc' || pos === 'tr') {
      const newY = Math.min(dy, y + height - minSize);
      nh = height + (y - newY);
      ny = newY;
    }
    if (pos === 'bl' || pos === 'bc' || pos === 'br') {
      nh = Math.max(dy - y, minSize);
    }

    // For mid-edge handles, don't change the other axis
    if (pos === 'tc' || pos === 'bc') { nx = x; nw = width; }
    if (pos === 'ml' || pos === 'mr') { ny = y; nh = height; }

    nw = Math.max(nw, minSize);
    nh = Math.max(nh, minSize);

    onResize({ x: nx, y: ny, width: nw, height: nh });
  };

  const handles = getHandlePositions(x, y, width, height, cornersOnly);

  return (
    <>
      {handles.map(({ pos, hx, hy }) => (
        <Rect
          key={pos}
          x={hx}
          y={hy}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="white"
          stroke="#0066ff"
          strokeWidth={1}
          draggable
          onDragMove={(e) => handleDragMove(pos, e)}
          onDragEnd={(e) => {
            // Reset handle position — the parent will re-render with updated bounds
            e.target.position({ x: hx, y: hy });
          }}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = getCursor(pos);
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
          }}
        />
      ))}
    </>
  );
}
