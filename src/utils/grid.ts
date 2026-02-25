export const snapToGrid = (value: number, gridSize: number): number =>
  Math.round(value / gridSize) * gridSize;

export const snapPointToGrid = (x: number, y: number, gridSize: number) => ({
  x: snapToGrid(x, gridSize),
  y: snapToGrid(y, gridSize),
});
