'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, X, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { fileService } from '../../lib/services/fileService';
import toast from 'react-hot-toast';

const FileUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ file, nombre }: { file: File; nombre?: string }) =>
      fileService.uploadFile(file, nombre),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Archivo subido y cifrado exitosamente');
      setSelectedFile(null);
      setCustomName('');
      setUploading(false);
    },
    onError: (error: any) => {
      toast.error('Error al subir el archivo: ' + (error.response?.data?.message ?? 'Error desconocido'));
      setUploading(false);
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Verificar que sea PDF
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        return;
      }
      
      // Verificar tamaño máximo (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('El archivo no puede ser mayor a 50MB');
        return;
      }
      
      setSelectedFile(file);
      setCustomName(file.name.replace('.pdf', ''));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    uploadMutation.mutate({
      file: selectedFile,
      nombre: customName.trim() || undefined
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
    setCustomName('');
  };

  const formatFileSize = (bytes: number): string => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-semibold text-gray-900'>Subir Archivo Seguro</h1>
        <p className='mt-2 text-sm text-gray-700'>
          Los archivos se cifrarán automáticamente antes de almacenarse
        </p>
      </div>

      {/* Información de seguridad */}
      <div className='bg-blue-50 border border-blue-200 rounded-md p-4 mb-6'>
        <div className='flex'>
          <Lock className='h-5 w-5 text-blue-400' />
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-blue-800'>
              Seguridad Garantizada
            </h3>
            <div className='mt-2 text-sm text-blue-700'>
              <ul className='list-disc list-inside space-y-1'>
                <li>Cifrado AES-256 antes del almacenamiento</li>
                <li>Verificación de integridad con checksum SHA-256</li>
                <li>Solo archivos PDF permitidos</li>
                <li>Tamaño máximo: 50MB por archivo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Zona de drag & drop */}
      <div className='bg-white shadow rounded-lg'>
        <div className='px-4 py-5 sm:p-6'>
          <div
            {...getRootProps()}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className='space-y-1 text-center'>
              <Upload className={`mx-auto h-12 w-12 ${isDragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
              <div className='flex text-sm text-gray-600'>
                <input {...getInputProps()} />
                <p>
                  <span className='font-medium text-indigo-600 hover:text-indigo-500'>
                    Haz clic para seleccionar
                  </span>{' '}
                  o arrastra y suelta un archivo PDF aquí
                </p>
              </div>
              <p className='text-xs text-gray-500'>
                Solo archivos PDF hasta 50MB
              </p>
            </div>
          </div>

          {/* Archivo seleccionado */}
          {selectedFile && (
            <div className='mt-6'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <FileText className='h-8 w-8 text-red-600 mr-3' />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {selectedFile.name}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={removeFile}
                    className='text-gray-400 hover:text-gray-600'
                    title='Quitar archivo'
                  >
                    <X className='h-5 w-5' />
                  </button>
                </div>

                {/* Campo para nombre personalizado */}
                <div className='mt-4'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Nombre del documento (opcional)
                  </label>
                  <input
                    type='text'
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                    placeholder='Ingresa un nombre personalizado para el documento'
                  />
                  <p className='mt-1 text-sm text-gray-500'>
                    Si no especificas un nombre, se usará el nombre original del archivo
                  </p>
                </div>

                {/* Botón de subida */}
                <div className='mt-6 flex justify-end space-x-3'>
                  <button
                    type='button'
                    onClick={removeFile}
                    className='bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  >
                    Cancelar
                  </button>
                  <button
                    type='button'
                    onClick={handleUpload}
                    disabled={uploading}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
                  >
                    {uploading ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        Subiendo y cifrando...
                      </>
                    ) : (
                      <>
                        <Lock className='h-4 w-4 mr-2' />
                        Subir archivo seguro
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estado de carga */}
      {uploading && (
        <div className='mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4'>
          <div className='flex'>
            <AlertCircle className='h-5 w-5 text-yellow-400' />
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-yellow-800'>
                Procesando archivo...
              </h3>
              <div className='mt-2 text-sm text-yellow-700'>
                <p>El archivo se está cifrando y almacenando de forma segura. Por favor espera.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
