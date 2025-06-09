'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Calendar, 
  User, 
  FileText,
  RefreshCw,
  Search
} from 'lucide-react';
import { fileService } from '../../lib/services/fileService';
import { Documento } from '../../types';
import toast from 'react-hot-toast';

const DeletedFiles: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // ✅ OBTENER DOCUMENTOS ELIMINADOS
  const { 
    data: deletedFiles = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Documento[]>({
    queryKey: ['deletedFiles'],
    queryFn: fileService.getDeletedFiles,
    refetchInterval: 30000 // Refrescar cada 30 segundos
  });

  // ✅ MUTACIÓN PARA RESTAURAR
  const restoreMutation = useMutation({
    mutationFn: fileService.restoreFile,
    onSuccess: (_, documentoId) => {
      queryClient.invalidateQueries({ queryKey: ['deletedFiles'] });
      queryClient.invalidateQueries({ queryKey: ['files'] }); // Refrescar lista principal
      toast.success('Documento restaurado exitosamente');
    },
    onError: (error) => {
      console.error('Error restaurando:', error);
      toast.error('Error al restaurar el documento');
    }
  });

  // ✅ FILTRAR POR BÚSQUEDA
  const filteredFiles = deletedFiles.filter(file =>
    file.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.NombreOriginal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestore = async (documentoId: number, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que quieres restaurar "${nombre}"?`)) {
      restoreMutation.mutate(documentoId);
    }
  };

  // ✅ FUNCIÓN formatFileSize CORREGIDA
  const formatFileSize = (bytes: number): string => {
    // ✅ MANEJAR CASO ESPECIAL DE 0 BYTES
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // ✅ ASEGURAR QUE i ESTÉ DENTRO DEL RANGO VÁLIDO
    const sizeIndex = Math.min(i, sizes.length - 1);
    
    return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <AlertTriangle className='mx-auto h-12 w-12 text-red-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>Error al cargar documentos eliminados</h3>
        <p className='mt-1 text-sm text-gray-500'>
          Hubo un problema al cargar los documentos eliminados.
        </p>
        <button
          type='button'
          onClick={() => refetch()}
          className='mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
        >
          <RefreshCw className='h-4 w-4 mr-1' />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-semibold text-gray-900'>Documentos Eliminados</h1>
        <p className='mt-2 text-sm text-gray-700'>
          Gestiona y restaura documentos que han sido eliminados del sistema
        </p>
      </div>

      {/* ESTADÍSTICAS */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Trash2 className='h-6 w-6 text-red-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Total Eliminados
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {deletedFiles.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <FileText className='h-6 w-6 text-blue-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Tamaño Total
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {formatFileSize(deletedFiles.reduce((acc, file) => acc + (file.TamañoArchivo ?? 0), 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <RotateCcw className='h-6 w-6 text-green-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Disponibles para Restaurar
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {filteredFiles.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y ACCIONES */}
      <div className='bg-white shadow rounded-lg mb-6'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex-1 max-w-lg'>
              <label htmlFor='search' className='sr-only'>
                Buscar documentos eliminados
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  id='search'
                  type='text'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder='Buscar por nombre de documento...'
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
              </div>
            </div>

            <button
              type='button'
              onClick={() => refetch()}
              className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              <RefreshCw className='h-4 w-4 mr-1' />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* LISTA DE DOCUMENTOS ELIMINADOS */}
      <div className='bg-white shadow overflow-hidden sm:rounded-md'>
        <div className='px-4 py-5 sm:px-6 border-b border-gray-200'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>
            Documentos Eliminados
          </h3>
          <p className='mt-1 max-w-2xl text-sm text-gray-500'>
            {filteredFiles.length} de {deletedFiles.length} documentos mostrados
          </p>
        </div>

        {filteredFiles.length === 0 ? (
          <div className='text-center py-12'>
            <Trash2 className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No hay documentos eliminados
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              {searchTerm ? 'No se encontraron documentos que coincidan con tu búsqueda.' : 'No hay documentos eliminados en el sistema.'}
            </p>
          </div>
        ) : (
          <ul className='divide-y divide-gray-200'>
            {filteredFiles.map((file) => (
              <li key={file.DocumentoID}>
                <div className='px-4 py-4 sm:px-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center min-w-0 flex-1'>
                      <div className='flex-shrink-0'>
                        <FileText className='h-8 w-8 text-red-400' />
                      </div>
                      <div className='min-w-0 flex-1 ml-4'>
                        <div className='flex items-center'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {file.Nombre}
                          </p>
                          <span className='ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'>
                            Eliminado
                          </span>
                        </div>
                        <p className='text-sm text-gray-500 truncate'>
                          Archivo original: {file.NombreOriginal}
                        </p>
                        <div className='mt-2 flex items-center text-sm text-gray-500'>
                          <Calendar className='h-4 w-4 mr-1' />
                          <span>Subido: {new Date(file.FechaSubida).toLocaleDateString('es-ES')}</span>
                          <span className='mx-2'>•</span>
                          <span>{formatFileSize(file.TamañoArchivo || 0)}</span>
                          {file.UsuarioCreador && (
                            <>
                              <span className='mx-2'>•</span>
                              <User className='h-4 w-4 mr-1' />
                              <span>Por: Usuario {file.UsuarioCreador}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex-shrink-0 ml-4'>
                      <button
                        type='button'
                        onClick={() => handleRestore(file.DocumentoID, file.Nombre)}
                        disabled={restoreMutation.isPending}
                        className='inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {restoreMutation.isPending ? (
                          <>
                            <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1'></div>
                            Restaurando...
                          </>
                        ) : (
                          <>
                            <RotateCcw className='h-3 w-3 mr-1' />
                            Restaurar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DeletedFiles;