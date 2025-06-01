'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/files'); // Redirigir a archivos en lugar de dashboard
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto'></div>
        <h1 className='mt-4 text-2xl font-bold text-gray-900'> Repositorio Seguro</h1>
        <p className='mt-2 text-gray-600'>Redirigiendo...</p>
      </div>
    </div>
  );
}
