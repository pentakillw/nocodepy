'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
// Asegúrate de que la ruta a supabase sea correcta en tu proyecto
import { supabase } from '@/lib/supabase';

// Definimos tipos básicos para TypeScript
type DataRow = Record<string, any>;
type Action = { type: string; description?: string; [key: string]: any };
type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' };

interface DataContextType {
  data: DataRow[];
  columns: string[];
  setData: React.Dispatch<React.SetStateAction<DataRow[]>>;
  setColumns: React.Dispatch<React.SetStateAction<string[]>>;
  fileName: string | null;
  setFileName: React.Dispatch<React.SetStateAction<string | null>>;
  actions: Action[];
  history: any[];
  originalData: DataRow[];
  originalColumns: string[]; 
  loadNewData: (newData: DataRow[], newCols: string[], fName: string) => void;
  updateDataState: (d: DataRow[], c: string[]) => void;
  updateActionsState: (newActions: Action[]) => void;
  logAction: (actionObj: Action) => void;
  undoLastAction: () => void;
  deleteAction: (index: number) => void;
  resetWorkspace: () => void;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  userTier: 'free' | 'pro';
  // --- CORRECCIÓN APLICADA AQUÍ ---
  setUserTier: React.Dispatch<React.SetStateAction<'free' | 'pro'>>; 
  // --------------------------------
  planLimits: { maxRows: number; maxFiles: number; exportCode: boolean };
  filesUploadedCount: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // --- ESTADOS DE DATOS ---
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  
  const [originalData, setOriginalData] = useState<DataRow[]>([]);
  const [originalColumns, setOriginalColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<any[]>([]);
  const [actions, setActions] = useState<Action[]>([]); 

  // --- SUSCRIPCIÓN & USUARIO ---
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free'); // Por defecto free
  const [uploadsUsed, setUploadsUsed] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // --- 1. TOASTS (Notificaciones) ---
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = crypto.randomUUID(); 
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 3000);
  }, []);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- 2. CARGA MAESTRA DE DATOS ---
  const loadNewData = (newData: DataRow[], newCols: string[], fName: string) => {
      setData(newData);
      setColumns(newCols);
      setOriginalData(newData); 
      setOriginalColumns(newCols);
      setFileName(fName);
      setHistory([]);
      setActions([]);
  };

  // --- 3. GESTIÓN DE ACCIONES ---
  const updateDataState = (d: DataRow[], c: string[]) => { 
      setData(d);
      setColumns(c); 
  };
  
  const updateActionsState = (newActions: Action[]) => {
      setActions(newActions);
      // Aquí iría la lógica de guardar en BD si estuviera activa
  };

  const logAction = (actionObj: Action) => {
    // Guardamos el estado ANTES del cambio para poder deshacer
    setHistory(prev => [...prev, { data: [...data], columns: [...columns] }]);
    const actionWithTime = { ...actionObj, timestamp: new Date().toLocaleTimeString() };
    setActions(prev => {
        const updated = [...prev, actionWithTime];
        return updated;
    });
    showToast(`Acción: ${actionObj.description || actionObj.type}`, 'success');
  };

  const undoLastAction = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setData(lastState.data);
    setColumns(lastState.columns);
    setHistory(prev => prev.slice(0, -1));
    setActions(prev => prev.slice(0, -1));
    showToast('Deshecho', 'info');
  };

  const deleteAction = (index: number) => {
    // Lógica compleja para recalcular desde el inicio (requiere el hook de transformación)
    // Por simplicidad en esta fase, solo permitimos deshacer el último si coincide
    if (index === actions.length - 1) {
        undoLastAction();
    } else {
        showToast('Por seguridad, usa "Deshacer" para ir paso a paso.', 'warning');
    }
  };

  const resetWorkspace = () => {
    setData([]); setColumns([]); setFileName(null); setHistory([]); setActions([]); setCurrentFileId(null);
    setOriginalData([]); setOriginalColumns([]);
    showToast('Espacio de trabajo limpiado.', 'warning');
  };

  const PLAN_LIMITS = {
    free: { maxRows: 1000, maxFiles: 3, exportCode: false },
    pro: { maxRows: 1000000, maxFiles: 50, exportCode: true } 
  };

  const value = {
    data, setData, 
    columns, setColumns,
    fileName, setFileName, 
    actions, history,
    originalData, originalColumns, 
    loadNewData, updateDataState, updateActionsState,
    logAction, undoLastAction, deleteAction, resetWorkspace, 
    toasts, showToast, removeToast,
    userTier, setUserTier, planLimits: PLAN_LIMITS[userTier],
    filesUploadedCount: uploadsUsed
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() { 
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context; 
}