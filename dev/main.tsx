import React from 'react';
import { createRoot } from 'react-dom/client';
import { WarehouseDesigner, defaultWarehouseData } from '../src';

function App() {
  return (
    <WarehouseDesigner
      initialData={defaultWarehouseData}
      height={700}
      gridSize={20}
      onChange={(data) => console.log('layout changed', data.nodes.length, 'nodes', data.links.length, 'links')}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
