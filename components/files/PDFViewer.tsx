'use client';

import React, { useState } from 'react';
import { X, Download, Key, AlertTriangle, Eye } from 'lucide-react';
import { fileService } from '../../lib/services/fileService';
import { Documento } from '../../types';
import toast from 'react-hot-toast';

interface PDFViewerProps {
  documento: Documento;
  isOpen: boolean;
  onClose: () => void;
  canDownload?: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  documento, 
  isOpen, 
  onClose, 
  canDownload = false 
}) => {
  const [userKey, setUserKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'key-input' | 'viewing'>('key-input');

  const handleDecryptAndView = async () => {
    if (!userKey.trim()) {
      setError('Por favor ingresa la clave de descifrado');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // ✅ LLAMAR ENDPOINT DE DESCIFRADO
      const blob = await fileService.validateDecryptionKey(documento.DocumentoID, userKey.trim());
      const url = URL.createObjectURL(blob);
      
      window.open(url, '_blank', 'noopener,noreferrer');
      
      // ✅ LIMPIAR Y CERRAR
      setTimeout(() => {
        URL.revokeObjectURL(url);
        onClose();
      }, 1000);
      
      toast.success('Documento descifrado exitosamente');
      
    } catch (error) {
      console.error('Error:', error);
      
      // ✅ SOLUCIÓN: Verificar y convertir tipo de error
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : 'Error desconocido al descifrar el documento';
      
      setError(errorMessage);
      
      // ✅ Verificar tipo específico de error
      if (errorMessage.includes('Clave de descifrado incorrecta')) {
        toast.error('Clave incorrecta. Verifica e intenta de nuevo.');
      } else {
        toast.error('Error al descifrar el documento');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!canDownload) {
      toast.error('No tienes permisos para descargar este documento');
      return;
    }

    try {
      // ✅ DESCARGAR ARCHIVO CIFRADO (sin descifrar)
      const blob = await fileService.downloadFile(documento.DocumentoID);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${documento.NombreOriginal}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Archivo descargado. Necesitarás la misma clave para abrirlo.');
    } catch (error) {
      // ✅ SOLUCIÓN: Manejar error con tipo seguro
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al descargar el archivo';
      
      console.error('Error descargando archivo:', errorMessage);
      toast.error('Error al descargar el archivo');
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-hidden'>
      <div 
        className='fixed inset-0 bg-black bg-opacity-75 transition-opacity'
        onClick={onClose}
      />
      
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <div className='relative bg-white rounded-lg shadow-xl max-w-md w-full'>
          
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-gray-200'>
            <div className='flex-1 min-w-0'>
              <h2 className='text-lg font-medium text-gray-900 truncate'>
                🔒 Documento Protegido
              </h2>
              <p className='text-sm text-gray-500 truncate'>
                {documento.Nombre}
              </p>
            </div>
            
              <button
                type='button'
                onClick={onClose}
                className='p-2 text-gray-400 hover:text-gray-600'
                aria-label='Cerrar ventana de documento' // ✅ TEXTO PARA LECTORES DE PANTALLA
                title='Cerrar'                           // ✅ TOOLTIP AL HACER HOVER
              >
                <X className='h-5 w-5' />
                <span className='sr-only'>Cerrar</span>  {/* ✅ TEXTO OCULTO PARA LECTORES */}
              </button>
          </div>
          
          {/* Contenido */}
          <div className='p-6'>
            {error && (
              <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md'>
                <div className='flex'>
                  <AlertTriangle className='h-5 w-5 text-red-400' />
                  <div className='ml-3'>
                    <p className='text-sm text-red-800'>{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4'>
                <Key className='h-6 w-6 text-blue-600' />
              </div>
              
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Clave de Descifrado Requerida
              </h3>
              
              <p className='text-sm text-gray-500 mb-6'>
                Este documento está protegido con doble cifrado (Vigenère + Afín). 
                Ingresa la clave proporcionada por el administrador.
              </p>
              
              {/* Input de clave */}
              <div className='mb-6'>
                <label htmlFor='userKey' className='sr-only'>
                  Clave de descifrado
                </label>
                <input
                  type='password'
                  id='userKey'
                  value={userKey}
                  onChange={(e) => setUserKey(e.target.value)}
                  placeholder='Ej: A1B2-C3D4-E5F6-G7H8'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  maxLength={100}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleDecryptAndView();
                    }
                  }}
                />
              </div>
              
              <div className='space-y-3'>
                {/* Botón ver */}
                <button
                  type='button'
                  onClick={handleDecryptAndView}
                  disabled={loading || !userKey.trim()}
                  className='w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Descifrando...
                    </>
                  ) : (
                    <>
                      <Eye className='h-4 w-4 mr-2' />
                      Ver Documento
                    </>
                  )}
                </button>
                
                {/* Botón descargar */}
                {canDownload && (
                  <button
                    type='button'
                    onClick={handleDownload}
                    className='w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  >
                    <Download className='h-4 w-4 mr-2' />
                    Descargar Cifrado
                  </button>
                )}
              </div>
              
              <div className='mt-4 text-xs text-gray-400'>
                💡 El archivo usa doble cifrado y necesitará la misma clave para abrirse.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;