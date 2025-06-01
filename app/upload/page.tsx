'use client';

import ProtectedRoute from '../../components/common/ProtectedRoute';
import Layout from '../../components/common/Layout';
import FileUpload from '../../components/upload/FileUpload';

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <FileUpload />
      </Layout>
    </ProtectedRoute>
  );
}
