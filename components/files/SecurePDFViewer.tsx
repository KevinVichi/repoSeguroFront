'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Documento } from '../../types';
import toast from 'react-hot-toast';

interface SecurePDFViewerProps {
  documento: Documento;
  isOpen: boolean;
  onClose: () => void;
  canDownload?: boolean;
  userKey?: string;
}

const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({ 
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
  const hasLoadedRef = useRef(false);

  // ✅ PROTECCIONES MÍNIMAS - SOLO DESCARGA CORRUPTA
  useEffect(() => {
    if (!isOpen) return;

    console.log('🛡️ Protecciones mínimas activadas');

    // 🛡️ FUNCIÓN MEJORADA PARA ARCHIVO ULTRA-CORRUPTO
    const createCorruptedFile = () => {
      // ✅ MÚLTIPLES FORMATOS CORRUPTOS ALEATORIOS
      const corruptionTypes = [
        // 🔥 TIPO 1: PDF COMPLETAMENTE INVÁLIDO
        () => {
          const garbageData = Array.from({ length: 1000 }, () => 
            String.fromCharCode(Math.floor(Math.random() * 256))
          ).join('');
          
          return new Blob([
            '%PDF-X.X\n', // Header inválido
            '%%CORRUPTED_FILE%%\n',
            garbageData,
            '\n=== ARCHIVO PROTEGIDO CONTRA EXTRACCIÓN ===\n',
            `DOCUMENTO ORIGINAL: ${documento.NombreOriginal}\n`,
            'ESTADO: ACCESO COMPLETAMENTE DENEGADO\n',
            'RAZÓN: Intento de extracción no autorizada detectado\n',
            'ERROR: El archivo está protegido por sistemas de seguridad avanzados\n',
            'CÓDIGO DE SEGURIDAD: SEC_EXTRACT_VIOLATION_001\n',
            `TIMESTAMP: ${new Date().toISOString()}\n`,
            'IP_TRACKING: ENABLED\n',
            'USER_MONITORING: ACTIVE\n',
            'LEGAL_WARNING: Unauthorized access is prohibited by law\n',
            '==========================================================\n',
            garbageData
          ], { type: 'application/octet-stream' }); // ✅ Tipo binario genérico
        },
        
        // 🔥 TIPO 2: ARCHIVO COMPLETAMENTE VACÍO
        () => {
          return new Blob([''], { type: 'application/pdf' });
        },
        
        // 🔥 TIPO 3: ARCHIVO CON EXTENSIÓN RARA
        () => {
          return new Blob([
            'DOCUMENTO_PROTEGIDO_SISTEMA_REPOSEGURO\n',
            'Este archivo está cifrado con tecnología militar\n',
            'Acceso denegado por violación de seguridad\n',
            `Documento original: ${documento.NombreOriginal}\n`,
            'Para acceso autorizado contacte al administrador\n',
            'Código de error: SECURITY_BREACH_DETECTED\n',
            `Fecha/hora: ${new Date().toLocaleString()}\n`,
            'Estado: ARCHIVO_BLOQUEADO_PERMANENTEMENTE\n'
          ], { type: 'text/plain' });
        },
        
        // 🔥 TIPO 4: PDF CON ESTRUCTURA ROTA
        () => {
          return new Blob([
            '%PDF-1.4\n',
            '% ARCHIVO CORRUPTO - NO ABRIR\n',
            '1 0 obj\n<</Type/Error/Message(ACCESO_DENEGADO)>>\nendobj\n',
            '%%ERROR_CORRUPTED_FILE%%\n',
            Array.from({ length: 500 }, () => '\x00').join(''), // Bytes nulos
            '\n=== SISTEMA DE PROTECCIÓN ACTIVADO ===\n',
            `Documento: ${documento.NombreOriginal}\n`,
            'Clasificación: RESTRINGIDO\n',
            'Acceso: DENEGADO PERMANENTEMENTE\n',
            `Usuario: VIOLACIÓN_DETECTADA\n`,
            `Fecha: ${new Date().toISOString()}\n`,
            'Acción: ARCHIVO_CORRUPTO_GENERADO\n',
            'Contacto: administrador@reposeguro.com\n',
            '======================================\n',
            'startxref\n0\n%%ERROR'
          ], { type: 'application/pdf' });
        },
        
        // 🔥 TIPO 5: ARCHIVO BINARIO CORRUPTO
        () => {
          const randomBytes = new Uint8Array(2048);
          for (let i = 0; i < randomBytes.length; i++) {
            randomBytes[i] = Math.floor(Math.random() * 256);
          }
          return new Blob([randomBytes], { type: 'application/octet-stream' });
        }
      ];
      
      // ✅ SELECCIONAR TIPO DE CORRUPCIÓN ALEATORIA
      const randomType = corruptionTypes[Math.floor(Math.random() * corruptionTypes.length)];
      return randomType();
    };

    // 🛡️ SOLO BLOQUEAR CTRL+S Y CLICK DERECHO
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        
        // ✅ GENERAR ARCHIVO CORRUPTO
        const corruptedBlob = createCorruptedFile();
        const fakeUrl = URL.createObjectURL(corruptedBlob);
        const fakeLink = document.createElement('a');
        fakeLink.href = fakeUrl;
        fakeLink.download = `ACCESO_DENEGADO_${documento.NombreOriginal}`;
        fakeLink.style.display = 'none';
        
        document.body.appendChild(fakeLink);
        fakeLink.click();
        document.body.removeChild(fakeLink);
        URL.revokeObjectURL(fakeUrl);
        
        toast.error('🚫 Archivo protegido descargado', {
          duration: 2000,
          position: 'top-right'
        });
      }
    };

    const handleRightClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInPDF = target?.tagName === 'IFRAME' || target?.closest('iframe');
      
      if (isInPDF) {
        e.preventDefault();
        
        // ✅ GENERAR ARCHIVO CORRUPTO
        const corruptedBlob = createCorruptedFile();
        const fakeUrl = URL.createObjectURL(corruptedBlob);
        const fakeLink = document.createElement('a');
        fakeLink.href = fakeUrl;
        fakeLink.download = `ACCESO_DENEGADO_${documento.NombreOriginal}`;
        fakeLink.style.display = 'none';
        
        document.body.appendChild(fakeLink);
        fakeLink.click();
        document.body.removeChild(fakeLink);
        URL.revokeObjectURL(fakeUrl);
        
        toast.error('🚫 Archivo protegido descargado', {
          duration: 2000,
          position: 'top-right'
        });
      }
    };

    // ✅ SOLO ESTOS DOS EVENT LISTENERS
    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('contextmenu', handleRightClick);

    // ✅ CLEANUP SIMPLE
    return () => {
      console.log('🧹 Limpiando protecciones mínimas');
      document.removeEventListener('keydown', handleKeyboard);
      document.removeEventListener('contextmenu', handleRightClick);
    };
  }, [isOpen, documento.NombreOriginal]);

  // ✅ CARGA AUTOMÁTICA SIMPLE
  useEffect(() => {
    if (isOpen && userKey && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadSecurePDF();
    }
  }, [isOpen, userKey]);

  // ✅ RESET AL CERRAR
  useEffect(() => {
    if (!isOpen) {
      hasLoadedRef.current = false;
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }
  }, [isOpen, pdfUrl]);

  // ✅ FUNCIÓN SIMPLE PARA CARGAR PDF
  const loadSecurePDF = async () => {
    if (loading || !keyInput?.trim()) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`📖 Cargando PDF ${documento.DocumentoID}`);
      
      const response = await fetch(`/api/pdfs/${documento.DocumentoID}/secure-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userKey: keyInput.trim(),
          page: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error cargando PDF');
      }

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      
      setPdfUrl(url);
      console.log(`✅ PDF cargado`);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setError(`Error: ${(error as Error).message}`);
      hasLoadedRef.current = false; // Permitir reintentos
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90">
      <div className="flex flex-col h-full">
        
        {/* ✅ HEADER SIMPLE */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="h-6 w-6 text-blue-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium">{documento.Nombre}</h3>
              <p className="text-sm text-gray-300">{documento.NombreOriginal}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-red-600 hover:bg-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ✅ CONTENIDO SIMPLE */}
        <div className="flex-1 bg-gray-800 p-6">
          
          {/* ✅ CAMPO DE CLAVE */}
          {!userKey && (
            <div className="mb-6 max-w-md mx-auto">
              <div className="flex">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadSecurePDF()}
                  placeholder="Clave de descifrado"
                  className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-l-md"
                  disabled={loading}
                />
                <button
                  onClick={loadSecurePDF}
                  disabled={loading || !keyInput.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : 'Ver'}
                </button>
              </div>
            </div>
          )}

          {/* ✅ VISOR PDF SIMPLE */}
          <div className="bg-white rounded-lg mx-auto max-w-4xl h-full max-h-[70vh] flex items-center justify-center">
            {loading ? (
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">🔐 Cargando PDF...</p>
              </div>
            ) : error ? (
              <div className="text-center p-8">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
                <p className="mt-4 text-red-600">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    hasLoadedRef.current = false;
                    loadSecurePDF();
                  }}
                  className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  🔄 Reintentar
                </button>
              </div>
            ) : pdfUrl ? (
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                className="w-full h-full"
                title={`PDF - ${documento.Nombre}`}
                style={{ border: 'none' }}
                onLoad={() => console.log('✅ PDF mostrado')}
                onError={() => setError('Error mostrando PDF')}
              />
            ) : (
              <div className="text-center p-8">
                <EyeOff className="h-16 w-16 text-gray-400 mx-auto" />
                <p className="mt-4 text-gray-500">
                  {userKey ? '🔐 Preparando...' : '🔑 Ingresa la clave'}
                </p>
              </div>
            )}
          </div>
          
          {/* ✅ MENSAJE SIMPLE */}
          <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-md max-w-4xl mx-auto">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-200">
                <strong>🛡️ Documento protegido:</strong> Ctrl+S y click derecho generan archivo de acceso denegado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurePDFViewer;