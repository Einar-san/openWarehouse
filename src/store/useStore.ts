import { createContext, useContext } from 'react';
import { createStore, useStore as useZustandStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import type { WarehouseNode, WarehouseLink, WarehouseData, ToolType } from '../types';

const MAX_HISTORY = 50;

export interface WarehouseState {
  nodes: WarehouseNode[];
  links: WarehouseLink[];
  selectedId: string | null;
  tool: ToolType;
  history: WarehouseData[];
  historyIndex: number;

  // Actions
  init: (data: WarehouseData) => void;
  addNode: (node: Omit<WarehouseNode, 'id'> & { id?: string }) => void;
  updateNode: (id: string, updates: Partial<WarehouseNode>) => void;
  deleteNode: (id: string) => void;
  addLink: (link: Omit<WarehouseLink, 'id'> & { id?: string }) => void;
  updateLink: (id: string, updates: Partial<WarehouseLink>) => void;
  deleteLink: (id: string) => void;
  setTool: (tool: ToolType) => void;
  setSelected: (id: string | null) => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  getData: () => WarehouseData;
}

function pushHistory(state: WarehouseState) {
  const snapshot: WarehouseData = {
    nodes: current(state.nodes),
    links: current(state.links),
  };
  // Truncate any future history beyond current index
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshot);
  // Cap history size
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  state.history = newHistory;
  state.historyIndex = newHistory.length - 1;
}

export function createWarehouseStore(initialData?: WarehouseData) {
  const initial: WarehouseData = initialData ?? { nodes: [], links: [] };
  const initialSnapshot: WarehouseData = structuredClone(initial);

  return createStore<WarehouseState>()(
    immer((set, get) => ({
      nodes: initialSnapshot.nodes,
      links: initialSnapshot.links,
      selectedId: null,
      tool: 'select' as ToolType,
      history: [initialSnapshot],
      historyIndex: 0,

      init: (data: WarehouseData) =>
        set((state) => {
          const snapshot: WarehouseData = structuredClone(data);
          state.nodes = snapshot.nodes;
          state.links = snapshot.links;
          state.selectedId = null;
          state.tool = 'select';
          state.history = [snapshot];
          state.historyIndex = 0;
        }),

      addNode: (node) =>
        set((state) => {
          const newNode: WarehouseNode = { ...node, id: node.id ?? crypto.randomUUID() };
          state.nodes.push(newNode);
          pushHistory(state);
        }),

      updateNode: (id, updates) =>
        set((state) => {
          const idx = state.nodes.findIndex((n) => n.id === id);
          if (idx === -1) return;
          Object.assign(state.nodes[idx], updates);
          pushHistory(state);
        }),

      deleteNode: (id) =>
        set((state) => {
          state.nodes = state.nodes.filter((n) => n.id !== id);
          if (state.selectedId === id) state.selectedId = null;
          pushHistory(state);
        }),

      addLink: (link) =>
        set((state) => {
          const newLink: WarehouseLink = { ...link, id: link.id ?? crypto.randomUUID() };
          state.links.push(newLink);
          pushHistory(state);
        }),

      updateLink: (id, updates) =>
        set((state) => {
          const idx = state.links.findIndex((l) => l.id === id);
          if (idx === -1) return;
          Object.assign(state.links[idx], updates);
          pushHistory(state);
        }),

      deleteLink: (id) =>
        set((state) => {
          state.links = state.links.filter((l) => l.id !== id);
          if (state.selectedId === id) state.selectedId = null;
          pushHistory(state);
        }),

      setTool: (tool) =>
        set((state) => {
          state.tool = tool;
          if (tool !== 'select') state.selectedId = null;
        }),

      setSelected: (id) =>
        set((state) => {
          state.selectedId = id;
        }),

      deleteSelected: () => {
        const { selectedId } = get();
        if (!selectedId) return;
        const nodeIdx = get().nodes.findIndex((n) => n.id === selectedId);
        if (nodeIdx !== -1) {
          const node = get().nodes[nodeIdx];
          if (node.type === 'building' || node.locked) return;
          get().deleteNode(selectedId);
        } else {
          get().deleteLink(selectedId);
        }
      },

      undo: () =>
        set((state) => {
          if (state.historyIndex <= 0) return;
          state.historyIndex--;
          const snapshot = structuredClone(state.history[state.historyIndex]);
          state.nodes = snapshot.nodes;
          state.links = snapshot.links;
          state.selectedId = null;
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return;
          state.historyIndex++;
          const snapshot = structuredClone(state.history[state.historyIndex]);
          state.nodes = snapshot.nodes;
          state.links = snapshot.links;
          state.selectedId = null;
        }),

      getData: () => {
        const { nodes, links } = get();
        return structuredClone({ nodes, links });
      },
    }))
  );
}

export type WarehouseStore = ReturnType<typeof createWarehouseStore>;

export const WarehouseStoreContext = createContext<WarehouseStore | null>(null);

export function useWarehouseStore<T>(selector: (state: WarehouseState) => T): T {
  const store = useContext(WarehouseStoreContext);
  if (!store) {
    throw new Error('useWarehouseStore must be used within a WarehouseDesigner');
  }
  return useZustandStore(store, selector);
}

export function useWarehouseStoreApi(): WarehouseStore {
  const store = useContext(WarehouseStoreContext);
  if (!store) {
    throw new Error('useWarehouseStoreApi must be used within a WarehouseDesigner');
  }
  return store;
}
