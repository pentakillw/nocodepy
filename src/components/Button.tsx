// Componente de botón reutilizable con variantes de estilo
import React from 'react';
import { COLORS } from '@/utils/constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
}

export default function Button({ children, onClick, variant = 'primary', className = '', disabled = false, ...props }: ButtonProps) {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: `${COLORS.accent} text-white shadow-lg shadow-sky-900/20`,
    secondary: "bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    ghost: "hover:bg-zinc-800 text-zinc-400 hover:text-white"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}