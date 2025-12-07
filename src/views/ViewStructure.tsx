// Vista para definir la estructura de columnas maestras
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';

interface ViewStructureProps {
  columns: string[];
  setColumns: React.Dispatch<React.SetStateAction<string[]>>;
  filesLength: number;
}

export default function ViewStructure({ columns, setColumns, filesLength }: ViewStructureProps) {
  const [newCol, setNewCol] = useState("");

  const addCol = () => {
    if (newCol.trim()) {
      setColumns([...columns, newCol.trim()]);
      setNewCol("");
    }
  };

  const autoDetect = () => {
    if (filesLength > 0) {
      setColumns(["ID_Producto", "Nombre_Producto", "Fecha_Venta", "Precio_Unitario", "Cantidad", "Total_Venta", "Cliente_Email"]);
    } else {
      alert("Por favor carga un archivo primero en el paso 1.");
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Definición de Estructura Final" action={<Button variant="ghost" onClick={autoDetect}>✨ Auto-Detectar</Button>}>
        <div className="flex gap-4 mb-6">
          <Input 
            value={newCol} 
            onChange={(e) => setNewCol(e.target.value)} 
            placeholder="Nombre de la nueva columna maestra..." 
          />
          <Button onClick={addCol}><Plus className="w-4 h-4" /> Agregar</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {columns.map((col, idx) => (
            <span key={idx} className="bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-sm text-sky-400 flex items-center gap-2">
              {col}
              <button onClick={() => setColumns(columns.filter((_, i) => i !== idx))} className="hover:text-red-400">×</button>
            </span>
          ))}
          {columns.length === 0 && <span className="text-zinc-500 italic">No hay columnas definidas aún.</span>}
        </div>
      </Card>

      <Card title="Reglas de Limpieza Globales" action={null}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["Recortar Espacios (Trim)", "Mayúsculas (UPPER)", "Eliminar Duplicados", "Normalizar Fechas", "Limpiar Símbolos Moneda"].map((rule, idx) => (
            <label key={idx} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg cursor-pointer hover:bg-zinc-900">
              <input type="checkbox" className="w-5 h-5 rounded border-zinc-600 text-sky-600 bg-zinc-800 focus:ring-sky-600 ring-offset-zinc-900" defaultChecked={idx === 0} />
              <span className="text-zinc-300">{rule}</span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}