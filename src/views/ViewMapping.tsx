// Vista para mapear columnas origen vs columnas destino
import React, { useState } from 'react';

interface ViewMappingProps {
  files: { id: number; name: string }[];
  columns: string[];
}

export default function ViewMapping({ files, columns }: ViewMappingProps) {
  const [activeTab, setActiveTab] = useState(files[0]?.id || 0);

  if (files.length === 0) return <div className="text-center py-20 text-zinc-500">Por favor carga archivos primero.</div>;
  if (columns.length === 0) return <div className="text-center py-20 text-zinc-500">Por favor define la estructura primero.</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 mb-6 border-b border-zinc-700 pb-2 overflow-x-auto">
        {files.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveTab(f.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${activeTab === f.id ? 'bg-zinc-800 text-sky-400 border-b-2 border-sky-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="bg-zinc-800 rounded-xl border border-zinc-700 flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-900/50 border-b border-zinc-700 font-bold text-sm text-zinc-400 uppercase tracking-wider">
          <div>Columna Destino (Maestra)</div>
          <div>Columna Origen ({files.find(f => f.id === activeTab)?.name})</div>
        </div>
        <div className="overflow-y-auto p-4 space-y-3">
          {columns.map((col, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-4 items-center group hover:bg-zinc-700/30 p-2 rounded transition-colors">
              <div className="flex items-center gap-2 text-zinc-200">
                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                {col}
              </div>
              <select className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-2 w-full focus:border-sky-500 outline-none">
                <option value="">(Seleccionar sugerencia...)</option>
                <option value={col}>Exact: {col}</option>
                <option value={`raw_${col.toLowerCase()}`}>Sugerido: raw_{col.toLowerCase()}</option>
                <option value="ignore">(IGNORAR)</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}