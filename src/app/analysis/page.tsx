'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import Sidebar from '@/components/Sidebar';
import { COLORS } from '@/utils/constants';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  Activity, Hash, FileBarChart, TrendingUp, Info, ShieldCheck, AlertTriangle, Layers, Type, LayoutList
} from 'lucide-react';

export default function AnalysisPage() {
  const router = useRouter();
  const { data, columns } = useData();

  // --- LÓGICA DE ESTADÍSTICAS (Memorizada para rendimiento) ---
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalCells = data.length * columns.length;
    let nullCount = 0;
    const typeCounts: Record<string, number> = { Texto: 0, Numérico: 0, Fecha: 0, Otro: 0 };

    const numericCols: string[] = [];
    const textCols: string[] = [];

    columns.forEach(col => {
      const sample = data.find(r => r[col] !== null && r[col] !== undefined && r[col] !== '')?.[col];
      
      if (sample && !isNaN(Number(sample))) {
        typeCounts.Numérico++;
        numericCols.push(col);
      } else if (sample && !isNaN(Date.parse(sample as string)) && String(sample).length > 5 && (String(sample).includes('-') || String(sample).includes('/'))) {
        typeCounts.Fecha++;
        textCols.push(col);
      } else {
        typeCounts.Texto++;
        textCols.push(col);
      }
    });

    data.forEach(row => {
      columns.forEach(col => {
        if (row[col] === null || row[col] === '' || row[col] === undefined) nullCount++;
      });
    });

    const qualityScore = Math.max(0, 100 - Math.round((nullCount / totalCells) * 100));
    
    // Gráfica de Barras (Top Categorías)
    let barData: any[] = [];
    let categoryCol = textCols.length > 0 ? textCols[0] : columns[0];
    if (categoryCol) {
      const counts: Record<string, number> = {};
      data.forEach(row => { const val = String(row[categoryCol] || 'N/A'); counts[val] = (counts[val] || 0) + 1; });
      barData = Object.keys(counts)
        .map(key => ({ name: key, value: counts[key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    }

    // Gráfica de Área (Tendencia Numérica)
    let areaData: any[] = [];
    let trendCol = numericCols.length > 0 ? numericCols[0] : null;
    if (trendCol) {
        areaData = data.slice(0, 50).map((row, i) => ({ 
            index: i + 1, 
            value: parseFloat(row[trendCol]) || 0 
        }));
    }

    const pieData = Object.keys(typeCounts)
        .filter(k => typeCounts[k] > 0)
        .map(k => ({ name: k, value: typeCounts[k] }));

    return { totalRows: data.length, totalCols: columns.length, qualityScore, nullCount, barData, categoryCol, areaData, trendCol, pieData };
  }, [data, columns]);

  const GRAPH_COLORS = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'];

  if (!data || data.length === 0 || !stats) {
    return (
      <div className={`flex h-screen ${COLORS.bg}`}>
        <Sidebar currentStep="analysis" setCurrentStep={() => router.push('/')} />
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 opacity-60">
          <LayoutList size={64} />
          <h2 className="mt-4 text-xl font-bold">Sin datos para analizar</h2>
          <p className="text-sm">Carga un archivo primero.</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg">Ir al Inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${COLORS.bg} overflow-hidden`}>
      <Sidebar currentStep="analysis" setCurrentStep={() => router.push('/')} />
      
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-900 relative z-10 overflow-auto h-full p-8 custom-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
               <Activity className="text-sky-500" size={32} /> Reporte de Análisis
            </h2>
            <p className="text-zinc-400 mt-1">Diagnóstico automático de calidad y patrones.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
             <ShieldCheck size={18} className={stats.qualityScore > 80 ? "text-emerald-500" : stats.qualityScore > 50 ? "text-yellow-500" : "text-red-500"} />
             <span className="text-sm font-bold text-zinc-200">Calidad: <span className={stats.qualityScore > 80 ? "text-emerald-400" : "text-yellow-400"}>{stats.qualityScore}%</span></span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard title="Filas" value={stats.totalRows.toLocaleString()} icon={<Hash />} color="text-blue-400" bg="bg-blue-500/10" />
          <KpiCard title="Columnas" value={stats.totalCols} icon={<Layers />} color="text-purple-400" bg="bg-purple-500/10" />
          <KpiCard title="Vacíos" value={stats.nullCount.toLocaleString()} icon={<AlertTriangle />} color={stats.nullCount > 0 ? "text-orange-400" : "text-emerald-400"} bg={stats.nullCount > 0 ? "bg-orange-500/10" : "bg-emerald-500/10"} />
          <KpiCard title="Textos" value={stats.pieData.find(d => d.name === 'Texto')?.value || 0} icon={<Type />} color="text-sky-400" bg="bg-sky-500/10" />
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-zinc-800 p-6 rounded-xl border border-zinc-700 shadow-sm flex flex-col h-[350px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <FileBarChart size={18} className="text-sky-500"/> Frecuencia
                    </h3>
                    <span className="text-xs bg-zinc-900 px-3 py-1 rounded-full border border-zinc-700 text-zinc-400 font-mono">
                        Columna: {stats.categoryCol}
                    </span>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} stroke="#fff" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fill: '#a1a1aa', fontSize: 11}} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {stats.barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={GRAPH_COLORS[index % GRAPH_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 shadow-sm flex flex-col h-[350px]">
                <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
                    <Info size={18} className="text-purple-400"/> Estructura
                </h3>
                <div className="flex-1 w-full min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {stats.pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={GRAPH_COLORS[index % GRAPH_COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-white">{stats.totalCols}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Cols</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {stats.trendCol && (
            <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 shadow-sm flex flex-col h-[300px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-400"/> Tendencia Numérica
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-xs text-zinc-400">{stats.trendCol}</span>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.areaData}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="#fff" />
                            <XAxis dataKey="index" hide />
                            <YAxis orientation="right" tick={{fill: '#a1a1aa', fontSize: 10}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }} />
                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color, bg }: any) {
  return (
    <div className="bg-zinc-800 p-5 rounded-xl border border-zinc-700 shadow-sm hover:border-zinc-600 transition-all group cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform`}>
          {/* CORRECCIÓN AQUI: Agregamos <any> para permitir la propiedad size */}
          {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">{title}</p>
      </div>
    </div>
  );
}