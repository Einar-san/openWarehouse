import React, { useRef } from 'react';
import type { ToolType, WarehouseData } from '../types';
import { useWarehouseStore, useWarehouseStoreApi } from '../store/useStore';
import { exportToPNG } from '../utils/exportPNG';

function isValidWarehouseData(data: unknown): data is WarehouseData {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.links)) return false;
  return obj.nodes.every(
    (n: unknown) =>
      typeof n === 'object' && n !== null &&
      typeof (n as Record<string, unknown>).id === 'string' &&
      typeof (n as Record<string, unknown>).type === 'string' &&
      typeof (n as Record<string, unknown>).x === 'number' &&
      typeof (n as Record<string, unknown>).y === 'number' &&
      typeof (n as Record<string, unknown>).width === 'number' &&
      typeof (n as Record<string, unknown>).height === 'number',
  );
}

interface Props {
  containerId: string;
}

const TOOLS: { tool: ToolType; label: string }[] = [
  { tool: 'select', label: 'Select' },
  { tool: 'addRack', label: 'Add Rack' },
  { tool: 'addZone', label: 'Add Zone' },
  { tool: 'addStation', label: 'Add Station' },
  { tool: 'addObstacle', label: 'Add Obstacle' },
  { tool: 'addArrow', label: 'Draw Arrow' },
];

const btnStyle: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: 12,
  border: '1px solid #ccc',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const activeBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: '#0066ff',
  color: '#fff',
  borderColor: '#0066ff',
};

export function Toolbar({ containerId }: Props) {
  const tool = useWarehouseStore((s) => s.tool);
  const storeApi = useWarehouseStoreApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const state = () => storeApi.getState();

  const handleExportJSON = () => {
    const data = state().getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'warehouse.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed: unknown = JSON.parse(evt.target?.result as string);
        if (isValidWarehouseData(parsed)) {
          state().init(parsed);
        } else {
          console.warn('openWarehouse: imported file has invalid structure');
        }
      } catch {
        console.warn('openWarehouse: imported file is not valid JSON');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
  };

  const handleExportPNG = async () => {
    try {
      const dataUrl = await exportToPNG(containerId);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'warehouse.png';
      a.click();
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: '6px 8px',
        borderBottom: '1px solid #ddd',
        background: '#fafafa',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {TOOLS.map(({ tool: t, label }) => (
        <button
          key={t}
          style={tool === t ? activeBtnStyle : btnStyle}
          onClick={() => state().setTool(t)}
        >
          {label}
        </button>
      ))}

      <div style={{ width: 1, height: 24, background: '#ddd', margin: '0 4px' }} />

      <button style={btnStyle} onClick={() => state().undo()} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button style={btnStyle} onClick={() => state().redo()} title="Redo (Ctrl+Y)">
        Redo
      </button>
      <button style={btnStyle} onClick={() => state().deleteSelected()} title="Delete (Del)">
        Delete
      </button>

      <div style={{ width: 1, height: 24, background: '#ddd', margin: '0 4px' }} />

      <button style={btnStyle} onClick={handleExportJSON}>
        Export JSON
      </button>
      <button style={btnStyle} onClick={() => fileInputRef.current?.click()}>
        Import JSON
      </button>
      <button style={btnStyle} onClick={handleExportPNG}>
        Export PNG
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportJSON}
      />
    </div>
  );
}
