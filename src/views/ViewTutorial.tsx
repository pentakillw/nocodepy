// Vista de bienvenida y tutorial inicial
import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, TableProperties, Network, DatabaseZap, Calculator, ShieldCheck, ChevronRight } from 'lucide-react';
import Button from '@/components/Button';
import { COLORS } from '@/utils/constants';

interface ViewTutorialProps {
  onStart: () => void;
}

export default function ViewTutorial({ onStart }: ViewTutorialProps) {
  const items = [
    { icon: FolderOpen, title: "1. Carga Fuentes", desc: "Soporte para Excel y CSV múltiple." },
    { icon: TableProperties, title: "2. Estructura", desc: "Define columnas y reglas automáticas." },
    { icon: Network, title: "3. Mapeo Inteligente", desc: "Algoritmos fuzzy matching (TheFuzz)." },
    { icon: DatabaseZap, title: "4. Enriquecimiento", desc: "Cruce con catálogos maestros (VLOOKUP)." },
    { icon: Calculator, title: "5. Cálculos", desc: "Fórmulas personalizadas tipo Pandas." },
    { icon: ShieldCheck, title: "6. QA y Calidad", desc: "Validaciones de tipos y nulos." },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto text-center pt-10">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent mb-6">
        ETL Studio Web
      </h1>
      <p className={`text-xl ${COLORS.muted} mb-12`}>
        Sistema de Homologación y Transformación de Datos Enterprise
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-12">
        {items.map((item, idx) => (
          <div key={idx} className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 hover:border-sky-500/50 transition-colors">
            <item.icon className="w-8 h-8 text-sky-500 mb-3" />
            <h3 className="font-bold text-lg text-white">{item.title}</h3>
            <p className="text-zinc-400 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button onClick={onStart} className="text-lg px-8 py-4">
          Comenzar Proyecto <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}