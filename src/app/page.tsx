// Página principal que integra el sidebar y gestiona la navegación entre vistas
"use client";

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, DatabaseZap, ShieldCheck } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import { COLORS } from '@/utils/constants';

// Importación de Vistas Modularizadas
import ViewTutorial from '@/views/ViewTutorial';
import ViewSources from '@/views/ViewSources';
import ViewStructure from '@/views/ViewStructure';
import ViewMapping from '@/views/ViewMapping';
import ViewProcess from '@/views/ViewProcess';

// Definición de tipos locales para el estado
interface FileData {
  id: number;
  name: string;
  size: string;
  sheet: string;
  headerRow: number;
  fileObj: File;
}

export default function ETLStudioPage() {
  // --- Estado Global de la Aplicación ---
  const [currentStep, setCurrentStep] = useState('tutorial');
  const [files, setFiles] = useState<FileData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Función auxiliar para añadir logs desde cualquier vista
  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  return (
    <div className={`min-h-screen ${COLORS.bg} text-zinc-100 flex font-sans selection:bg-sky-500/30`}>
      {/* 1. Barra Lateral de Navegación */}
      <Sidebar currentStep={currentStep} setCurrentStep={setCurrentStep} />

      {/* 2. Área Principal de Contenido */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {/* Título Dinámico según el paso (Simplificado para esta vista) */}
              <span className="capitalize">{currentStep.replace('tutorial', 'Inicio')}</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-zinc-500">Proyecto: <span className="text-zinc-300">Demo_Ventas_2025</span></span>
             <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs">US</div>
          </div>
        </header>

        {/* 3. Renderizado Condicional de Vistas con Animación */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full pb-20"
          >
            {currentStep === 'tutorial' && (
              <ViewTutorial onStart={() => setCurrentStep('sources')} />
            )}
            
            {currentStep === 'sources' && (
              <ViewSources files={files} setFiles={setFiles} />
            )}
            
            {currentStep === 'structure' && (
              <ViewStructure columns={columns} setColumns={setColumns} filesLength={files.length} />
            )}
            
            {currentStep === 'mapping' && (
              <ViewMapping files={files} columns={columns} />
            )}
            
            {/* Vistas Placeholder para funcionalidades futuras */}
            {['enrich', 'calculations', 'quality'].includes(currentStep) && (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-700 rounded-xl bg-zinc-900/30">
                <div className="bg-zinc-800 p-4 rounded-full mb-4">
                  {currentStep === 'enrich' && <DatabaseZap className="w-8 h-8 text-zinc-500" />}
                  {currentStep === 'calculations' && <Calculator className="w-8 h-8 text-zinc-500" />}
                  {currentStep === 'quality' && <ShieldCheck className="w-8 h-8 text-zinc-500" />}
                </div>
                <h3 className="text-xl font-bold text-zinc-300 mb-2">Funcionalidad en Desarrollo</h3>
                <p className="text-zinc-500 max-w-md">
                  Este módulo estará disponible en la próxima actualización.
                </p>
              </div>
            )}

            {currentStep === 'process' && (
              <ViewProcess logs={logs} addLog={addLog} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}