'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Download, 
  Trash2, 
  FileText, 
  Share2, 
  Lock,
  AlertTriangle,
  Calendar,
  HardDrive
} from 'lucide-react';
import { fileService } from '../../lib/services/fileService';
import { Documento } from '../../types';
import toast from 'react-hot-toast';

const FileList: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: files = [], isLoading, error } = useQuery({
    queryKey: ['files'],
    queryFn: fileService.getFiles
  });

  const deleteFileMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Archivo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el archivo');
    }
  });

  const handleDownload = async (documento: Documento) => {
    try {
      const blob = await fileService.downloadFile(documento.DocumentoID);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = documento.NombreOriginal;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Archivo descargado exitosamente');
    } catch (error) {
      toast.error('Error al descargar el archivo');
      console.error('Download error:', error);
    }
  };

  const handleDelete = async (documentoId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      deleteFileMutation.mutate(documentoId);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return 'Desconocido';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <h3 className='mt-2 text-sm font-medium text-gray-900'>Error al cargar archivos</h3>
        <p className='mt-1 text-sm text-gray-500'>
          Hubo un problema al cargar tus archivos. Intenta recargar la página.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className='sm:flex sm:items-center sm:justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>Mis Archivos</h1>
          <p className='mt-2 text-sm text-gray-700'>
            Gestiona tus documentos de forma segura
          </p>
        </div>
        <div className='mt-4 sm:mt-0 sm:ml-16 sm:flex-none'>
          <span className='text-sm text-gray-500'>
            {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
          </span>
        </div>
      </div>

      {files.length === 0 ? (
        <div className='text-center py-12'>
          <FileText className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>No tienes archivos</h3>
          <p className='mt-1 text-sm text-gray-500'>
            Comienza subiendo tu primer documento seguro.
          </p>
        </div>
      ) : (
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          <ul className='divide-y divide-gray-200'>
            {files.map((documento) => (
              <li key={documento.DocumentoID}>
                <div className='px-4 py-4 sm:px-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center min-w-0 flex-1'>
                      <FileText className='h-8 w-8 text-gray-400 mr-4 flex-shrink-0' />
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {documento.Nombre}
                          </p>
                          {documento.Checksum && (
                            <span className='ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                              <Lock className='h-3 w-3 mr-1' />
                              Cifrado
                            </span>
                          )}
                        </div>
                        <div className='mt-2 flex items-center text-sm text-gray-500 space-x-4'>
                          <div className='flex items-center'>
                            <HardDrive className='h-4 w-4 mr-1' />
                            {formatFileSize(documento.TamañoArchivo ?? 0)}
                          </div>
                          <div className='flex items-center'>
                            <Calendar className='h-4 w-4 mr-1' />
                            {formatDate(documento.FechaSubida)}
                          </div>
                          <div>
                            Por: {documento.NombreCreador ?? 'Desconocido'}
                          </div>
                        </div>
                        {documento.NombreOriginal !== documento.Nombre && (
                          <p className='mt-1 text-xs text-gray-500'>
                            Archivo original: {documento.NombreOriginal}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center space-x-2 ml-4'>
                      {/* Botón de compartir */}
                      <button
                        type='button'
                        className='inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-gray-400 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        title='Compartir archivo'
                      >
                        <Share2 className='h-4 w-4' />
                      </button>
                      
                      {/* Botón de descarga */}
                      {documento.PuedeDescargar !== false && (
                        <button
                          type='button'
                          onClick={() => handleDownload(documento)}
                          className='inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          title='Descargar archivo'
                        >
                          <Download className='h-4 w-4' />
                        </button>
                      )}
                      
                      {/* Botón de eliminar */}
                      <button
                        type='button'
                        onClick={() => handleDelete(documento.DocumentoID)}
                        className='inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                        title='Eliminar archivo'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                  
                  {/* Información de integridad */}
                  {documento.Checksum && (
                    <div className='mt-3 px-3 py-2 bg-gray-50 rounded-md'>
                      <p className='text-xs text-gray-600'>
                        <strong>Checksum SHA-256:</strong> {documento.Checksum.substring(0, 32)}...
                      </p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileList;
