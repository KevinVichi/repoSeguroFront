'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Download, 
  Trash2, 
  FileText, 
  Share2, 
  Lock,
  AlertTriangle,
  Calendar,
  HardDrive,
  Upload,  
  Eye,
  ExternalLink      
} from 'lucide-react';
import { fileService } from '../../lib/services/fileService';
import { Documento } from '../../types';
import toast from 'react-hot-toast';
import PDFViewer from './PDFViewer';
import SecurePDFViewer from './SecurePDFViewer';

const FileList: React.FC = () => {
  const queryClient = useQueryClient();

  // ✅ ESTADOS PARA EL VISOR PDF
  const [selectedDocument, setSelectedDocument] = useState<Documento | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // ✅ NUEVO: Estados para modal de clave
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [documentForAction, setDocumentForAction] = useState<{
    documento: Documento;
    action: 'view' | 'download';
  } | null>(null);
  const [userKey, setUserKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Obtener usuario desde localStorage
  const user = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('user') ?? '{}') 
    : {};

  // ✅ QUERY PARA OBTENER ARCHIVOS
  const { data: files = [], isLoading, error } = useQuery({
    queryKey: ['files'],
    queryFn: fileService.getFiles
  });

  // ✅ FUNCIONES PARA EL VISOR PDF
  const handleViewDocument = (documento: Documento) => {
    requestKeyForAction(documento, 'view');
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedDocument(null);
  };

  // ✅ MUTATION PARA ELIMINAR ARCHIVOS
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

  // ✅ FUNCIÓN PARA SOLICITAR CLAVE
  const requestKeyForAction = (documento: Documento, action: 'view' | 'download') => {
    setDocumentForAction({ documento, action });
    setUserKey('');
    setIsKeyModalOpen(true);
  };

  // ✅ FUNCIÓN PARA PROCESAR ACCIÓN CON CLAVE
  const handleActionWithKey = async () => {
    if (!documentForAction || !userKey.trim()) {
      toast.error('Por favor ingresa la clave de descifrado');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { documento, action } = documentForAction;
      
      if (action === 'download') {
        await fileService.downloadFileDirectly(
          documento.DocumentoID, 
          userKey.trim(), 
          documento.NombreOriginal
        );
        toast.success('Descarga iniciada');
      } else if (action === 'view') {
        handleViewWithKey(documento, userKey.trim());
      }
      
      // Cerrar modal
      setIsKeyModalOpen(false);
      setDocumentForAction(null);
      setUserKey('');
      
    } catch (error) {
      console.error('Error en acción:', error);
      toast.error('Clave incorrecta o error en la operación');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ FUNCIÓN PARA VER CON CLAVE (MODIFICADA)
  const handleViewWithKey = (documento: Documento, key: string) => {
    setSelectedDocument({ 
      ...documento, 
      tempUserKey: key 
    });
    setIsViewerOpen(true);
  };

  // ✅ FUNCIÓN PARA DESCARGAR ARCHIVOS
  const handleDownload = (documento: Documento) => {
    requestKeyForAction(documento, 'download');
  };

  // ✅ FUNCIÓN PARA ELIMINAR ARCHIVOS
  const handleDelete = async (documentoId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      deleteFileMutation.mutate(documentoId);
    }
  };

  // ✅ UTILIDADES DE FORMATO
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

  // ✅ ESTADOS DE CARGA Y ERROR
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
      {/* ✅ HEADER DE LA PÁGINA */}
      <div className='sm:flex sm:items-center sm:justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>Mis Archivos</h1>
          <p className='mt-2 text-sm text-gray-700'>
            {user.Rol === 'admin' 
              ? 'Gestiona tus documentos de forma segura' 
              : 'Consulta los documentos disponibles para ti'
            }
          </p>
        </div>
        <div className='mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-3'>
          <span className='text-sm text-gray-500'>
            {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
          </span>
          
          {/* ✅ BOTÓN SUBIR ARCHIVO - SOLO ADMIN */}
          {user.Rol === 'admin' && (
            <Link
              href='/upload'
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              <Upload className='h-4 w-4 mr-2' />
              Subir Archivo
            </Link>
          )}
        </div>
      </div>

      {/* ✅ CONTENIDO PRINCIPAL */}
      {files.length === 0 ? (
        // ✅ ESTADO VACÍO
        <div className='text-center py-12'>
          <FileText className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>
            {user.Rol === 'admin' ? 'No tienes archivos' : 'No hay archivos disponibles'}
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            {user.Rol === 'admin' 
              ? 'Comienza subiendo tu primer documento seguro.' 
              : 'Contacta al administrador para solicitar acceso a documentos.'
            }
          </p>
          {user.Rol === 'admin' && (
            <div className='mt-6'>
              <Link
                href='/upload'
                className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              >
                <Upload className='h-4 w-4 mr-2' />
                Subir primer archivo
              </Link>
            </div>
          )}
        </div>
      ) : (
        // ✅ LISTA DE ARCHIVOS
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          <ul className='divide-y divide-gray-200'>
            {files.map((documento) => (
              <li key={documento.DocumentoID}>
                <div className='px-4 py-4 sm:px-6'>
                  <div className='flex items-center justify-between'>
                    {/* ✅ INFORMACIÓN DEL ARCHIVO */}
                    <div className='flex items-center min-w-0 flex-1'>
                      <FileText className='h-8 w-8 text-gray-400 mr-4 flex-shrink-0' />
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {documento.Nombre}
                          </p>
                          
                          {/* ✅ BADGES DE ESTADO */}
                          {documento.Checksum && (
                            <span className='ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                              <Lock className='h-3 w-3 mr-1' />
                              Cifrado
                            </span>
                          )}
                          
                          {user.Rol !== 'admin' && (
                            <span className='ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'>
                              <Eye className='h-3 w-3 mr-1' />
                              Solo lectura
                            </span>
                          )}
                        </div>
                        
                        {/* ✅ METADATOS DEL ARCHIVO */}
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
                        
                        {/* ✅ NOMBRE ORIGINAL SI ES DIFERENTE */}
                        {documento.NombreOriginal !== documento.Nombre && (
                          <p className='mt-1 text-xs text-gray-500'>
                            Archivo original: {documento.NombreOriginal}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* ✅ BOTONES DE ACCIÓN */}
                    <div className='flex items-center space-x-2 ml-4'>
                      {/* ✅ BOTÓN VER - SOLO SI PUEDE VER */}
                      {documento.PuedeVer !== false && (
                        <button
                          type='button'
                          onClick={() => handleViewDocument(documento)}  // ✅ SIN PASAR CLAVE
                          className='inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                          title='Ver documento'
                        >
                          <ExternalLink className='h-4 w-4' />
                        </button>
                      )}
                      
                      {/* ✅ BOTÓN COMPARTIR - SOLO ADMIN */}
                      {user.Rol === 'admin' && (
                        <button
                          type='button'
                          className='inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-gray-400 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          title='Compartir archivo'
                        >
                          <Share2 className='h-4 w-4' />
                        </button>
                      )}
                      
                      {/* ✅ BOTÓN DESCARGAR - SEGÚN PERMISOS */}
                      {documento.PuedeDescargar !== false && (
                        <button
                          type='button'
                          onClick={() => handleDownload(documento)}  // ✅ SIN PASAR CLAVE
                          className='inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          title='Descargar PDF protegido con contraseña'
                        >
                          <Download className='h-4 w-4' />
                        </button>
                      )}
                      
                      {/* ✅ BOTÓN ELIMINAR - SOLO ADMIN */}
                      {user.Rol === 'admin' && (
                        <button
                          type='button'
                          onClick={() => handleDelete(documento.DocumentoID)}
                          className='inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                          title='Eliminar archivo'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      )}
                      
                      {/* ✅ BOTÓN COPIAR CLAVE - SOLO ADMIN */}
                      {user.Rol === 'admin' && (
                        <button
                          type='button'
                          onClick={() => {
                            if (documento.ClaveUsuarioCifrada) {
                              navigator.clipboard.writeText(documento.ClaveUsuarioCifrada);
                              toast.success('Clave cifrada copiada al portapapeles');
                            } else {
                              toast.error('No hay clave de descifrado disponible');
                            }
                          }}
                          className='inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-gray-400 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          title='Copiar clave cifrada de descifrado'
                        >
                          <Lock className='h-4 w-4' />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* ✅ INFORMACIÓN DE INTEGRIDAD */}
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
      
      {/* ✅ MODAL PARA INGRESAR CLAVE */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsKeyModalOpen(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Ingresa la clave de descifrado
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Para {documentForAction?.action === 'download' ? 'descargar' : 'visualizar'} "{documentForAction?.documento.Nombre}", 
                      necesitas ingresar la clave de descifrado.
                    </p>
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      value={userKey}
                      onChange={(e) => setUserKey(e.target.value)}
                      placeholder="Ingresa tu clave de descifrado"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleActionWithKey()}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  onClick={handleActionWithKey}
                  disabled={isProcessing || !userKey.trim()}
                >
                  {isProcessing ? 'Procesando...' : (documentForAction?.action === 'download' ? 'Descargar' : 'Ver')}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setIsKeyModalOpen(false)}
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL VISOR PDF MODIFICADO */}
      {selectedDocument && (
        <SecurePDFViewer
          documento={selectedDocument}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
          canDownload={
            selectedDocument.PuedeDescargar !== false && 
            user.Rol === 'admin'
          }
          userKey={(selectedDocument as any).tempUserKey}
        />
      )}
    </div>
  );
};

export default FileList;