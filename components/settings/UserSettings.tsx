'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  ShieldCheck,
  Mail,
  Shield
} from 'lucide-react';
import { auditService } from '@/lib/services/auditService';

const UserSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const rowsPerPage = 10;

  // ✅ USAR EL MISMO PATRÓN QUE LAYOUT
  useEffect(() => {
    setIsClient(true);
    
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log('🔍 UserSettings - Usuario cargado:', parsedUser);
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error cargando usuario:', error);
        setUser(null);
      }
    };

    loadUser();

    // Escuchar cambios en storage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ✅ VERIFICAR SI EL USUARIO ES ADMIN (MISMO PATRÓN QUE LAYOUT)
  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    
    // ✅ USAR EL MISMO FORMATO QUE LAYOUT
    const rol = user.Rol || user.role || user.ROL;
    console.log('🔍 UserSettings - rol:', rol);
    const result = rol === 'admin' || rol === 'Admin' || rol === 'ADMIN';
    console.log('🔍 UserSettings - isAdmin:', result);
    return result;
  }, [user]);

  // ✅ SOLO CARGAR AUDITORÍA SI ES ADMIN
  const { data: auditLog, isLoading: isAuditLoading } = useQuery({
    queryKey: ['auditLog'],
    queryFn: auditService.getAuditLog,
    enabled: activeTab === 'audit' && isAdmin && isClient,
  });

  const paginatedAuditLog = auditLog
    ? auditLog.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : [];

  const totalPages = auditLog ? Math.ceil(auditLog.length / rowsPerPage) : 1;

  // ✅ TABS DINÁMICOS SEGÚN EL ROL
  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    ...(isAdmin ? [{ id: 'audit', name: 'Auditoría', icon: ShieldCheck }] : [])
  ];

  // ✅ NO RENDERIZAR HASTA QUE EL CLIENTE ESTÉ LISTO
  if (!isClient) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  // ✅ MOSTRAR LOADING SI NO HAY USUARIO
  if (!user) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-semibold text-gray-900'>Configuración</h1>
      </div>

      {/* Tabs */}
      <div className='border-b border-gray-200 mb-6'>
        <nav className='-mb-px flex space-x-8' role='tablist'>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className='h-5 w-5 mr-2' />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de tabs */}
      <div className='bg-white shadow rounded-lg'>
        {activeTab === 'profile' && (
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
              Información del Perfil
            </h3>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <User className='inline h-4 w-4 mr-2' />
                  Nombre completo
                </label>
                <div className='px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm text-gray-900'>
                  {user.Nombre || user.nombre || 'No especificado'}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Mail className='inline h-4 w-4 mr-2' />
                  Correo electrónico
                </label>
                <div className='px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm text-gray-900'>
                  {user.Correo || user.correo || 'No especificado'}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Shield className='inline h-4 w-4 mr-2' />
                  Rol del usuario
                </label>
                <div className='px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm'>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    isAdmin 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isAdmin ? 'Administrador' : 'Usuario'} ({user.Rol || user.role || 'Sin rol'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ AUDITORÍA SOLO PARA ADMIN */}
        {activeTab === 'audit' && isAdmin && (
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
              Registro de Auditoría
            </h3>
            {isAuditLoading ? (
              <div className='flex items-center justify-center h-32'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
                <span className='ml-2 text-gray-600'>Cargando auditoría...</span>
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Fecha</th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Usuario</th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Base de datos</th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Objeto</th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Acción</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {paginatedAuditLog.map((row: any, idx: number) => (
                        <tr key={idx} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{row.event_time}</td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{row.server_principal_name}</td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{row.database_name}</td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{row.object_name}</td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{row.statement || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettings;