'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Crear una instancia del QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo de cache por defecto
      staleTime: 5 * 60 * 1000, // 5 minutos
      // ✅ Cambiar cacheTime por gcTime (garbage collection time)
      gcTime: 10 * 60 * 1000, // 10 minutos
      // Reintentos en caso de error
      retry: 1,
      // No refetch cuando la ventana regana el foco
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Reintentos para mutaciones
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;