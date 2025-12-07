import { useData } from '@/context/DataContext';

// --- HELPERS DE SEGURIDAD ---
const safeStr = (val: any) => (val === null || val === undefined) ? '' : String(val);

const safeNum = (val: any) => {
  if (val === null || val === undefined || val === '') return NaN;
  // Reemplazamos comas por puntos si es necesario y limpiamos símbolos de moneda
  const cleanVal = String(val).replace(/,/g, '').replace('$', '').replace('€', '');
  const n = parseFloat(cleanVal);
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
              
              // Eliminar duplicados simples
              const seen = new Set();
              newData = newData.filter(el => {
                const txt = JSON.stringify(el);
                const duplicate = seen.has(txt);
                seen.add(txt);
                return !duplicate;
              });
              break;
          case 'DROP_DUPLICATES':
              const seenDup = new Set();
              newData = newData.filter(el => {
                const txt = JSON.stringify(el);
                const duplicate = seenDup.has(txt);
                seenDup.add(txt);
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
          case 'CLEAN_SYMBOLS':
              newData = newData.map(r => ({...r, [action.col]: safeStr(r[action.col]).replace(/[^a-zA-Z0-9\s.-]/g, '') }));
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
                  let res: any = null;
                  if(!isNaN(v1)&&!isNaN(v2)){
                      if(action.op==='+') res=v1+v2; 
                      if(action.op==='-') res=v1-v2;
                      if(action.op==='*') res=v1*v2; 
                      if(action.op==='/') res=v2!==0?v1/v2:0;
                  }
                  return {...r, [action.target]: res};
              });
              if(!newCols.includes(action.target)) newCols=[...newCols, action.target];
              break;
          case 'SORT':
              newData.sort((a,b) => {
                  const valA = a[action.col];
                  const valB = b[action.col];
                  if (valA < valB) return action.dir === 'asc' ? -1 : 1;
                  if (valA > valB) return action.dir === 'asc' ? 1 : -1;
                  return 0;
              });
              break;
          // --- NUEVAS ACCIONES QUE FALTABAN ---
          case 'CHANGE_TYPE':
              newData = newData.map(r => {
                  let val = r[action.col];
                  if(action.targetType === 'numeric') val = safeNum(val);
                  else if(action.targetType === 'string') val = safeStr(val);
                  else if(action.targetType === 'date') val = new Date(val).toISOString().split('T')[0];
                  return { ...r, [action.col]: val };
              });
              break;
          case 'FILTER':
              newData = newData.filter(r => {
                  const val = String(r[action.col] || '').toLowerCase();
                  const criteria = String(action.val).toLowerCase();
                  if(action.condition === 'contains') return val.includes(criteria);
                  if(action.condition === 'equals') return val === criteria;
                  if(action.condition === 'starts_with') return val.startsWith(criteria);
                  if(action.condition === 'greater') return safeNum(r[action.col]) > safeNum(action.val);
                  if(action.condition === 'less') return safeNum(r[action.col]) < safeNum(action.val);
                  return true;
              });
              break;
          case 'REPLACE':
              newData = newData.map(r => ({
                  ...r,
                  [action.col]: String(r[action.col]) === String(action.find) ? action.replace : r[action.col]
              }));
              break;
          case 'REGEX_EXTRACT':
              try {
                  const regex = new RegExp(action.pattern);
                  newData = newData.map(r => {
                      const match = String(r[action.col] || '').match(regex);
                      return { ...r, [action.col]: match ? match[0] : null };
                  });
              } catch (e) {
                  console.error("Regex inválido");
              }
              break;
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
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns); 
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
      const action = { type: 'SORT', col, dir };
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns); 
      logAction(action); 
  };

  const duplicateColumn = (col: string) => {
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

  // --- LAS FUNCIONES QUE FALTABAN Y CAUSABAN EL ERROR ---

  const removeTopRows = (count: number) => {
      const action = { type: 'DROP_TOP_ROWS', count };
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns);
      logAction({ ...action, description: `Eliminar ${count} filas sup.` });
  };

  const changeType = (col: string, targetType: string) => {
      const action = { type: 'CHANGE_TYPE', col, targetType };
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns);
      logAction({ ...action, description: `Tipo ${col} -> ${targetType}` });
  };

  const applyFilter = (col: string, condition: string, val: string) => {
      const action = { type: 'FILTER', col, condition, val };
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns);
      logAction({ ...action, description: `Filtro en ${col}` });
  };

  const replaceValues = (col: string, find: string, replace: string) => {
      const action = { type: 'REPLACE', col, find, replace };
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns);
      logAction({ ...action, description: `Reemplazar en ${col}` });
  };

  const splitColumn = (col: string, delim: string) => {
      const action = { type: 'SPLIT', col, delim };
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns);
      logAction({ ...action, description: `Dividir ${col}` });
  };

  const mergeColumns = (col1: string, col2: string, sep: string) => {
      const action = { type: 'MERGE_COLS', col1, col2, sep };
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns);
      logAction({ ...action, description: `Unir ${col1} + ${col2}` });
  };

  const applyRegexExtract = (col: string, pattern: string) => {
      const action = { type: 'REGEX_EXTRACT', col, pattern };
      const res = applyActionLogic(data, columns, action);
      updateDataState(res.data, res.columns);
      logAction({ ...action, description: `Regex en ${col}` });
  };


  return {
    deleteActionFromHistory,
    applyBatchTransform,
    promoteHeaders, smartClean, dropColumn, renameColumn, trimText, fillDown,
    removeDuplicates, addIndexColumn, cleanSymbols, handleCase, applyMath, sortData,
    duplicateColumn, reorderColumns, moveColumn, fillNullsVar,
    // --- EXPORTAMOS LAS NUEVAS FUNCIONES ---
    removeTopRows, changeType, applyFilter, replaceValues, 
    splitColumn, mergeColumns, applyRegexExtract
  };
}