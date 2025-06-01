'use client';

import ProtectedRoute from '../../components/common/ProtectedRoute';
import Layout from '../../components/common/Layout';
import PermissionManager from '../../components/permissions/PermissionManager';

export default function PermissionsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <PermissionManager />
      </Layout>
    </ProtectedRoute>
  );
}
