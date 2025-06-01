'use client';

import ProtectedRoute from '../../components/common/ProtectedRoute';
import Layout from '../../components/common/Layout';
import FileList from '../../components/files/FileList';

export default function FilesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <FileList />
      </Layout>
    </ProtectedRoute>
  );
}
