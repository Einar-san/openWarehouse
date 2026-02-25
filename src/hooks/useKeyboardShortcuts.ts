import { useEffect } from 'react';
import type { WarehouseStore } from '../store/useStore';

export function useKeyboardShortcuts(store: WarehouseStore, readOnly: boolean) {
  useEffect(() => {
    if (readOnly) return;

    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.getState().undo();
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        store.getState().redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        store.getState().deleteSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const state = store.getState();
        if (state.tool !== 'select') {
          state.setTool('select');
        } else {
          state.setSelected(null);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store, readOnly]);
}
