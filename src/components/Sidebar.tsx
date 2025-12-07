import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, FolderOpen, TableProperties, Network, 
  BarChart3, FileCode, Wand2, BookOpen, MonitorPlay, Crown
} from 'lucide-react';
import { COLORS } from '@/utils/constants';
import { useData } from '@/context/DataContext';

interface SidebarProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

export default function Sidebar({ currentStep, setCurrentStep }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userTier } = useData();

  // Menú del Wizard (Home)
  const wizardSteps = [
    { id: 'tutorial', label: 'Inicio', icon: LayoutDashboard },
    { id: 'sources', label: '1. Fuentes de Datos', icon: FolderOpen },
    { id: 'structure', label: '2. Estructura', icon: TableProperties },
    { id: 'mapping', label: '3. Mapeo', icon: Network },
  ];

  // Menú de Herramientas Pro (Nuevas Páginas)
  const toolsSteps = [
    { id: 'transform', label: 'Transformar', icon: Wand2, path: '/transform' },
    { id: 'analysis', label: 'Análisis (Gráficas)', icon: BarChart3, path: '/analysis' },
    { id: 'export', label: 'Exportar (Código)', icon: FileCode, path: '/export' },
  ];

  // Menú de Ayuda y Cuenta
  const helpSteps = [
    { id: 'docs', label: 'Documentación', icon: BookOpen, path: '/docs' },
    { id: 'guide', label: 'Guía de Ejecución', icon: MonitorPlay, path: '/guide' },
    { id: 'billing', label: userTier === 'pro' ? 'Plan PRO Activo' : 'Mejorar Plan', icon: Crown, path: '/billing', special: true },
  ];

  const handleNavigation = (id: string, path?: string) => {
    if (path) {
      router.push(path);
    } else {
      if (pathname !== '/') {
        router.push('/');
        setTimeout(() => setCurrentStep(id), 100);
      } else {
        setCurrentStep(id);
      }
    }
  };

  return (
    <aside className={`w-64 ${COLORS.sidebar} border-r ${COLORS.border} flex flex-col fixed h-full z-20`}>
      <div className="p-6 cursor-pointer" onClick={() => router.push('/')}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
            N
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">NocodePy</h1>
        </div>
        <p className="text-xs text-zinc-500 ml-10">ETL Enterprise v4.0</p>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {/* WIZARD */}
        <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2 mt-2 px-3">Asistente</div>
        {wizardSteps.map((item) => {
          const isActive = currentStep === item.id && pathname === '/';
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group
                ${isActive 
                  ? 'bg-zinc-800 text-sky-400 font-medium shadow-inner border border-zinc-700/50' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
            >
              <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sky-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {item.label}
            </button>
          );
        })}

        {/* TOOLS */}
        <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2 mt-6 px-3">Herramientas Pro</div>
        {toolsSteps.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group
                ${isActive 
                  ? 'bg-sky-600/10 text-sky-400 font-medium border border-sky-600/20' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
            >
              <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sky-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {item.label}
            </button>
          );
        })}

        {/* HELP & ACCOUNT */}
        <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2 mt-6 px-3">Soporte</div>
        {helpSteps.map((item) => {
          const isActive = pathname === item.path;
          const isSpecial = item.special;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group
                ${isActive 
                  ? 'bg-zinc-800 text-zinc-200 font-medium' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'}
                ${isSpecial && userTier === 'free' ? 'text-yellow-500 hover:text-yellow-400' : ''}
              `}
            >
              <item.icon className={`w-4 h-4 transition-colors ${isSpecial && userTier === 'free' ? 'text-yellow-500' : (isActive ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-300')}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-900/80 rounded-lg p-3 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${userTier === 'pro' ? 'bg-yellow-500' : 'bg-emerald-500'} animate-pulse`}></div>
            <span className="text-xs text-zinc-400 font-mono">Plan: {userTier.toUpperCase()}</span>
          </div>
          <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full w-full opacity-50 ${userTier === 'pro' ? 'bg-yellow-500' : 'bg-emerald-500'}`}></div>
          </div>
        </div>
      </div>
    </aside>
  );
}