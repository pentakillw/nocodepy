'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import Sidebar from '@/components/Sidebar';
import { COLORS } from '@/utils/constants';
import { FileJson, Copy, Check, FileSpreadsheet, Terminal, Package, Database, ShieldAlert } from 'lucide-react';

export default function ExportPage() {
  const router = useRouter();
  const { data, columns, actions, fileName } = useData();
  const [activeTab, setActiveTab] = useState('files');
  const [copied, setCopied] = useState(false);

  // --- DESCARGAS ---
  const downloadCSV = () => {
    if (!data.length) return;
    const headers = columns.join(',');
    const rows = data.map(row => columns.map(col => {
      const cell = row[col] === null || row[col] === undefined ? '' : String(row[col]);
      return `"${cell.replace(/"/g, '""')}"`;
    }).join(','));
    const csvContent = [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', `${fileName || 'export'}_processed.csv`);
    link.click();
  };

  const downloadJSON = () => {
    if (!data.length) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    link.setAttribute('download', `${fileName || 'export'}_processed.json`);
    link.click();
  };

  // --- GENERADORES DE CÓDIGO ---
  const generateSQL = () => {
    if (!data.length) return "-- Sin datos";
    const tableName = fileName ? fileName.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_') : 'tabla_nocodepy';
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n` + columns.map(col => `    "${col}" TEXT`).join(',\n') + `\n);\n\n`;
    sql += `INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(', ')}) VALUES\n`;
    const rows = data.slice(0, 500).map(row => { 
        const values = columns.map(col => {
            let val = row[col];
            return val === null || val === undefined ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`; 
        }).join(', ');
        return `(${values})`;
    }).join(',\n');
    return sql + rows + ';\n-- Muestra de las primeras 500 filas.';
  };

  const generatePython = () => {
    let steps = "";
    actions.forEach((action, idx) => {
        steps += `    # [PASO ${idx + 1}] ${action.description || action.type}\n`;
        // Aquí iría la lógica detallada de mapeo de acciones a Pandas
        // (Simplificada para este ejemplo, pero expandible como en el proyecto original)
        if(action.type === 'DROP_COLUMN') steps += `    if '${action.col}' in df.columns: df.drop(columns=['${action.col}'], inplace=True)\n`;
        if(action.type === 'RENAME') steps += `    df.rename(columns={'${action.col}': '${action.newVal}'}, inplace=True)\n`;
        if(action.type === 'FILTER') steps += `    df = df[df['${action.col}'].astype(str).str.contains('${action.val}', na=False)]\n`;
    });
    
    return `import pandas as pd\nimport tkinter as tk\nfrom tkinter import filedialog, messagebox\n\ndef procesar_datos(ruta_entrada):\n    try:\n        df = pd.read_excel(ruta_entrada) if ruta_entrada.endswith('.xlsx') else pd.read_csv(ruta_entrada)\n        print(f"Cargado: {len(df)} filas")\n\n${steps}\n        ruta_salida = ruta_entrada.replace('.', '_clean.')\n        df.to_csv(ruta_salida, index=False)\n        messagebox.showinfo("Éxito", f"Guardado en: {ruta_salida}")\n    except Exception as e:\n        messagebox.showerror("Error", str(e))\n\n# Interfaz básica\nroot = tk.Tk()\nroot.withdraw()\nfilename = filedialog.askopenfilename(title="Selecciona archivo")\nif filename:\n    procesar_datos(filename)`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data || data.length === 0) {
    return (
      <div className={`flex h-screen ${COLORS.bg}`}>
        <Sidebar currentStep="export" setCurrentStep={() => router.push('/')} />
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 opacity-60">
          <Package size={64} />
          <h2 className="mt-4 text-xl font-bold">Sin datos para exportar</h2>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg">Ir al Inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${COLORS.bg} overflow-hidden`}>
      <Sidebar currentStep="export" setCurrentStep={() => router.push('/')} />
      
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-900 relative z-10 overflow-hidden h-full">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900">
           <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Package className="text-sky-500" /> Export Hub</h2>
           <p className="text-zinc-400 text-sm">Descarga tus datos procesados o genera código de automatización.</p>
           
           <div className="flex gap-8 mt-8 border-b border-zinc-800 text-sm">
              <button onClick={() => setActiveTab('files')} className={`pb-3 px-1 font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'files' ? 'text-sky-500 border-sky-500' : 'text-zinc-500 border-transparent hover:text-white'}`}>
                <FileSpreadsheet size={16}/> 1. Archivos
              </button>
              <button onClick={() => setActiveTab('sql')} className={`pb-3 px-1 font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'sql' ? 'text-sky-500 border-sky-500' : 'text-zinc-500 border-transparent hover:text-white'}`}>
                <Database size={16}/> 2. SQL Generator
              </button>
              <button onClick={() => setActiveTab('code')} className={`pb-3 px-1 font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'code' ? 'text-sky-500 border-sky-500' : 'text-zinc-500 border-transparent hover:text-white'}`}>
                <Terminal size={16}/> 3. Python App
              </button>
           </div>
        </div>

        <div className="flex-1 p-6 bg-zinc-900/50 overflow-auto custom-scrollbar">
            {activeTab === 'files' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
                <div onClick={downloadCSV} className="cursor-pointer group bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-2xl p-10 flex flex-col items-center text-center transition-all hover:shadow-xl relative overflow-hidden">
                  <div className="p-5 bg-emerald-500/10 rounded-full mb-6 text-emerald-500 group-hover:scale-110 transition-transform"><FileSpreadsheet size={48} /></div>
                  <h3 className="text-xl font-bold text-white mb-2">CSV / Excel</h3>
                  <p className="text-sm text-zinc-400">Formato universal compatible.</p>
                </div>
                <div onClick={downloadJSON} className="cursor-pointer group bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-yellow-500 rounded-2xl p-10 flex flex-col items-center text-center transition-all hover:shadow-xl relative overflow-hidden">
                  <div className="p-5 bg-yellow-500/10 rounded-full mb-6 text-yellow-500 group-hover:scale-110 transition-transform"><FileJson size={48} /></div>
                  <h3 className="text-xl font-bold text-white mb-2">JSON (API)</h3>
                  <p className="text-sm text-zinc-400">Estructura ligera para web.</p>
                </div>
              </div>
            )}

            {(activeTab === 'sql' || activeTab === 'code') && (
                <div className="h-full flex flex-col gap-4 relative animate-in fade-in">
                  <div className="flex justify-between items-center mb-2 px-1">
                      <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                        {activeTab === 'sql' ? <><Database size={12}/> script.sql</> : <><Terminal size={12}/> app.py</>}
                      </div>
                      <button onClick={() => copyToClipboard(activeTab === 'sql' ? generateSQL() : generatePython())} className="flex items-center gap-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg transition-all">
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar'}
                      </button>
                  </div>
                  <div className="flex-1 bg-[#0f0f11] rounded-xl p-6 overflow-auto border border-zinc-800 custom-scrollbar shadow-inner text-left">
                    <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {activeTab === 'sql' ? generateSQL() : generatePython()}
                    </pre>
                  </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}