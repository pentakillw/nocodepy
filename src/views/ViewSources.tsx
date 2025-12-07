// Vista para la gestión y carga de archivos fuente
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Trash2, Plus, UploadCloud } from 'lucide-react';
import Button from '@/components/Button';
import { COLORS } from '@/utils/constants';

interface FileData {
  id: number;
  name: string;
  size: string;
  sheet: string;
  headerRow: number;
  fileObj: File;
}

interface ViewSourcesProps {
  files: FileData[];
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
}

export default function ViewSources({ files, setFiles }: ViewSourcesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles).map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        sheet: "Hoja1",
        headerRow: 1,
        fileObj: file
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
    event.target.value = ''; 
  };

  const removeFile = (id: number) => {
    setFiles(files.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Fuentes de Datos</h2>
          <p className="text-zinc-400">Gestiona los archivos de origen (Excel .xlsx, .xls o .csv)</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden" 
            accept=".xlsx, .xls, .csv"
            multiple 
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
            <Plus className="w-4 h-4" /> Agregar Archivo Real
          </Button>
          <Button onClick={() => alert("Archivos listos en memoria.")}>
            <UploadCloud className="w-4 h-4" /> Verificar Carga
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {files.map(file => (
            <motion.div 
              key={file.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`${COLORS.card} border ${COLORS.border} p-4 rounded-lg flex items-center justify-between`}
            >
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 p-3 rounded-lg">
                  <FileSpreadsheet className="text-emerald-500 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{file.name}</h4>
                  <p className="text-xs text-zinc-500">{file.size} • {file.sheet}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-500">Fila Header:</label>
                  <input type="number" defaultValue={file.headerRow} className="bg-zinc-900 w-16 px-2 py-1 rounded text-center text-sm border border-zinc-700 text-white" />
                </div>
                <Button variant="danger" onClick={() => removeFile(file.id)} className="px-3">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {files.length === 0 && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:border-sky-500/50 hover:text-zinc-400 cursor-pointer transition-colors"
          >
            <p>No hay archivos seleccionados.</p>
            <p className="text-sm mt-2">Haz clic aquí para buscar en tu PC</p>
          </div>
        )}
      </div>
    </div>
  );
}