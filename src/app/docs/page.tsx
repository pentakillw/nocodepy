'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { COLORS } from '@/utils/constants';
import { 
  Search, TableProperties, Eraser, Type,
  GitFork, Calculator, Sparkles, ChevronRight, BookOpen 
} from 'lucide-react';

const DOCS_DATA = [
  {
    id: 'smart',
    title: 'Smart Clean',
    icon: <Sparkles className="text-sky-500" />,
    description: 'Limpieza automática inteligente.',
    features: [
      { name: 'Auto-Limpieza', desc: 'Ejecuta secuencialmente: Trim de espacios, eliminación de filas vacías y duplicados exactos.' }
    ]
  },
  {
    id: 'structure',
    title: 'Estructura',
    icon: <TableProperties className="text-blue-500" />,
    description: 'Modifica la forma de la tabla.',
    features: [
      { name: 'Promover Encabezados', desc: 'Convierte la primera fila en los nombres de columnas.' },
      { name: 'Agregar Índice', desc: 'Crea una columna ID consecutiva (1, 2, 3...).' },
      { name: 'Eliminar Columnas', desc: 'Borra columnas innecesarias del dataset.' }
    ]
  },
  {
    id: 'cleaning',
    title: 'Limpieza',
    icon: <Eraser className="text-pink-500" />,
    description: 'Eliminación de datos sucios.',
    features: [
      { name: 'Rellenar Abajo (Fill Down)', desc: 'Rellena celdas vacías con el valor de la fila superior.' },
      { name: 'Rellenar Nulos', desc: 'Reemplaza vacíos con un valor fijo (ej: 0).' },
      { name: 'Limpiar Símbolos', desc: 'Deja solo letras y números, eliminando caracteres especiales.' }
    ]
  },
  {
    id: 'text',
    title: 'Texto',
    icon: <Type className="text-purple-500" />,
    description: 'Manipulación de cadenas.',
    features: [
      { name: 'Mayúsculas / Minúsculas', desc: 'Estandariza el formato del texto.' },
      { name: 'Trim', desc: 'Elimina espacios en blanco al inicio y final.' },
      { name: 'Dividir / Unir', desc: 'Separa o concatena columnas de texto.' }
    ]
  },
  {
    id: 'logic',
    title: 'Lógica',
    icon: <GitFork className="text-orange-500" />,
    description: 'Operaciones condicionales.',
    features: [
      { name: 'Columna Condicional', desc: 'Crea columnas basadas en reglas (Si X > 10, entonces "Alto").' },
      { name: 'Filtros', desc: 'Mantiene solo las filas que cumplen cierta condición.' }
    ]
  },
  {
    id: 'tools',
    title: 'Cálculo',
    icon: <Calculator className="text-yellow-500" />,
    description: 'Matemáticas y agrupaciones.',
    features: [
      { name: 'Operar (+ - * /)', desc: 'Realiza cálculos matemáticos entre columnas.' },
      { name: 'Agrupar', desc: 'Crea tablas pivote simples (Suma, Promedio, Conteo).' }
    ]
  }
];

export default function DocsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredDocs = DOCS_DATA.filter(cat => {
    if (activeCategory !== 'all' && cat.id !== activeCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return cat.title.toLowerCase().includes(term) || cat.features.some(f => f.name.toLowerCase().includes(term));
    }
    return true;
  });

  return (
    <div className={`flex h-screen ${COLORS.bg} overflow-hidden`}>
      <Sidebar currentStep="docs" setCurrentStep={() => router.push('/')} />
      
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-900 relative z-10 overflow-hidden h-full">
        <div className="bg-zinc-900 border-b border-zinc-800 p-6 shadow-sm z-10">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="text-sky-500" /> Documentación
                </h1>
                <p className="text-zinc-400 text-sm mt-1">Guía de referencia de funciones.</p>
              </div>
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar función..." 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6 overflow-x-auto pb-2 custom-scrollbar">
              <button onClick={() => setActiveCategory('all')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${activeCategory === 'all' ? 'bg-sky-500 text-white border-sky-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-sky-500/50'}`}>Todas</button>
              {DOCS_DATA.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${activeCategory === cat.id ? 'bg-zinc-800 text-sky-500 border-sky-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-sky-500/50'}`}>
                  {cat.icon} {cat.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {filteredDocs.map((cat) => (
              <div key={cat.id} className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-2">
                  <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
                    {/* AQUI ESTÁ EL FIX CRÍTICO */}
                    {React.cloneElement(cat.icon as React.ReactElement<any>, { size: 24 })}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{cat.title}</h2>
                    <p className="text-xs text-zinc-500">{cat.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.features.map((feat, idx) => (
                    <div key={idx} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 hover:border-sky-500/40 transition-all group">
                      <h3 className="font-bold text-sm text-zinc-200 mb-2 flex items-center justify-between">
                        {feat.name}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-sky-500 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300"/>
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}