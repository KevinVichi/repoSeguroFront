'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// ✅ IMPORTAR PDF.JS SOLO EN EL CLIENTE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

interface PdfViewerContentProps {
  documentId: number;
  userKey: string;
  onClose: () => void;
  canDownload?: boolean;
  isAdmin?: boolean;
}

const PdfViewerContent: React.FC<PdfViewerContentProps> = ({
  documentId,
  userKey,
  onClose,
  canDownload = false,
  isAdmin = false
}) => {
  // ✅ ESTADOS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  
  // ✅ REFS
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // ✅ PÁGINAS RENDERIZADAS
  const [renderedPages, setRenderedPages] = useState<Map<number, HTMLCanvasElement>>(new Map());

  // ✅ CARGAR PDF.JS DINÁMICAMENTE
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        if (!pdfjsLib) {
          // Importar PDF.js dinámicamente
          pdfjsLib = await import('pdfjs-dist');
          
          console.log('📋 PDF.js versión:', pdfjsLib.version);
          
          // ✅ USAR PDFJS-DIST/BUILD/PDF.WORKER.MJS PARA VERSIONES 5.x
          try {
            const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs');
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
          } catch {
            console.log('⚠️ Worker module no disponible, usando CDN');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
          }
          
          console.log('✅ PDF.js cargado exitosamente');
          console.log('🔧 Worker URL:', pdfjsLib.GlobalWorkerOptions.workerSrc);
        }
        
        setIsLibraryLoaded(true);
      } catch (error) {
        console.error('❌ Error cargando PDF.js:', error);
        setError('Error cargando la librería PDF');
      }
    };

    loadPdfJs();
  }, []);

  // ✅ FUNCIÓN PARA CARGAR PDF
  const loadPdf = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📄 Cargando PDF...');
      
      // 1️⃣ OBTENER PDF DESCIFRADO
      const pdfResponse = await fetch(`/api/pdfs/${documentId}/viewblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userKey })
      });
      
      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json();
        throw new Error(errorData.message || 'Error obteniendo PDF descifrado');
      }
      
      const pdfArrayBuffer = await pdfResponse.arrayBuffer();
      console.log(`📄 PDF cargado: ${pdfArrayBuffer.byteLength} bytes`);
      
      // 2️⃣ CARGAR CON PDF.JS
      const loadingTask = pdfjsLib.getDocument({ 
        data: pdfArrayBuffer,
        // ✅ CONFIGURACIONES ADICIONALES PARA EVITAR ERRORES
        verbosity: 0, // Reducir logs
        disableAutoFetch: false,
        disableStream: false,
        disableRange: false
      });
      
      const pdf = await loadingTask.promise;
      
      console.log(`📄 PDF.js cargado: ${pdf.numPages} páginas`);
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      
      // 3️⃣ RENDERIZAR PÁGINAS INICIALES
      await renderVisiblePages(pdf, 1);
      
    } catch (error) {
      console.error('❌ Error cargando PDF:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      toast.error('Error cargando PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CARGAR PDF CUANDO LA LIBRERÍA ESTÉ LISTA
  useEffect(() => {
    if (isLibraryLoaded) {
      loadPdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLibraryLoaded, documentId, userKey]);

  // ✅ RENDERIZAR PÁGINAS VISIBLES
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderVisiblePages = async (pdf: any, centerPage: number) => {
    const startPage = Math.max(1, centerPage - 2);
    const endPage = Math.min(pdf.numPages, centerPage + 2);
    
    console.log(`🖼️ Renderizando páginas ${startPage} - ${endPage}`);
    
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      if (!renderedPages.has(pageNum)) {
        await renderPage(pdf, pageNum);
      }
    }
  };

  // ✅ RENDERIZAR PÁGINA INDIVIDUAL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPage = async (pdf: any, pageNumber: number) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale, rotation });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('No se pudo crear contexto de canvas');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.display = 'block';
      canvas.style.margin = '10px auto';
      canvas.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      canvas.style.border = '1px solid #e5e7eb';
      
      // ✅ AGREGAR PROTECCIONES AL CANVAS
      if (!isAdmin) {
        canvas.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toast.error('🚫 Click derecho deshabilitado');
        });
        
        canvas.addEventListener('selectstart', (e) => {
          e.preventDefault();
        });
        
        canvas.addEventListener('dragstart', (e) => {
          e.preventDefault();
        });
      }
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // ✅ AGREGAR WATERMARK SI ES NECESARIO
      if (!canDownload) {
        addWatermark(context, viewport, pageNumber);
      }
      
      setRenderedPages(prev => new Map(prev).set(pageNumber, canvas));
      
      console.log(`✅ Página ${pageNumber} renderizada`);
      
    } catch (error) {
      console.error(`❌ Error renderizando página ${pageNumber}:`, error);
    }
  };

  // ✅ AGREGAR MARCA DE AGUA
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addWatermark = (context: CanvasRenderingContext2D, viewport: any, pageNumber: number) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const watermarkText = `${user.nombre || user.Nombre || 'Usuario'} - Solo Vista - Página ${pageNumber}`;
    
    context.save();
    context.globalAlpha = 0.15;
    context.fillStyle = '#ff0000';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.translate(viewport.width / 2, viewport.height / 2);
    context.rotate(-Math.PI / 6);
    context.fillText(watermarkText, 0, 0);
    context.restore();
  };

  // ✅ ACTUALIZAR VISTA CUANDO CAMBIA LA ESCALA
  useEffect(() => {
    if (pdfDocument) {
      setRenderedPages(new Map());
      renderVisiblePages(pdfDocument, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, rotation]);

  // ✅ CONTROLES DE ZOOM
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // ✅ RENDERIZAR PÁGINAS EN EL CONTENEDOR
  useEffect(() => {
    if (canvasContainerRef.current) {
      const container = canvasContainerRef.current;
      container.innerHTML = '';
      
      for (let i = 1; i <= totalPages; i++) {
        const canvas = renderedPages.get(i);
        if (canvas) {
          container.appendChild(canvas);
        } else if (totalPages > 0) {
          const placeholder = document.createElement('div');
          placeholder.style.height = `${800 * scale}px`;
          placeholder.style.width = '100%';
          placeholder.style.backgroundColor = '#f9fafb';
          placeholder.style.display = 'flex';
          placeholder.style.alignItems = 'center';
          placeholder.style.justifyContent = 'center';
          placeholder.style.margin = '10px auto';
          placeholder.style.border = '1px solid #e5e7eb';
          placeholder.style.borderRadius = '4px';
          placeholder.style.color = '#6b7280';
          placeholder.style.fontSize = '16px';
          placeholder.textContent = `Cargando página ${i}...`;
          container.appendChild(placeholder);
        }
      }
    }
  }, [renderedPages, totalPages, scale]);

  // ✅ SCROLL LISTENER
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current && pdfDocument) {
        const scrollTop = containerRef.current.scrollTop;
        const containerHeight = containerRef.current.clientHeight;
        const scrollCenter = scrollTop + containerHeight / 2;
        
        const estimatedPage = Math.ceil(scrollCenter / (820 * scale));
        const actualPage = Math.min(Math.max(1, estimatedPage), totalPages);
        
        if (actualPage !== currentPage) {
          setCurrentPage(actualPage);
          renderVisiblePages(pdfDocument, actualPage);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDocument, currentPage, totalPages, scale]);

  // ✅ RENDER
  if (!isLibraryLoaded || isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          <p className="text-center text-gray-600">
            {!isLibraryLoaded ? 'Cargando visor PDF...' : 'Cargando PDF...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-center text-gray-600 mb-4">Error cargando PDF</p>
          <p className="text-center text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col">
        
        {/* ✅ HEADER CON CONTROLES */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Documento PDF
            </h2>
            <span className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Reducir zoom"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleRotate}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Rotar"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            
            {canDownload && (
              <button
                onClick={() => {
                  toast.success('Funcionalidad de descarga desde viewer - próximamente');
                }}
                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded"
                title="Descargar PDF"
              >
                <Download className="h-5 w-5" />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* ✅ CONTENEDOR DEL PDF */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-100 p-4"
          style={{ 
            scrollBehavior: 'smooth',
            userSelect: isAdmin ? 'text' : 'none'
          }}
        >
          <div
            ref={canvasContainerRef}
            className="max-w-full"
          >
            {/* Las páginas se renderizan aquí */}
          </div>
        </div>
        
        {/* ✅ FOOTER */}
        <div className="p-3 border-t bg-gray-50 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div>
              {!canDownload && (
                <span className="text-red-600">🚫 Solo vista - Descarga no permitida</span>
              )}
              {canDownload && (
                <span className="text-green-600">✅ Vista completa - Descarga permitida</span>
              )}
            </div>
            <div className="text-xs">
              Zoom: {Math.round(scale * 100)}% | Páginas: {totalPages}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewerContent;