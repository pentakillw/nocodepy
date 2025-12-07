'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useDataTransform } from '@/hooks/useDataTransform';
import Sidebar from '@/components/Sidebar';
import { DropdownMenu, DropdownSectionTitle, DropdownItem, ModalBar } from '@/components/TransformationUI';
import { COLORS } from '@/utils/constants';

import { 
  Filter, Trash2, ArrowDownAZ, Eraser, 
  Type, Undo2, History, XCircle, Search,
  Calculator, Sigma, Edit3, Replace, Scissors,
  ArrowUp, TableProperties, ChevronDown, Sparkles,
  Calendar, GitFork, Divide, LayoutList,
  Combine, Split, Baseline, ListOrdered, Hash, CaseUpper, FunctionSquare,
  Code, Binary, CalendarPlus, CalendarRange, 
  ArrowRightToLine, ArrowDownToLine, EyeOff, Scaling, 
  Shuffle, Braces, Info, Minimize2, Maximize2, X,
  ArrowRightLeft, BrainCircuit, BarChart4, TrendingUp, MoreVertical,
  ArrowUpAZ, Copy, ArrowLeft, ArrowRight, GripVertical,
  PlusSquare, Zap, PlayCircle, Wand2, CheckCircle2, ScanSearch, MousePointerClick
} from 'lucide-react';

// Definimos la interfaz para las estadísticas para evitar el error "any"
interface ColumnStats {
  colName: string;
  total: number;
  filled: number;
  empty: number;
  unique: number;
  min: number | string;
  max: number | string;
  avg: number | string;
}

export default function TransformationPage() {
  const router = useRouter();
  const { data, columns, actions, undoLastAction, showToast } = useData();
  const transform = useDataTransform(); 
  
  const [activeCol, setActiveCol] = useState<string | null>(null);
  
  // --- ESTADOS DE LA INTERFAZ ---
  const [historyOpen, setHistoryOpen] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null); 
  
  // MENÚ DE COLUMNA FLOTANTE
  const [headerMenuOpen, setHeaderMenuOpen] = useState<string | null>(null);
  const [headerMenuPos, setHeaderMenuPos] = useState({ top: 0, left: 0 });
  
  // DRAG & DROP
  const [draggedColIdx, setDraggedColIdx] = useState<number | null>(null); 
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null); 
  
  const menuRef = useRef<HTMLDivElement>(null);

  const [activeModal, setActiveModal] = useState<string | null>(null); 
  const [colStats, setColStats] = useState<ColumnStats | null>(null);

  // --- VARIABLES DE ESTADO PARA MODALES ---
  const [newName, setNewName] = useState('');
  const [fillValue, setFillValue] = useState('0');
  const [rowsToRemove, setRowsToRemove] = useState(1);
  const [targetType, setTargetType] = useState('numeric');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [mathTarget, setMathTarget] = useState('Total');
  const [mathOp, setMathOp] = useState('*');
  const [mathCol2, setMathCol2] = useState('');

  // --- FILTROS Y OTROS ---
  const [filterCondition, setFilterCondition] = useState('contains');
  const [filterValue, setFilterValue] = useState('');
  const [splitDelim, setSplitDelim] = useState(',');
  const [mergeCol2, setMergeCol2] = useState('');
  const [mergeSep, setMergeSep] = useState(' '); 
  const [affixType, setAffixType] = useState('prefix');
  const [affixText, setAffixText] = useState('');
  const [regexPattern, setRegexPattern] = useState('');

  // Inicializar selectores cuando cambian las columnas
  useEffect(() => {
    if (columns.length > 0) {
      const first = columns[0];
      setMathCol2(prev => prev || first);
      setMergeCol2(prev => prev || first);
    }
  }, [columns]);

  // Clicks fuera para cerrar menús
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
      if (headerMenuOpen && !(event.target as Element).closest('.floating-menu-container') && !(event.target as Element).closest('.header-trigger')) {
        setHeaderMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [headerMenuOpen]);

  const closeModal = () => {
    setActiveModal(null);
    setFindText(''); setReplaceText(''); 
  };
  
  const toggleMenu = (menu: string) => setOpenMenu(openMenu === menu ? null : menu);

  const toggleHeaderMenu = (col: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (headerMenuOpen === col) {
      setHeaderMenuOpen(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      let leftPos = rect.left;
      if (leftPos + 200 > screenWidth) leftPos = rect.right - 200;
      setHeaderMenuPos({ top: rect.bottom + 5, left: leftPos });
      setActiveCol(col); 
      setHeaderMenuOpen(col);
    }
  };

  const showColumnStats = () => {
    if (!activeCol) return showToast('Selecciona columna', 'warning');
    const vals = data.map(r => r[activeCol]);
    const numVals = vals.map(v => parseFloat(v)).filter(v => !isNaN(v) && isFinite(v));
    const notNulls = vals.filter(v => v !== null && v !== '');
    
    setColStats({ 
      colName: activeCol, 
      total: vals.length, 
      filled: notNulls.length, 
      empty: vals.length - notNulls.length, 
      unique: new Set(vals).size, 
      min: numVals.length ? Math.min(...numVals) : '-', 
      max: numVals.length ? Math.max(...numVals) : '-', 
      avg: numVals.length ? (numVals.reduce((a,b) => a + b, 0) / numVals.length).toFixed(2) : '-' 
    });
    setActiveModal('stats'); 
    setOpenMenu(null);
    setHeaderMenuOpen(null);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIdx(index);
    e.dataTransfer.effectAllowed = "move";
    // Hack para ocultar el elemento visualmente pero mantenerlo
    setTimeout(() => { if(e.target instanceof HTMLElement) e.target.style.opacity = '0.5'; }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if(e.target instanceof HTMLElement) e.target.style.opacity = '1';
    setDraggedColIdx(null);
    setDropTargetIdx(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
    if (draggedColIdx !== index) {
        setDropTargetIdx(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedColIdx === null) return;
    transform.reorderColumns(draggedColIdx, targetIndex);
    setDropTargetIdx(null);
  };


  // --- RENDERIZADO SI NO HAY DATOS ---
  if (!data || data.length === 0 || columns.length === 0) return (
    <div className={`flex h-screen ${COLORS.bg}`}>
      <Sidebar currentStep="transform" setCurrentStep={() => router.push('/')} />
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 opacity-60">
        <LayoutList size={64} />
        <h2 className="mt-4 text-xl font-bold">Sin datos cargados</h2>
        <p className="text-sm">Ve a la pestaña "Fuentes de Datos" para cargar un archivo.</p>
        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg">Ir al Inicio</button>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen ${COLORS.bg} overflow-hidden`}>
      <Sidebar currentStep="transform" setCurrentStep={() => router.push('/')} />
      
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-900 relative z-10 overflow-hidden h-full"> 
        
        {/* NAVBAR SUPERIOR */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-2 flex gap-2 items-center relative z-[60] flex-wrap shadow-sm select-none" ref={menuRef}>
          
          <DropdownMenu label="Agregar Columna" icon={<PlusSquare size={16} className="text-sky-500" />} isOpen={openMenu === 'add_col'} onClick={() => toggleMenu('add_col')}>
            <DropdownSectionTitle title="General" />
            <DropdownItem icon={<FunctionSquare size={14} />} label="Columna personalizada" onClick={() => { setActiveModal('custom_col'); setOpenMenu(null); }} />
            <DropdownSectionTitle title="Condicional y Estructura" />
            <DropdownItem icon={<ListOrdered size={14} />} label="Columna de índice" onClick={() => { transform.addIndexColumn(); setOpenMenu(null); }} />
            <DropdownItem icon={<Copy size={14} />} label="Duplicar columna" onClick={() => { activeCol && transform.duplicateColumn(activeCol); setOpenMenu(null); }} disabled={!activeCol} />
          </DropdownMenu>

          <DropdownMenu label="Transformar" icon={<TableProperties size={16} />} isOpen={openMenu === 'structure'} onClick={() => toggleMenu('structure')}>
            <DropdownSectionTitle title="Tabla" />
            <DropdownItem icon={<ArrowUp size={14} />} label="Promover Encabezados" onClick={() => { transform.promoteHeaders(); setOpenMenu(null); }} />
            <DropdownItem icon={<Trash2 size={14} />} label="Eliminar Filas Sup..." onClick={() => setActiveModal('dropRows')} danger />
            <DropdownItem icon={<XCircle size={14} />} label="Eliminar Columna" onClick={() => { activeCol && transform.dropColumn(activeCol); setOpenMenu(null); }} disabled={!activeCol} danger />
            <DropdownSectionTitle title="Acciones" />
            <DropdownItem icon={<Edit3 size={14} />} label="Renombrar Columna..." onClick={() => { activeCol && setNewName(activeCol); setActiveModal('rename'); }} disabled={!activeCol} />
            <DropdownItem icon={<ArrowRightLeft size={14} />} label="Cambiar Tipo de Dato..." onClick={() => setActiveModal('type')} disabled={!activeCol} />
          </DropdownMenu>

          <DropdownMenu label="Limpieza" icon={<Wand2 size={16} />} isOpen={openMenu === 'cleaning'} onClick={() => toggleMenu('cleaning')}>
            <DropdownSectionTitle title="Texto" />
            <DropdownItem icon={<Scissors size={14} />} label="Trim (Espacios)" onClick={() => { activeCol && transform.trimText(activeCol); setOpenMenu(null); }} disabled={!activeCol} />
            <DropdownItem icon={<Binary size={14} />} label="Limpiar Símbolos" onClick={() => { activeCol && transform.cleanSymbols(activeCol); setOpenMenu(null); }} disabled={!activeCol} />
            <DropdownItem icon={<CaseUpper size={14} />} label="Nombre Propio" onClick={() => { activeCol && transform.handleCase(activeCol, 'title'); setOpenMenu(null); }} disabled={!activeCol} />
            <DropdownSectionTitle title="Valores" />
            <DropdownItem icon={<Trash2 size={14} />} label="Eliminar Duplicados" onClick={() => { transform.removeDuplicates(); setOpenMenu(null); }} />
            <DropdownItem icon={<ArrowDownToLine size={14} />} label="Rellenar Abajo (Fill)" onClick={() => { activeCol && transform.fillDown(activeCol); setOpenMenu(null); }} disabled={!activeCol} />
            <DropdownItem icon={<Edit3 size={14} />} label="Rellenar Nulos..." onClick={() => setActiveModal('fillNulls')} disabled={!activeCol} />
          </DropdownMenu>

          <DropdownMenu label="Texto/Fecha" icon={<Type size={16} />} isOpen={openMenu === 'text'} onClick={() => toggleMenu('text')}>
            <DropdownSectionTitle title="Texto" />
            <DropdownItem icon={<Split size={14} />} label="Dividir Columna" onClick={() => setActiveModal('split')} disabled={!activeCol} />
            <DropdownItem icon={<Combine size={14} />} label="Unir Columnas" onClick={() => setActiveModal('merge')} disabled={!activeCol} />
            <DropdownItem icon={<Replace size={14} />} label="Reemplazar Valor" onClick={() => setActiveModal('replace')} disabled={!activeCol} />
            <DropdownItem icon={<Code size={14} />} label="Extraer (Regex)" onClick={() => setActiveModal('regex')} disabled={!activeCol} />
            <DropdownSectionTitle title="Fechas" />
            <DropdownItem icon={<CalendarPlus size={14} />} label="Sumar Días" onClick={() => setActiveModal('addDays')} disabled={!activeCol} />
          </DropdownMenu>

          <DropdownMenu label="Cálculo" icon={<Calculator size={16} />} isOpen={openMenu === 'tools'} onClick={() => toggleMenu('tools')}>
            <DropdownItem icon={<Calculator size={14} />} label="Operar (+ - * /)..." onClick={() => setActiveModal('math')} disabled={!activeCol} />
            <DropdownItem icon={<Info size={14} />} label="Estadísticas" onClick={showColumnStats} disabled={!activeCol} />
          </DropdownMenu>
          
          <div className="h-6 w-px bg-zinc-700 mx-1"></div>
          
          <button onClick={transform.smartClean} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-colors" title="Limpieza automática inteligente">
            <Sparkles size={16} /> <span className="hidden xl:inline">Smart Clean</span>
          </button>
          
          <button onClick={() => setCompactMode(!compactMode)} title={compactMode ? "Modo Cómodo" : "Modo Compacto"} className={`p-1.5 rounded-lg transition-colors ${compactMode ? 'text-sky-500 bg-sky-500/10' : 'text-zinc-400 hover:text-zinc-200'}`}>
            {compactMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          
          <div className="flex-1"></div>
          
          <button onClick={undoLastAction} disabled={actions.length === 0} title="Deshacer última acción" className="p-1.5 text-zinc-500 hover:text-sky-500 disabled:opacity-30 transition-colors">
            <Undo2 size={18} />
          </button>
          
          {!historyOpen && (
             <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-zinc-500 hover:text-sky-500 bg-zinc-800 transition-colors">
               <History size={14} /> Historial
             </button>
          )}
        </div>

        {/* --- MODALES ACTIVOS (Asegurando que se usen las variables) --- */}
        {activeModal === 'rename' && <ModalBar title="Renombrar" onClose={closeModal}><input type="text" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-48" value={newName} onChange={e => setNewName(e.target.value)} autoFocus /><button onClick={() => { activeCol && transform.renameColumn(activeCol, newName); closeModal(); }} className="px-3 py-1 bg-sky-600 text-white rounded text-xs ml-2">Guardar</button></ModalBar>}
        
        {activeModal === 'fillNulls' && <ModalBar title="Rellenar vacíos" onClose={closeModal}><input type="text" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-32" value={fillValue} onChange={e => setFillValue(e.target.value)} /><button onClick={() => { activeCol && transform.fillNullsVar(activeCol, fillValue); closeModal(); }} className="px-3 py-1 bg-sky-600 text-white rounded text-xs ml-2">Rellenar</button></ModalBar>}
        
        {activeModal === 'math' && <ModalBar title="Cálculo" onClose={closeModal}><input type="text" placeholder="Target" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-24" value={mathTarget} onChange={e => setMathTarget(e.target.value)} /><span className="text-xs text-zinc-400">= {activeCol}</span><select className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-10 text-center font-bold" value={mathOp} onChange={e => setMathOp(e.target.value)}><option value="+">+</option><option value="-">-</option><option value="*">*</option><option value="/">/</option></select><select className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-24" value={mathCol2} onChange={e => setMathCol2(e.target.value)}>{columns.map(c=><option key={c} value={c}>{c}</option>)}</select><button onClick={() => { activeCol && transform.applyMath(activeCol, mathCol2, mathOp, mathTarget); closeModal(); }} className="px-3 py-1 bg-sky-600 text-white rounded text-xs ml-2">Calc</button></ModalBar>}

        {activeModal === 'dropRows' && <ModalBar title="Borrar Superiores" onClose={closeModal}><input type="number" min="1" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-20" value={rowsToRemove} onChange={e => setRowsToRemove(Number(e.target.value))} /><button onClick={() => { transform.removeTopRows(Number(rowsToRemove)); closeModal(); }} className="px-3 py-1 bg-red-600 text-white rounded text-xs ml-2">Borrar</button></ModalBar>}

        {activeModal === 'type' && <ModalBar title="Cambiar Tipo" onClose={closeModal}><select className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-32" value={targetType} onChange={e => setTargetType(e.target.value)}><option value="numeric">Número</option><option value="string">Texto</option><option value="date">Fecha</option></select><button onClick={() => { activeCol && transform.changeType(activeCol, targetType); closeModal(); }} className="px-3 py-1 bg-sky-600 text-white rounded text-xs ml-2">Aplicar</button></ModalBar>}

        {activeModal === 'filter' && <ModalBar title={`Filtrar: ${activeCol}`} onClose={closeModal}>
            <select className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-32" value={filterCondition} onChange={e => setFilterCondition(e.target.value)}>
                <option value="contains">Contiene</option>
                <option value="equals">Igual a</option>
                <option value="starts_with">Empieza con</option>
                <option value="greater">Mayor que</option>
                <option value="less">Menor que</option>
            </select>
            <input type="text" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-32" value={filterValue} onChange={e => setFilterValue(e.target.value)} placeholder="Valor..." />
            <button onClick={() => { activeCol && transform.applyFilter(activeCol, filterCondition, filterValue); closeModal(); }} className="px-3 py-1 bg-sky-600 text-white rounded text-xs ml-2">Aplicar</button>
        </ModalBar>}

        {activeModal === 'replace' && <ModalBar title="Reemplazar" onClose={closeModal}><input type="text" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-24" value={findText} onChange={e => setFindText(e.target.value)} placeholder="Buscar" /><span className="text-xs text-zinc-400">por</span><input type="text" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-24" value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Nuevo" /><button onClick={() => { activeCol && transform.replaceValues(activeCol, findText, replaceText); closeModal(); }} className="px-3 py-1 bg-sky-600 text-white rounded text-xs ml-2">Ok</button></ModalBar>}

        {activeModal === 'split' && <ModalBar title="Dividir Columna" onClose={closeModal}><span className="text-xs text-zinc-400">Delim:</span><input type="text" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-16 text-center" value={splitDelim} onChange={e => setSplitDelim(e.target.value)} /><button onClick={() => { activeCol && transform.splitColumn(activeCol, splitDelim); closeModal(); }} className="px-3 py-1 bg-sky-600 text-white rounded text-xs ml-2">Dividir</button></ModalBar>}

        {activeModal === 'merge' && <ModalBar title="Unir Columnas" onClose={closeModal}><select className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-24" value={mergeCol2} onChange={e=>setMergeCol2(e.target.value)}>{columns.filter(c=>c!==activeCol).map(c=><option key={c} value={c}>{c}</option>)}</select><span className="text-xs text-zinc-400">Sep:</span><input type="text" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-10 text-center" value={mergeSep} onChange={e=>setMergeSep(e.target.value)} /><button onClick={() => { activeCol && transform.mergeColumns(activeCol, mergeCol2, mergeSep); closeModal(); }} className="px-3 py-1 bg-sky-600 text-white rounded text-xs ml-2">Unir</button></ModalBar>}

        {activeModal === 'regex' && <ModalBar title="Extraer Regex" onClose={closeModal}><input type="text" className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs w-32 font-mono" value={regexPattern} onChange={e=>setRegexPattern(e.target.value)} placeholder="Ej: [0-9]+" /><button onClick={() => { activeCol && transform.applyRegexExtract(activeCol, regexPattern); closeModal(); }} className="px-3 py-1 bg-sky-600 text-white rounded text-xs ml-2">Extraer</button></ModalBar>}


        {/* Modal Estadísticas */}
        {activeModal === 'stats' && colStats && (
          <div className="absolute top-16 right-4 z-50 bg-[#18181b] border border-zinc-700 p-4 rounded-xl shadow-2xl w-64 animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2">
              <h3 className="font-bold text-zinc-200 flex items-center gap-2"><Info size={16} className="text-sky-500"/> Estadísticas</h3>
              <button onClick={() => setActiveModal(null)}><XCircle size={16} className="text-zinc-500 hover:text-red-400"/></button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-zinc-400">Columna:</span> <span className="font-bold text-sky-500 truncate max-w-[120px]">{colStats.colName}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Llenos:</span> <span className="text-green-400">{colStats.filled}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Vacíos:</span> <span className="text-red-400">{colStats.empty}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Únicos:</span> <span className="text-blue-400">{colStats.unique}</span></div>
              <div className="border-t border-zinc-700 my-2"></div>
              <div className="flex justify-between"><span className="text-zinc-400">Min:</span> <span className="text-zinc-300">{colStats.min}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Max:</span> <span className="text-zinc-300">{colStats.max}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Promedio:</span> <span className="text-zinc-300">{colStats.avg}</span></div>
            </div>
          </div>
        )}

        {/* MENU FLOTANTE DE COLUMNA */}
        {headerMenuOpen && (
            <div 
                className="floating-menu-container fixed bg-[#18181b] rounded-lg shadow-2xl border border-zinc-700 z-[9999] flex flex-col py-1 text-zinc-300 text-xs w-48"
                style={{ top: headerMenuPos.top, left: headerMenuPos.left }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 text-[10px] uppercase text-zinc-500 font-bold tracking-wider bg-zinc-900 mb-1 border-b border-zinc-800 truncate">
                    Columna: {headerMenuOpen}
                </div>
                <button onClick={() => { transform.sortData(headerMenuOpen, 'asc'); setHeaderMenuOpen(null); }} className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-left"><ArrowDownAZ size={14} /> Ordenar A-Z</button>
                <button onClick={() => { transform.sortData(headerMenuOpen, 'desc'); setHeaderMenuOpen(null); }} className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-left"><ArrowUpAZ size={14} /> Ordenar Z-A</button>
                <div className="border-t border-zinc-800 my-1"></div>
                <button onClick={() => { transform.moveColumn(headerMenuOpen, 'left'); setHeaderMenuOpen(null); }} className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-left"><ArrowLeft size={14} /> Mover Izquierda</button>
                <button onClick={() => { transform.moveColumn(headerMenuOpen, 'right'); setHeaderMenuOpen(null); }} className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-left"><ArrowRight size={14} /> Mover Derecha</button>
                <button onClick={() => { transform.duplicateColumn(headerMenuOpen); setHeaderMenuOpen(null); }} className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-left"><Copy size={14} /> Duplicar Columna</button>
                
                <div className="border-t border-zinc-800 my-1"></div>
                
                <button onClick={() => { setActiveModal('filter'); setHeaderMenuOpen(null); }} className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-left text-sky-500 font-bold"><Filter size={14} /> Filtrar...</button>
                <button onClick={() => { setActiveModal('rename'); setHeaderMenuOpen(null); }} className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-left"><Edit3 size={14} /> Renombrar</button>
                
                <div className="border-t border-zinc-800 my-1"></div>
                
                <button onClick={() => { transform.dropColumn(headerMenuOpen); setHeaderMenuOpen(null); }} className="px-3 py-2 hover:bg-red-900/20 text-red-400 flex items-center gap-2 text-left"><Trash2 size={14} /> Eliminar Columna</button>
            </div>
        )}

        {/* --- DATAGRID (TABLA PRINCIPAL) --- */}
        <div className="flex-1 overflow-auto relative custom-scrollbar bg-zinc-900 z-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-950 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className={`w-12 text-center text-xs font-medium text-zinc-500 border-b border-zinc-800 ${compactMode ? 'p-1' : 'p-3'}`}>#</th>
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    onClick={() => setActiveCol(col)} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`relative group cursor-pointer transition-colors border-b border-zinc-800 ${compactMode ? 'p-2' : 'p-3'} ${activeCol === col ? 'bg-sky-500/10 text-sky-500 border-b-2 border-sky-500' : 'hover:bg-zinc-800 text-zinc-400'} ${dropTargetIdx === idx ? 'border-l-4 border-l-sky-500 bg-sky-500/5' : ''}`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <GripVertical size={12} className="text-zinc-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="truncate max-w-[130px]">{col}</span>
                        </div>
                        <button 
                          onClick={(e) => toggleHeaderMenu(col, e)} 
                          className={`header-trigger p-1 rounded hover:bg-zinc-700 transition-colors opacity-50 group-hover:opacity-100 ${headerMenuOpen === col ? 'opacity-100 bg-zinc-700 text-sky-500' : ''}`}
                        >
                           <MoreVertical size={14} />
                        </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
              {data.slice(0, 100).map((row, i) => (
                <tr key={i} className="hover:bg-sky-500/5 group transition-colors">
                  <td className={`text-center text-xs text-zinc-600 font-mono border-r border-zinc-800 ${compactMode ? 'py-1' : 'py-3'}`}>{i + 1}</td>
                  {columns.map((col, j) => (
                    <td key={j} className={`text-sm text-zinc-300 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis ${compactMode ? 'p-1.5' : 'p-3'} ${activeCol === col ? 'bg-sky-500/5 font-medium' : ''}`}>
                      {row[col] === null ? <span className="text-zinc-600 italic text-xs">null</span> : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- HISTORIAL LATERAL --- */}
      <div className={`transition-all duration-300 ease-in-out bg-[#18181b] flex flex-col shadow-2xl relative z-30 h-full border-l border-zinc-800 overflow-hidden ${historyOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-0'}`}>
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center h-[53px]">
          <h3 className="font-bold text-zinc-200 flex items-center gap-2 text-sm"><History size={16} className="text-sky-500" /> Historial</h3>
          <button onClick={() => setHistoryOpen(false)} className="text-zinc-500 hover:text-red-500 transition-colors"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#18181b]">
          {actions.length === 0 ? (
            <div className="text-center mt-10 opacity-50"><History size={40} className="mx-auto mb-2 text-zinc-600"/><p className="text-xs text-zinc-500">Sin cambios</p></div>
          ) : (
            actions.map((action, idx) => (
              <div key={idx} className="group relative pl-4 pb-4 border-l-2 border-zinc-800 last:border-0 last:pb-0">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-sky-600 border-4 border-[#18181b]"></div>
                 <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 hover:border-sky-500/30 transition-colors cursor-pointer relative pr-8">
                   <div className="flex justify-between items-start mb-1"><span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">{action.type}</span><span className="text-[10px] text-zinc-600 font-mono">#{idx+1}</span></div>
                   <p className="text-xs text-zinc-500 leading-relaxed">{action.description}</p>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}