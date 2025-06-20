'use client';
import { useState, useEffect } from 'react';
import { fileService } from '../../lib/services/fileService';
import toast from 'react-hot-toast';
import { TrashIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeletedDocument {
  DocumentoID: number;
  Nombre: string;
  NombreOriginal: string;
  FechaSubida: string;
  TamañoArchivo: number;
  UsuarioCreador: number;
}

export default function DeletedFiles() {
  const [deletedFiles, setDeletedFiles] = useState<DeletedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  useEffect(() => {
    loadDeletedFiles();
  }, []);

  const loadDeletedFiles = async () => {
    try {
      setIsLoading(true);
      const data = await fileService.getDeletedFiles();
      setDeletedFiles(data);
    } catch (error) {
      toast.error('Error cargando archivos eliminados');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NUEVO: Restaurar documento
  const handleRestore = async (documentoId: number) => {
    try {
      await fileService.restoreFile(documentoId);
      toast.success('Documento restaurado exitosamente');
      loadDeletedFiles(); // Recargar lista
    } catch (error) {
      toast.error('Error restaurando documento');
      console.error('Error:', error);
    }
  };

  // ✅ NUEVO: Eliminar permanentemente un documento
  const handlePermanentDelete = async (documentoId: number) => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await fileService.permanentDeleteDocument(documentoId);
      toast.success('Documento eliminado permanentemente');
      loadDeletedFiles(); // Recargar lista
    } catch (error) {
      toast.error('Error eliminando documento permanentemente');
      console.error('Error:', error);
    }
  };

  // ✅ NUEVO: Eliminar todos los documentos
  const handleDeleteAll = async (permanent: boolean = false) => {
    try {
      await fileService.deleteAllDocuments({
        deleteFiles: true,
        permanent
      });
      
      toast.success(permanent ? 
        'Todos los documentos eliminados permanentemente' : 
        'Todos los documentos marcados como inactivos'
      );
      
      loadDeletedFiles();
      setShowDeleteAllModal(false);
      
    } catch (error) {
      toast.error('Error eliminando todos los documentos');
      console.error('Error:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ HEADER CON BOTONES DE ACCIÓN */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Documentos Eliminados</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona los documentos que han sido eliminados ({deletedFiles.length} documentos)
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Eliminar Todos
          </button>
          
          <button
            onClick={loadDeletedFiles}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* ✅ LISTA DE DOCUMENTOS ELIMINADOS */}
      {deletedFiles.length === 0 ? (
        <div className="text-center py-12">
          <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos eliminados</h3>
          <p className="mt-1 text-sm text-gray-500">
            Los documentos eliminados aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {deletedFiles.map((file) => (
              <li key={file.DocumentoID} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrashIcon className="h-8 w-8 text-red-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {file.NombreOriginal}
                      </div>
                      <div className="text-sm text-gray-500">
                        Eliminado: {new Date(file.FechaSubida).toLocaleDateString()} • 
                        Tamaño: {formatFileSize(file.TamañoArchivo)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* ✅ BOTÓN RESTAURAR */}
                    <button
                      onClick={() => handleRestore(file.DocumentoID)}
                      className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                      Restaurar
                    </button>
                    
                    {/* ✅ BOTÓN ELIMINAR PERMANENTEMENTE */}
                    <button
                      onClick={() => handlePermanentDelete(file.DocumentoID)}
                      className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ MODAL PARA CONFIRMAR ELIMINACIÓN MASIVA */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Eliminar Todos los Documentos
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Qué tipo de eliminación deseas realizar?
                </p>
              </div>
              <div className="flex flex-col space-y-3 px-4 py-3">
                <button
                  onClick={() => handleDeleteAll(false)}
                  className="px-4 py-2 bg-yellow-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  Marcar como Inactivos (Reversible)
                </button>
                <button
                  onClick={() => handleDeleteAll(true)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Eliminar Permanentemente (Irreversible)
                </button>
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}