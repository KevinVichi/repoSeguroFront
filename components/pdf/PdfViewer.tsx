'use client';

import React, {  } from 'react';
import dynamic from 'next/dynamic';

// ✅ IMPORTAR PDF.JS DINÁMICAMENTE SOLO EN EL CLIENTE
const PdfViewerContent = dynamic(() => import('./PdfViewerContent'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        <p className="text-center text-gray-600">Cargando visor PDF...</p>
      </div>
    </div>
  )
});

interface PdfViewerProps {
  documentId: number;
  userKey: string;
  onClose: () => void;
  canDownload?: boolean;
  isAdmin?: boolean;
}

const PdfViewer: React.FC<PdfViewerProps> = (props) => {
  return <PdfViewerContent {...props} />;
};

export default PdfViewer;