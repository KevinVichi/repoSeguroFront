'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import Layout from '../../components/common/Layout';
import DeletedFiles from '../../components/files/DeletedFiles';
import { useAuth } from '../../hooks/useAuth';

export default function DeletedFilesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.Rol !== 'admin')) {
      router.push('/files');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  if (!user || user.Rol !== 'admin') {
    return null;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <DeletedFiles />
      </Layout>
    </ProtectedRoute>
  );
}