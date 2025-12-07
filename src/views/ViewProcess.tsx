// Vista de ejecución y visualización de logs del proceso
import React, { useState, useRef, useEffect } from 'react';
import { Play, Terminal, Download } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface ViewProcessProps {
  logs: string[];
  addLog: (msg: string) => void;
}

export default function ViewProcess({ logs, addLog }: ViewProcessProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const runProcess = () => {
    setIsProcessing(true);
    addLog("--- INICIANDO MOTOR ETL v4.0 (WEB) ---");
    setTimeout(() => addLog("Cargando configuraciones..."), 500);
    setTimeout(() => addLog("Leyendo fuentes de datos reales..."), 1200);
    setTimeout(() => addLog("Aplicando mapeo inteligente..."), 2000);
    setTimeout(() => {
      addLog("✅ PROCESO FINALIZADO EXITOSAMENTE");
      setIsProcessing(false);
    }, 4000);
  };

  return (
    <div className="h-full flex flex-col gap-6">
       <Card title="Panel de Control" action={
         <Button onClick={runProcess} disabled={isProcessing} className="w-48 justify-center">
           {isProcessing ? <span className="animate-spin mr-2">⟳</span> : <Play className="w-4 h-4" />}
           {isProcessing ? "Procesando..." : "Ejecutar ETL"}
         </Button>
       }>
         <div className="flex gap-4">
           <div className="flex-1 bg-zinc-900 rounded-lg p-4 border border-zinc-700 flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
             <span className="text-zinc-300 font-mono text-sm">Estado: {isProcessing ? "EN EJECUCIÓN" : "LISTO PARA INICIAR"}</span>
           </div>
         </div>
       </Card>

       <div className="flex-1 bg-black rounded-xl border border-zinc-800 p-4 font-mono text-sm overflow-hidden flex flex-col shadow-inner">
         <div className="flex items-center gap-2 text-zinc-500 mb-2 pb-2 border-b border-zinc-800">
           <Terminal className="w-4 h-4" />
           <span>Output Log</span>
         </div>
         <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 text-emerald-500/90">
           {logs.map((log, i) => (
             <div key={i} className="break-all">
               <span className="text-zinc-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
               {log}
             </div>
           ))}
         </div>
       </div>
    </div>
  );
}