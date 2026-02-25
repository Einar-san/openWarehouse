# openWarehouse

An open-source, interactive warehouse floor-plan editor for React. Built on HTML5 Canvas via [react-konva](https://github.com/konvajs/react-konva), with lightweight state management powered by [zustand](https://github.com/pmndrs/zustand) + [immer](https://github.com/immerjs/immer).

Drop the `<WarehouseDesigner>` component into any React 18+ app to get a fully interactive warehouse layout editor — complete with drag-and-drop, grid snapping, undo/redo, pan & zoom, and JSON/PNG export.

---

## Features

- **Visual node types** — Buildings, racks, zones, stations, and obstacles, each with distinct styling
- **Directional links** — Dashed arrows with labels and draggable waypoints to represent picking paths, routes, and flows
- **Drag & drop** — Move any node with automatic grid snapping
- **Resize handles** — 8-handle (or 4-corner) resize with minimum size enforcement
- **Inline rename** — Double-click any rack, zone, or station to edit its label
- **Pan & zoom** — Hold `Space` + drag to pan; mousewheel to zoom (0.1x – 3.0x)
- **Tool system** — Toolbar to add racks, zones, stations, obstacles, or draw arrows by clicking the canvas
- **Undo / Redo** — Full snapshot-based history (up to 50 states), with `Ctrl+Z` / `Ctrl+Y` shortcuts
- **Export / Import** — Save and load layouts as JSON; export the canvas as a high-res PNG
- **Read-only mode** — Disable all editing with a single prop
- **Multiple instances** — Each `<WarehouseDesigner>` creates its own isolated store via React context
- **TypeScript** — Full type definitions included out of the box
- **Lightweight** — No heavy diagram framework; uses only MIT-licensed, actively maintained dependencies

---

## Installation

```bash
npm install open-warehouse
```

**Peer dependencies** — you must have React 18+ in your project:

```bash
npm install react react-dom
```

---

## Quick Start

```tsx
import { WarehouseDesigner, defaultWarehouseData } from 'open-warehouse';

export default function App() {
  return (
    <WarehouseDesigner
      initialData={defaultWarehouseData}
      height={700}
      gridSize={20}
      onChange={(data) => console.log('layout changed', data)}
    />
  );
}
```

This renders a full warehouse editor pre-loaded with a sample layout containing racks, zones, stations, obstacles, and picking-path arrows.

---

## API Reference

### `<WarehouseDesigner>`

The main component. All props are optional.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialData` | `WarehouseData` | `undefined` | Pre-loaded diagram state. If omitted, the canvas starts empty. |
| `onChange` | `(data: WarehouseData) => void` | `undefined` | Callback fired on every state change (node move, resize, add, delete, etc.). |
| `width` | `number \| string` | `'100%'` | Container width. Accepts CSS values or pixel numbers. |
| `height` | `number \| string` | `600` | Container height. Accepts CSS values or pixel numbers. |
| `gridSize` | `number` | `20` | Grid cell size in pixels. All positions and sizes snap to this grid. |
| `readOnly` | `boolean` | `false` | When `true`, hides the toolbar and disables all editing interactions. |
| `style` | `React.CSSProperties` | `undefined` | Additional inline styles for the outer container. |
| `className` | `string` | `undefined` | CSS class name for the outer container. |

---

### Types

```ts
type NodeType = 'building' | 'rack' | 'zone' | 'station' | 'obstacle';

type ToolType = 'select' | 'addRack' | 'addZone' | 'addStation' | 'addObstacle' | 'addArrow';

interface WarehouseNode {
  id: string;
  type: NodeType;
  x: number;         // grid-snapped X position (px)
  y: number;         // grid-snapped Y position (px)
  width: number;     // grid-snapped width (px)
  height: number;    // grid-snapped height (px)
  label?: string;    // display label (racks, zones, stations)
  color?: string;    // fill color override
  locked?: boolean;  // prevents move and resize
}

interface WarehouseLink {
  id: string;
  points: [number, number][];  // array of [x, y] waypoints
  label?: string;              // label badge displayed at the midpoint
  animated?: boolean;          // reserved for animated dashed arrows
}

interface WarehouseData {
  nodes: WarehouseNode[];
  links: WarehouseLink[];
}
```

---

### `useWarehouseStore(selector)`

A React hook to access the internal zustand store from within a `<WarehouseDesigner>` tree. Useful for building custom UI that reads or mutates the warehouse state.

```tsx
import { useWarehouseStore } from 'open-warehouse';

function NodeCount() {
  const count = useWarehouseStore((state) => state.nodes.length);
  return <span>{count} nodes</span>;
}
```

**Must be called inside a `<WarehouseDesigner>`** — it reads the store from React context.

#### Store state & actions

| Field / Action | Type | Description |
|----------------|------|-------------|
| `nodes` | `WarehouseNode[]` | All nodes in the layout |
| `links` | `WarehouseLink[]` | All links (arrows) in the layout |
| `selectedId` | `string \| null` | ID of the currently selected node or link |
| `tool` | `ToolType` | Currently active tool |
| `addNode(node)` | `(Omit<WarehouseNode, 'id'> & { id?: string }) => void` | Add a new node (auto-generates ID if omitted) |
| `updateNode(id, updates)` | `(string, Partial<WarehouseNode>) => void` | Partially update a node |
| `deleteNode(id)` | `(string) => void` | Remove a node by ID |
| `addLink(link)` | `(Omit<WarehouseLink, 'id'> & { id?: string }) => void` | Add a new link |
| `updateLink(id, updates)` | `(string, Partial<WarehouseLink>) => void` | Partially update a link |
| `deleteLink(id)` | `(string) => void` | Remove a link by ID |
| `setTool(tool)` | `(ToolType) => void` | Switch the active tool |
| `setSelected(id)` | `(string \| null) => void` | Select a node/link, or deselect (`null`) |
| `deleteSelected()` | `() => void` | Delete the currently selected element (buildings and locked nodes are protected) |
| `undo()` | `() => void` | Undo the last change |
| `redo()` | `() => void` | Redo the last undone change |
| `getData()` | `() => WarehouseData` | Get a deep copy of the current layout data |
| `init(data)` | `(WarehouseData) => void` | Replace the entire layout and reset history |

---

### `useWarehouseStoreApi()`

Returns the raw zustand store instance (not a selector hook). Useful for imperative access outside of React render cycles.

```tsx
import { useWarehouseStoreApi } from 'open-warehouse';

function ResetButton() {
  const store = useWarehouseStoreApi();
  return (
    <button onClick={() => store.getState().init({ nodes: [], links: [] })}>
      Clear All
    </button>
  );
}
```

---

### `exportToPNG(containerId)`

Exports the Konva canvas to a high-resolution PNG as a base64 data URL.

```ts
import { exportToPNG } from 'open-warehouse';

const dataUrl = await exportToPNG('my-container-id');
```

> **Note:** The `containerId` is managed internally by `<WarehouseDesigner>`. To use this utility externally, wrap the component in a known container ID or use the toolbar's built-in "Export PNG" button.

---

### `defaultWarehouseData`

A pre-built `WarehouseData` object containing a sample warehouse layout:

- 1 building outline (640 x 680)
- 3 rack rows ("racks 1", "racks 2", "racks 3")
- 2 column obstacles
- 4 zones (inbound staging, outbound shipment, 2 free areas)
- 5 stations (returns, 2 packing, labeling, damaged items)
- 5 directional links (picking paths and routes)

```tsx
import { WarehouseDesigner, defaultWarehouseData } from 'open-warehouse';

<WarehouseDesigner initialData={defaultWarehouseData} />
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected element |
| `Escape` | Cancel current tool / deselect |
| `Space` + drag | Pan the canvas |
| Mousewheel | Zoom in/out (0.1x – 3.0x) |
| Double-click a node | Inline rename |

---

## Interactions Guide

### Selecting
Click any node or link to select it. Click an empty area to deselect.

### Moving
Click and drag any rack, zone, station, or obstacle. The position snaps to the grid on drop.

### Resizing
Select a node to reveal resize handles (8 for racks/zones/stations, 4 corners for obstacles). Drag any handle to resize. Minimum size is one grid cell.

### Inline Rename
Double-click a rack, zone, or station to open an inline text input. Press `Enter` to confirm or `Escape` to cancel.

### Creating Nodes
Select a tool from the toolbar (Add Rack, Add Zone, etc.), then click anywhere on the canvas to place the new element.

### Drawing Arrows
Select "Draw Arrow" from the toolbar, click to set the start point, then click again to set the end point. The arrow is created with a default "path" label.

### Reshaping Links
Select a link to reveal waypoint handles (blue circles). Drag any waypoint to reshape the arrow path.

---

## Node Types

| Type | Visual | Behavior |
|------|--------|----------|
| **Building** | Transparent rect, black stroke | Always at the bottom layer. Non-selectable, non-movable. |
| **Rack** | Light blue (configurable), 85% opacity | Movable, resizable (8 handles), renamable. |
| **Zone** | Semi-transparent fill, dashed border, rounded corners | Movable, resizable (8 handles), renamable. Georgia italic font. |
| **Station** | Solid fill (default gold `#f7d679`) | Movable, resizable (8 handles), renamable. |
| **Obstacle** | Small dark solid rectangle | Movable, resizable (4 corner handles). No label. |

---

## Architecture

```
src/
├── index.ts                       # Public barrel exports
├── types.ts                       # All TypeScript type definitions
├── components/
│   ├── WarehouseDesigner.tsx      # Root component (context, resize observer, onChange)
│   ├── DesignerCanvas.tsx         # Konva Stage + grid + pan/zoom + tool creation + rename
│   ├── Toolbar.tsx                # Tool buttons + action buttons (undo/redo/delete/export)
│   ├── LinkLayer.tsx              # Arrow rendering + labels + draggable waypoints
│   └── nodes/
│       ├── BuildingNode.tsx       # Static building outline
│       ├── RackNode.tsx           # Interactive rack
│       ├── ZoneNode.tsx           # Interactive zone
│       ├── StationNode.tsx        # Interactive station
│       ├── ObstacleNode.tsx       # Interactive obstacle
│       └── ResizeHandles.tsx      # Reusable 4/8 handle resize component
├── store/
│   └── useStore.ts                # Zustand + immer store with undo/redo (50 snapshots)
├── hooks/
│   └── useKeyboardShortcuts.ts    # Ctrl+Z/Y, Delete, Escape handlers
├── utils/
│   ├── grid.ts                    # snapToGrid, snapPointToGrid
│   └── exportPNG.ts              # Konva stage → base64 PNG
└── data/
    └── defaultWarehouse.ts        # Sample warehouse layout
```

### Dependencies

| Package | Purpose |
|---------|---------|
| `react-konva` + `konva` | Declarative HTML5 Canvas rendering |
| `zustand` + `immer` | Lightweight state management with immutable updates |
| `@use-gesture/react` | Wheel zoom and canvas pan gestures |
| `nanoid` | Fast, secure ID generation for nodes and links |

All dependencies are MIT licensed.

---

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type-check and build for production
npm run build

# Preview the production build
npm run preview
```

The dev server serves `index.html` which loads `dev/main.tsx` — a minimal test harness that renders `<WarehouseDesigner>` with the default warehouse data.

---

## Building for Production

```bash
npm run build
```

Outputs to `dist/`:

| File | Format |
|------|--------|
| `open-warehouse.js` | ES Module |
| `open-warehouse.cjs` | CommonJS |
| `index.d.ts` | TypeScript declarations |

React and React DOM are externalized — they're expected as peer dependencies in the consuming app.

---

## License

[MIT](LICENSE)
