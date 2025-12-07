import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, XCircle } from 'lucide-react';

interface DropdownMenuProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}

export const DropdownMenu = ({ label, icon, children, isOpen, onClick }: DropdownMenuProps) => {
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => { 
    if (isOpen) { 
      const timer = setTimeout(() => {
        setTerm('');
        if(inputRef.current) inputRef.current.focus();
      }, 50); 
      return () => clearTimeout(timer);
    } 
  }, [isOpen]);

  const items = React.Children.toArray(children).filter((child: any) => {
    if (!child.props || (!child.props.label && !child.props.title)) return true;
    if (child.props.title) return true;
    if (term.trim() !== '') return child.props.label.toLowerCase().includes(term.toLowerCase());
    return true;
  });

  return (
    <div className="relative">
      <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all select-none border ${isOpen ? 'bg-sky-500/10 text-sky-500 border-sky-500/30' : 'text-zinc-400 border-transparent hover:bg-zinc-800 hover:text-zinc-100'}`}>
        {icon} {label} <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#18181b] border border-zinc-700 rounded-xl shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2 overflow-hidden ring-1 ring-black/50">
          <div className="p-2 border-b border-zinc-800 bg-zinc-900/50">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-zinc-500" />
              <input ref={inputRef} type="text" placeholder="Buscar..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 placeholder:text-zinc-600" value={term} onChange={(e) => setTerm(e.target.value)} onClick={(e) => e.stopPropagation()} />
            </div>
          </div>
          <div className="max-h-[350px] overflow-y-auto p-1 custom-scrollbar">
            {items.length > 0 ? items : <div className="p-4 text-center text-xs text-zinc-500 opacity-70">Sin resultados</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownSectionTitle = ({ title }: { title: string }) => (
  <div className="px-3 py-1.5 mt-1 text-[10px] uppercase text-zinc-500 font-bold tracking-wider select-none bg-zinc-900/30 border-y border-zinc-800">
    {title}
  </div>
);

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export const DropdownItem = ({ icon, label, onClick, disabled, danger }: DropdownItemProps) => (
  <button onClick={onClick} disabled={disabled} className={`w-full flex items-center gap-3 px-3 py-2 text-xs text-left rounded-lg transition-colors ${disabled ? 'opacity-30 cursor-not-allowed' : danger ? 'text-red-400 hover:bg-red-900/20' : 'text-zinc-300 hover:bg-zinc-800 hover:text-sky-400'}`}>
    {icon} {label}
  </button>
);

interface ModalBarProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const ModalBar = ({ title, children, onClose }: ModalBarProps) => (
  <div className="bg-[#18181b] p-2 px-3 rounded-lg border border-sky-500/30 shadow-lg flex gap-2 items-center animate-in slide-in-from-top-2 flex-wrap relative pr-8 mx-1 z-20 ring-1 ring-black/50">
     <span className="text-xs font-bold text-sky-500 whitespace-nowrap border-r border-zinc-700 pr-2 mr-1">{title}</span>
     {children}
     <button onClick={onClose} className="absolute right-2 top-2.5 text-zinc-500 hover:text-red-400">
       <XCircle size={14}/>
     </button>
  </div>
);