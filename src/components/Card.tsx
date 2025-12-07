// Componente de tarjeta contenedor con título y acción opcional
import React from 'react';
import { COLORS } from '@/utils/constants';

interface CardProps {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}

export default function Card({ children, title, action }: CardProps) {
  return (
    <div className={`w-full ${COLORS.card} border ${COLORS.border} rounded-xl p-6 mb-4 shadow-xl`}>
      <div className="flex justify-between items-center mb-6 border-b border-zinc-700/50 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}