'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { fileService } from '../../lib/services/fileService';
import { Documento } from '../../types';
import toast from 'react-hot-toast';

interface PDFViewerProps {
  documento: Documento;
  isOpen: boolean;
  onClose: () => void;
  canDownload?: boolean;
  userKey?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  documento, 
  isOpen, 
  onClose, 
  canDownload = false,
  userKey
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState(userKey || '');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 🛡️ PROTECCIONES ANTI-DESCARGA
  useEffect(() => {
    if (!isOpen) return;

    // ✅ AGREGAR CLASE CSS AL BODY
    document.body.classList.add('pdf-viewing');

    // 🛡️ PREVENIR ATAJOS DE TECLADO PELIGROSOS
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevenir Ctrl+S (Guardar), Ctrl+P (Imprimir), Ctrl+A (Seleccionar todo)
      if (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a')) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Función de descarga/impresión deshabilitada');
        return false;
      }
      
      // Prevenir F12 (DevTools), Ctrl+Shift+I (DevTools), Ctrl+U (Ver código)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Herramientas de desarrollador deshabilitadas');
        return false;
      }
    };

    // 🛡️ PREVENIR CLICK DERECHO
    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error('Click derecho deshabilitado');
      return false;
    };

    // 🛡️ INTERCEPTAR FUNCIÓN DE IMPRESIÓN
    const originalPrint = window.print;
    window.print = () => {
      toast.error('Impresión deshabilitada para este documento');
    };

    // 🛡️ PREVENIR DRAG & DROP
    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 🛡️ PREVENIR SELECCIÓN DE TEXTO
    const preventSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Agregar event listeners con capture: true para mayor prioridad
    document.addEventListener('keydown', preventKeyboardShortcuts, { capture: true });
    document.addEventListener('contextmenu', preventRightClick, { capture: true });
    document.addEventListener('dragstart', preventDragDrop, { capture: true });
    document.addEventListener('drop', preventDragDrop, { capture: true });
    document.addEventListener('selectstart', preventSelection, { capture: true });

    // Cleanup al cerrar
    return () => {
      document.body.classList.remove('pdf-viewing');
      document.removeEventListener('keydown', preventKeyboardShortcuts, { capture: true });
      document.removeEventListener('contextmenu', preventRightClick, { capture: true });
      document.removeEventListener('dragstart', preventDragDrop, { capture: true });
      document.removeEventListener('drop', preventDragDrop, { capture: true });
      document.removeEventListener('selectstart', preventSelection, { capture: true });
      window.print = originalPrint;
    };
  }, [isOpen]);

  // ✅ FUNCIÓN PARA CARGAR PDF CON PROTECCIONES
  const loadPDF = async () => {
    if (!keyInput?.trim()) {
      setError('Por favor ingresa la clave de descifrado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`📖 Cargando PDF ${documento.DocumentoID} con clave`);
      
      const blob = await fileService.viewDocumentWithKey(documento.DocumentoID, keyInput.trim());
      
      // ✅ CREAR URL CON PROTECCIONES ADICIONALES
      const url = URL.createObjectURL(blob);
      
      // 🛡️ AGREGAR PARÁMETROS PARA DESHABILITAR TOOLBAR DEL PDF
      const secureUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`;
      
      setPdfUrl(secureUrl);
      
      console.log(`✅ PDF cargado exitosamente con protecciones`);
      
    } catch (error) {
      console.error('Error cargando PDF:', error);
      setError('Error al cargar el PDF. Verifica que la clave sea correcta.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CARGAR PDF AUTOMÁTICAMENTE SI TENEMOS userKey
  useEffect(() => {
    if (isOpen && userKey && !pdfUrl && !loading) {
      loadPDF();
    }
  }, [isOpen, userKey]);

  // ✅ LIMPIAR URL AL CERRAR
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // ✅ FUNCIÓN PARA DESCARGAR (CON PROTECCIÓN ANTI-DESCARGA MEJORADA)
  const handleDownload = async () => {
    // 🛡️ VERIFICAR PERMISOS ANTES DE DESCARGAR
    if (!canDownload || documento.PuedeDescargar === false) {
      console.warn('🚫 Intento de descarga sin permisos detectado');
      
      // ✅ CREAR ARCHIVO PDF CORRUPTO PERO VÁLIDO (más convincente)
      const corruptedContent = new Blob([
        '%PDF-1.4\n',
        '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n',
        '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n',
        '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>>>endobj\n',
        'xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000125 00000 n \n',
        'trailer<</Size 4/Root 1 0 R>>\nstartxref\n198\n%%EOF\n',
        '\n\n=== ACCESO DENEGADO ===\n',
        `Documento: ${documento.NombreOriginal}\n`,
        'Este archivo requiere permisos especiales.\n',
        'Contacte al administrador del sistema.\n',
        `Fecha: ${new Date().toLocaleString()}\n`,
        '========================\n'
      ], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(corruptedContent);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ACCESO_DENEGADO_${documento.NombreOriginal}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.error('⚠️ No tienes permisos para descargar este documento');
      return;
    }

    if (!keyInput?.trim()) {
      toast.error('Ingresa la clave de descifrado primero');
      return;
    }

    try {
      console.log(`📥 Descargando PDF ${documento.DocumentoID}`);
      
      await fileService.downloadFileDirectly(
        documento.DocumentoID, 
        keyInput.trim(), 
        documento.NombreOriginal
      );
      
      toast.success('✅ Descarga iniciada');
      
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error('❌ Error al descargar. Verifica la clave.');
    }
  };

  // ✅ FUNCIÓN PARA MANEJAR TECLA ENTER
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      loadPDF();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          
          {/* ✅ HEADER */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="h-6 w-6 text-indigo-600 mr-3" />
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {documento.Nombre}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {documento.NombreOriginal}
                  </p>
                  
                  {/* ✅ MOSTRAR ESTADO DE PROTECCIÓN */}
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      🛡️ Documento protegido
                    </span>
                    {canDownload && documento.PuedeDescargar !== false ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        📥 Descarga permitida
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        👁️ Solo visualización
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* ✅ BOTÓN DESCARGAR - SOLO SI TIENE PERMISOS */}
                {canDownload && documento.PuedeDescargar !== false && (
                  <button
                    onClick={handleDownload}
                    disabled={!pdfUrl || loading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </button>
                )}
                
                {/* ✅ BOTÓN CERRAR */}
                <button
                  onClick={onClose}
                  className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* ✅ CONTENIDO */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            
            {/* ✅ CAMPO DE CLAVE (solo si no se pasó userKey) */}
            {!userKey && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave de descifrado:
                </label>
                <div className="flex">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ingresa la clave de descifrado"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                  />
                  <button
                    onClick={loadPDF}
                    disabled={loading || !keyInput.trim()}
                    className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Cargando...' : 'Cargar PDF'}
                  </button>
                </div>
              </div>
            )}

            {/* ✅ ÁREA DE VISUALIZACIÓN PDF PROTEGIDA */}
            <div 
              className="bg-white rounded-lg shadow-inner relative secure-pdf-container pdf-viewer-protected no-select" 
              style={{ height: '70vh' }}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">🔐 Descifrando PDF...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
                    <p className="mt-4 text-sm text-red-600">{error}</p>
                    <button
                      onClick={() => {
                        setError(null);
                        if (userKey) loadPDF();
                      }}
                      className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      🔄 Reintentar
                    </button>
                  </div>
                </div>
              ) : pdfUrl ? (
                <>
                  {/* ✅ IFRAME CON PDF ULTRA-PROTEGIDO */}
                  <iframe
                    ref={iframeRef}
                    src={pdfUrl}
                    className="w-full h-full rounded-lg secure-pdf-container"
                    title={`PDF - ${documento.Nombre}`}
                    style={{
                      border: 'none',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      WebkitTouchCallout: 'none'
                    } as React.CSSProperties}
                    // 🛡️ RESTO DE PROPS IGUAL...
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.error('🚫 Click derecho deshabilitado');
                      return false;
                    }}
                    onLoad={() => {
                      console.log('🛡️ PDF cargado con protecciones activas');
                      // Intentar aplicar protecciones adicionales al iframe
                      try {
                        const iframeDoc = iframeRef.current?.contentDocument;
                        if (iframeDoc) {
                          iframeDoc.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            toast.error('🚫 Operación no permitida');
                          });
                          
                          iframeDoc.addEventListener('keydown', (e) => {
                            if (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a')) {
                              e.preventDefault();
                              toast.error('🚫 Función deshabilitada');
                            }
                          });
                        }
                      } catch (error) {
                        // CORS error es esperado, las protecciones externas siguen funcionando
                        console.log('🛡️ Protecciones externas activas');
                      }
                    }}
                    onDragStart={(e) => {
                      e.preventDefault();
                      return false;
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      return false;
                    }}
                  />
                  
                  {/* ✅ OVERLAY DE PROTECCIÓN ADICIONAL */}
                  {(!canDownload || documento.PuedeDescargar === false) && (
                    <div 
                      className="absolute inset-0 z-10 no-select"
                      style={{
                        background: 'transparent',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast.error('🛡️ Descarga no permitida');
                        return false;
                      }}
                      onDragStart={(e) => {
                        e.preventDefault();
                        return false;
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <EyeOff className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="mt-4 text-sm text-gray-500">
                      {userKey ? '🔐 Preparando visualización segura...' : '🔑 Ingresa la clave de descifrado para ver el PDF'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* ✅ MENSAJE DE ESTADO DE PROTECCIÓN */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-blue-400 mr-2" />
                <p className="text-sm text-blue-800">
                  <strong>🛡️ Documento protegido:</strong> 
                  {canDownload && documento.PuedeDescargar !== false
                    ? ' PDF con protecciones de seguridad activas.'
                    : ' Solo visualización - funciones de descarga, impresión y herramientas de desarrollador deshabilitadas.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;