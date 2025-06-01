'use client';

import ProtectedRoute from '../../components/common/ProtectedRoute';
import Layout from '../../components/common/Layout';
import UserSettings from '../../components/settings/UserSettings';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <UserSettings />
      </Layout>
    </ProtectedRoute>
  );
}
