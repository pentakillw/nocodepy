// Componente de entrada de texto estilizado (Corregido para TypeScript estricto)
import React from 'react';

// Cambiamos interface por type para evitar errores de "interfaz vacía"
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = '', ...props }: InputProps) {
  return (
    <input 
      className={`bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none w-full ${className}`}
      {...props}
    />
  );
}