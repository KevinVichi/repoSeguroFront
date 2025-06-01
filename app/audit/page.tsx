'use client';

import ProtectedRoute from '../../components/common/ProtectedRoute';
import Layout from '../../components/common/Layout';
import AuditLog from '../../components/audit/AuditLog';

export default function AuditPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AuditLog />
      </Layout>
    </ProtectedRoute>
  );
}
