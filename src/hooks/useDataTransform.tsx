import { useData } from '@/context/DataContext';

// --- HELPERS DE SEGURIDAD ---
const safeStr = (val: any) => (val === null || val === undefined) ? '' : String(val);
const safeNum = (val: any) => {
  if (val === null || val === undefined || val === '') return NaN;
  const n = parseFloat(val);
  return isFinite(n) ? n : NaN;
};
const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

export function useDataTransform() {
  const { 
    data, columns, actions, 
    originalData, originalColumns,
    updateDataState, updateActionsState, logAction, showToast 
  } = useData();

  // ==========================================
  // 1. MOTOR DE TRANSFORMACIÓN (LÓGICA PURA)
  // ==========================================
  const applyActionLogic = (currentData: any[], currentCols: string[], action: any) => {
      let newData = [...currentData];
      let newCols = [...currentCols];

      switch (action.type) {
          case 'DROP_COLUMN':
              newData = newData.map(row => { const r = {...row}; delete r[action.col]; return r; });
              newCols = newCols.filter(c => c !== action.col);
              break;
          case 'RENAME':
              newData = newData.map(r => { const nr = {...r}; nr[action.newVal] = nr[action.col]; delete nr[action.col]; return nr; });
              newCols = newCols.map(c => c === action.col ? action.newVal : c);
              break;
          case 'REORDER_COLS':
              newCols = action.newOrder;
              break;
          case 'ADD_INDEX':
              if(!newCols.includes('ID')) newCols = ['ID', ...newCols];
              newData = newData.map((r, i) => ({ 'ID': i+1, ...r }));
              break;
          case 'DROP_TOP_ROWS':
              newData = newData.slice(action.count);
              break;
          case 'SMART_CLEAN':
              newData = newData.map(row => {
                  const newRow: any = {};
                  Object.keys(row).forEach(key => {
                      let val = row[key];
                      if (typeof val === 'string') { val = val.trim(); if (['null', 'nan', ''].includes(val.toLowerCase())) val = null; }
                      newRow[key] = val;
                  });
                  return newRow;
              }).filter(row => Object.values(row).some(v => v !== null && v !== ''));
              // Drop duplicates basic implementation
              const seen = new Set();
              newData = newData.filter(el => {
                const duplicate = seen.has(JSON.stringify(el));
                seen.add(JSON.stringify(el));
                return !duplicate;
              });
              break;
          case 'DROP_DUPLICATES':
              const seenDup = new Set();
              newData = newData.filter(el => {
                const duplicate = seenDup.has(JSON.stringify(el));
                seenDup.add(JSON.stringify(el));
                return !duplicate;
              });
              break;
          case 'FILL_DOWN':
              let last: any = null;
              newData = newData.map(r => { const v = r[action.col]; if(v!==null && v!=='') last = v; return {...r, [action.col]: last}; });
              break;
          case 'FILL_NULLS':
              newData = newData.map(r => ({...r, [action.col]: (r[action.col]===null || r[action.col]==='') ? action.val : r[action.col]}));
              break;
          case 'TRIM':
              newData = newData.map(r => ({...r, [action.col]: safeStr(r[action.col]).trim()}));
              break;
          case 'CASE_CHANGE':
              newData = newData.map(r => {
                  let v = safeStr(r[action.col]);
                  if(action.mode==='upper') v=v.toUpperCase();
                  if(action.mode==='lower') v=v.toLowerCase();
                  if(action.mode==='title') v=v.toLowerCase().replace(/(?:^|\s)\S/g, a=>a.toUpperCase());
                  return {...r, [action.col]: v};
              });
              break;
          case 'SPLIT':
              const c1 = `${action.col}_1`, c2 = `${action.col}_2`;
              newData = newData.map(r => { const p = safeStr(r[action.col]).split(action.delim); return {...r, [c1]: p[0]||'', [c2]: p.slice(1).join(action.delim)||''}; });
              if(!newCols.includes(c1)) newCols = [...newCols, c1, c2];
              break;
          case 'MERGE_COLS':
              const nm = `${action.col1}_${action.col2}`;
              newData = newData.map(r => ({...r, [nm]: `${safeStr(r[action.col1])}${action.sep}${safeStr(r[action.col2])}` }));
              if(!newCols.includes(nm)) newCols = [...newCols, nm];
              break;
          case 'CALC_MATH':
              newData = newData.map(r => {
                  const v1=safeNum(r[action.col1]), v2=safeNum(r[action.col2]);
                  let res=null;
                  if(!isNaN(v1)&&!isNaN(v2)){
                      if(action.op==='+') res=v1+v2; if(action.op==='-') res=v1-v2;
                      if(action.op==='*') res=v1*v2; if(action.op==='/') res=v2!==0?v1/v2:0;
                  }
                  return {...r, [action.target]: res};
              });
              if(!newCols.includes(action.target)) newCols=[...newCols, action.target];
              break;
          case 'SORT':
              newData.sort((a,b) => a[action.col] > b[action.col] ? (action.dir==='asc'?1:-1) : (action.dir==='asc'?-1:1));
              break;
          // ... (Más casos se pueden agregar aquí)
      }
      return { data: newData, columns: newCols };
  };

  // ==========================================
  // 2. FUNCIÓN PARA APLICAR LOTE DE ACCIONES
  // ==========================================
  const applyBatchTransform = (initialData: any[], initialCols: string[], actionsToApply: any[]) => {
      let currentData = [...initialData];
      let currentCols = [...initialCols];

      try {
          actionsToApply.forEach(action => {
              const res = applyActionLogic(currentData, currentCols, action);
              currentData = res.data;
              currentCols = res.columns;
          });
          return { data: currentData, columns: currentCols };
      } catch (err) {
          console.error("Error aplicando batch:", err);
          return { data: initialData, columns: initialCols }; 
      }
  };

  const deleteActionFromHistory = (indexToDelete: number) => {
      if (!originalData || originalData.length === 0) {
          showToast('No se puede recalcular: Faltan datos originales. Recarga el archivo.', 'error');
          return;
      }
      const newActions = actions.filter((_, idx) => idx !== indexToDelete);
      
      const res = applyBatchTransform(originalData, originalColumns, newActions);
      
      updateDataState(res.data, res.columns);
      updateActionsState(newActions); 
      showToast('Tabla recalculada.', 'success');
  };

  // --- UI WRAPPERS (Funciones públicas) ---
  const promoteHeaders = () => { 
      if (data.length < 1) return; 
      const newHeaders = columns.map(c => safeStr(data[0][c]).trim() || c); 
      const newData = data.slice(1).map(r => { 
          const nr: any = {}; 
          columns.forEach((old, i) => nr[newHeaders[i]] = r[old]); 
          return nr; 
      }); 
      updateDataState(newData, newHeaders); 
      logAction({ type: 'PROMOTE_HEADER', description: 'Promover encabezados' }); 
  };

  const smartClean = () => { 
      const action = { type: 'SMART_CLEAN' }; 
      const res = applyActionLogic(data, columns, action); 
      updateDataState(res.data, res.columns); 
      logAction({ ...action, description: 'Smart Clean' }); 
  };

  const dropColumn = (col: string) => { 
      const action = { type: 'DROP_COLUMN', col }; 
      const res = applyActionLogic(data, columns, action); 
      updateDataState(res.data, res.columns); 
      logAction({ ...action, description: `Eliminar ${col}` }); 
  };

  const renameColumn = (col: string, newVal: string) => { 
      const action = { type: 'RENAME', col, newVal }; 
      const res = applyActionLogic(data, columns, action); 
      updateDataState(res.data, res.columns); 
      logAction({ ...action, description: `Renombrar ${col} -> ${newVal}` }); 
  };

  const trimText = (col: string) => { 
      const action = { type: 'TRIM', col }; 
      const res = applyActionLogic(data, columns, action); 
      updateDataState(res.data, res.columns); 
      logAction({ ...action, description: `Trim ${col}` }); 
  };

  const fillDown = (col: string) => { 
      const action = { type: 'FILL_DOWN', col }; 
      const res = applyActionLogic(data, columns, action); 
      updateDataState(res.data, res.columns); 
      logAction({ ...action, description: `Fill Down ${col}` }); 
  };

  const removeDuplicates = () => { 
      const action = { type: 'DROP_DUPLICATES' }; 
      const res = applyActionLogic(data, columns, action); 
      updateDataState(res.data, res.columns); 
      logAction({ ...action, description: 'Eliminar duplicados' }); 
  };

  const addIndexColumn = () => { 
      const action = { type: 'ADD_INDEX' }; 
      const res = applyActionLogic(data, columns, action); 
      updateDataState(res.data, res.columns); 
      logAction({ ...action, description: 'Agregar Índice' }); 
  };

  const cleanSymbols = (col: string) => { 
      const action = { type: 'CLEAN_SYMBOLS', col }; 
      const newData = data.map(r => ({...r, [col]: safeStr(r[col]).replace(/[^a-zA-Z0-9\s]/g, '') })); 
      updateDataState(newData, columns); 
      logAction({ ...action, description: `Limpiar símbolos ${col}` }); 
  };

  const handleCase = (col: string, mode: string) => { 
      const action = { type: 'CASE_CHANGE', col, mode }; 
      const res = applyActionLogic(data, columns, action); 
      updateDataState(res.data, res.columns); 
      logAction({ ...action, description: `Case ${mode}` }); 
  };

  const applyMath = (col1: string, col2: string, op: string, target: string) => { 
      const action = { type: 'CALC_MATH', col1, col2, op, target }; 
      const res = applyActionLogic(data, columns, action); 
      updateDataState(res.data, res.columns); 
      logAction({ ...action, description: `Calc ${target}` }); 
  };

  const sortData = (col: string, dir: 'asc' | 'desc') => { 
      const sorted = [...data].sort((a,b) => a[col] > b[col] ? (dir==='asc'?1:-1) : (dir==='asc'?-1:1)); 
      updateDataState(sorted, columns); 
      logAction({ type: 'SORT', col, dir }); 
  };

  const duplicateColumn = (col: string) => {
      // Simula duplicación agregando una columna copia
      const newCol = `${col}_copy`;
      const newData = data.map(r => ({...r, [newCol]: r[col]}));
      updateDataState(newData, [...columns, newCol]);
      logAction({ type: 'DUPLICATE', col, newCol, description: `Duplicar ${col}` });
  };

  const reorderColumns = (from: number, to: number) => {
      const newOrder = [...columns];
      const [moved] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, moved);
      const action = { type: 'REORDER_COLS', newOrder };
      updateDataState(data, newOrder);
      logAction(action);
  };

  const moveColumn = (col: string, direction: 'left' | 'right') => {
      const idx = columns.indexOf(col);
      if (idx === -1) return;
      const newIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (newIdx >= 0 && newIdx < columns.length) {
          reorderColumns(idx, newIdx);
      }
  };

  const fillNullsVar = (col: string, val: string) => {
      const action = { type: 'FILL_NULLS', col, val };
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns);
      logAction({ ...action, description: `Rellenar ${col} con "${val}"` });
  };

  return {
    deleteActionFromHistory,
    applyBatchTransform,
    promoteHeaders, smartClean, dropColumn, renameColumn, trimText, fillDown,
    removeDuplicates, addIndexColumn, cleanSymbols, handleCase, applyMath, sortData,
    duplicateColumn, reorderColumns, moveColumn, fillNullsVar
  };
}