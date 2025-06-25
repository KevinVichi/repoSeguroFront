'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, X, AlertCircle, Lock, AlertTriangle } from 'lucide-react';
import { fileService } from '../../lib/services/fileService';
import toast from 'react-hot-toast';

const FileUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [userKey, setUserKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ file, nombre }: { file: File; nombre?: string }) =>
      fileService.uploadFile(file, nombre),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      
      if (data.userKey) {
        setUserKey(data.userKey);
        toast.success('Archivo subido exitosamente');
      } else {
        toast.success('Archivo subido y cifrado exitosamente');
      }
      
      setSelectedFile(null);
      setCustomName('');
      setUploading(false);
    },
    onError: (error: unknown) => {
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        errorMessage = apiError.response?.data?.message ?? 'Error en la respuesta del servidor';
      }
      
      toast.error('Error al subir el archivo: ' + errorMessage);
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

  const copyKeyToClipboard = async () => {
    if (userKey) {
      try {
        await navigator.clipboard.writeText(userKey);
        toast.success('Clave copiada al portapapeles');
      } catch (error) {
        toast.error('Error al copiar la clave');
      }
    }
  };

  const closeKeyModal = () => {
    setUserKey(null);
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
                <li>Cifrado con Vigennere y Affin antes del almacenamiento</li>
                <li>Verificación de integridad con checksum SHA-256</li>
                <li>Solo archivos PDF permitidos</li>
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
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-700'
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

      {/* Modal de clave de descifrado */}
      {userKey && (
        <div className='fixed inset-0 z-50 overflow-hidden'>
          <div className='fixed inset-0 bg-black bg-opacity-75' onClick={closeKeyModal} />
          
          <div className='fixed inset-0 flex items-center justify-center p-4'>
            <div className='relative bg-white rounded-lg shadow-xl max-w-md w-full'>
              <div className='p-6'>
                <div className='text-center'>
                  <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4'>
                    <Lock className='h-6 w-6 text-green-600' />
                  </div>
                  
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    ¡Archivo Subido Exitosamente!
                  </h3>
                  
                  <p className='text-sm text-gray-500 mb-6'>
                    Guarda esta clave de descifrado. Los usuarios la necesitarán para ver y descargar el documento.
                  </p>
                  
                  <div className='mb-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Clave de Descifrado:
                    </label>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='text'
                        value={userKey}
                        placeholder='Clave de descifrado'
                        readOnly
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-center font-mono text-sm'
                      />
                      <button
                        type='button'
                        onClick={copyKeyToClipboard}
                        className='inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700'
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                  
                  <div className='bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6'>
                    <div className='flex'>
                      <AlertTriangle className='h-5 w-5 text-yellow-400 mr-2' />
                      <div className='text-sm text-yellow-700'>
                        <p><strong>Importante:</strong> Esta clave se usa para:</p>
                        <ul className='list-disc list-inside mt-1'>
                          <li>Descifrar el documento</li>
                          <li>Abrir el PDF descargado</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type='button'
                    onClick={closeKeyModal}
                    className='w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700'
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
