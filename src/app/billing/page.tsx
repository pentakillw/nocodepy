'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useData } from '@/context/DataContext';
import { COLORS } from '@/utils/constants';
import { CreditCard, Crown, Zap, CheckCircle2 } from 'lucide-react';

export default function BillingPage() {
  const router = useRouter();
  const { userTier, setUserTier, showToast } = useData();

  const handleUpgrade = () => {
    if (userTier === 'free') {
        setUserTier('pro');
        showToast('¡Mejorado a PRO! Funciones desbloqueadas.', 'success');
    } else {
        setUserTier('free');
        showToast('Plan cambiado a FREE.', 'info');
    }
  };

  return (
    <div className={`flex h-screen ${COLORS.bg} overflow-hidden`}>
      <Sidebar currentStep="billing" setCurrentStep={() => router.push('/')} />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900 relative z-10 overflow-hidden h-full">
        <div className="w-full max-w-2xl bg-zinc-800 rounded-xl shadow-2xl border border-zinc-700 p-8 text-center">
            
            <div className="p-4 bg-yellow-500/10 text-yellow-500 inline-block rounded-full mb-6">
                <CreditCard size={48} />
            </div>

            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3 mb-2">
                <Crown className="text-yellow-500 fill-yellow-500" size={30} /> Planes y Facturación
            </h1>
            <p className="text-zinc-400 text-lg mb-8">
                Gestiona tu suscripción para acceder a funciones avanzadas.
            </p>

            <div className={`border rounded-xl p-6 transition-all ${userTier === 'pro' ? 'border-yellow-500 bg-yellow-500/5' : 'border-zinc-700 bg-zinc-900'}`}>
                <p className="text-xl font-bold text-white mb-2">Plan NocodePY PRO</p>
                <p className="text-3xl font-black text-white mb-6">$9.99 <span className="text-base font-normal text-zinc-500">/ mes</span></p>
                
                <ul className="text-left space-y-3 text-zinc-300 text-sm mb-8 max-w-sm mx-auto">
                    <li className="flex items-center gap-2"><Zap size={16} className="text-yellow-500" /> Exportación de código Python ilimitada</li>
                    <li className="flex items-center gap-2"><Zap size={16} className="text-yellow-500" /> Límites de carga extendidos</li>
                    <li className="flex items-center gap-2"><Zap size={16} className="text-yellow-500" /> Soporte prioritario</li>
                </ul>

                <button 
                    onClick={handleUpgrade}
                    className={`w-full font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${userTier === 'free' ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}
                >
                    {userTier === 'free' ? <><Crown size={18}/> Actualizar a PRO (Simulado)</> : <><CheckCircle2 size={18}/> Plan Activo (Cancelar)</>}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}