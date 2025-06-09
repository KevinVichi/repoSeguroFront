'use client';

import { AuthProvider } from '../hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './globals.css'; // Si tienes estilos globales

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider> {/* ✅ ENVOLVER TODA LA APP */}
            {children}
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}