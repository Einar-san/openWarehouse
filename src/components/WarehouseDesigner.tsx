import React, { useEffect, useId, useMemo, useRef } from 'react';
import type { WarehouseData } from '../types';
import { createWarehouseStore, WarehouseStoreContext } from '../store/useStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Toolbar } from './Toolbar';
import { DesignerCanvas } from './DesignerCanvas';

export interface WarehouseDesignerProps {
  initialData?: WarehouseData;
  onChange?: (data: WarehouseData) => void;
  width?: number | string;
  height?: number | string;
  gridSize?: number;
  readOnly?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function WarehouseDesigner({
  initialData,
  onChange,
  width = '100%',
  height = 600,
  gridSize = 20,
  readOnly = false,
  style,
  className,
}: WarehouseDesignerProps) {
  const containerId = `ow-${useId().replace(/:/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = React.useState({ w: 800, h: 600 });

  const store = useMemo(() => createWarehouseStore(initialData), []);

  // Fire onChange on every state mutation
  useEffect(() => {
    if (!onChange) return;
    const unsub = store.subscribe((state) => {
      onChange({ nodes: state.nodes, links: state.links });
    });
    return unsub;
  }, [store, onChange]);

  // Measure container for pixel width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          w: Math.floor(entry.contentRect.width),
          h: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useKeyboardShortcuts(store, readOnly);

  const numericHeight = typeof height === 'number' ? height : undefined;

  return (
    <WarehouseStoreContext.Provider value={store}>
      <div
        id={containerId}
        className={className}
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #ddd',
          borderRadius: 4,
          overflow: 'hidden',
          background: '#fff',
          ...style,
        }}
      >
        {!readOnly && <Toolbar containerId={containerId} />}
        <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }}>
          <DesignerCanvas
            width={canvasSize.w || 800}
            height={numericHeight ? canvasSize.h || numericHeight : canvasSize.h || 600}
            gridSize={gridSize}
            readOnly={readOnly}
          />
        </div>
      </div>
    </WarehouseStoreContext.Provider>
  );
}
