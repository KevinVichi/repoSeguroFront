'use client';

import React, { useState } from 'react';
import { useQuery} from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  User, 
  ShieldCheck,
  Mail,
  Shield
} from 'lucide-react';
import { authService } from '../../lib/services/authService';
import { auditService } from '@/lib/services/auditService';


interface ProfileFormData {
  nombre: string;
  correo: string;
}

const UserSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile
  });

  // ✅ VERIFICAR SI EL USUARIO ES ADMIN
  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    const rol = user.Rol ;
    return rol === 'admin';
  }, [user]);

  // ✅ SOLO CARGAR AUDITORÍA SI ES ADMIN
  const { data: auditLog, isLoading: isAuditLoading } = useQuery({
    queryKey: ['auditLog'],
    queryFn: auditService.getAuditLog,
    enabled: activeTab === 'audit' && isAdmin, // ✅ Solo si es admin Y la pestaña está activa
  });

  const paginatedAuditLog = auditLog
    ? auditLog.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : [];

  const totalPages = auditLog ? Math.ceil(auditLog.length / rowsPerPage) : 1;

  // ✅ ELIMINAR HOOKS DE FORMULARIO YA QUE NO LOS USAS
  // const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileFormData>({
  //   defaultValues: {
  //     nombre: user?.Nombre || '',
  //     correo: user?.Correo || ''
  //   }
  // });

  // ✅ TABS DINÁMICOS SEGÚN EL ROL
  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    // ✅ Solo mostrar auditoría para administradores
    ...(isAdmin ? [{ id: 'audit', name: 'Auditoría', icon: ShieldCheck }] : [])
  ];

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
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
        <nav className='-mb-px flex space-x-8' role='tablist' aria-label='Configuración del usuario'>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                role='tab'
                aria-selected={isActive ? "true" : "false"}
                aria-controls={`${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                id={`${tab.id}-tab`}
                aria-label={`Pestaña ${tab.name}`}
                title={`Cambiar a ${tab.name}`}
                className={`${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-t-md`}
              >
                <Icon className='h-5 w-5 mr-2' aria-hidden='true' />
                {tab.name}
                {isActive && (
                  <span className='sr-only'>(pestaña activa)</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de tabs */}
      <div className='bg-white shadow rounded-lg'>
        {activeTab === 'profile' && (
          <div 
            id='profile-panel' 
            role='tabpanel' 
            aria-labelledby='profile-tab'
            tabIndex={0}
            className='px-4 py-5 sm:p-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
              Información del Perfil
            </h3>

            {/* ✅ SIMPLIFICAR SIN FORMULARIO */}
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <User className='inline h-4 w-4 mr-2' />
                  Nombre completo
                </label>
                <div className='px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm text-gray-900'>
                  {user?.Nombre || 'No especificado'}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Mail className='inline h-4 w-4 mr-2' />
                  Correo electrónico
                </label>
                <div className='px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm text-gray-900'>
                  {user?.Correo || 'No especificado'}
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
                    {isAdmin ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ AUDITORÍA SOLO PARA ADMIN */}
        {activeTab === 'audit' && isAdmin && (
          <div
            id='audit-panel'
            role='tabpanel'
            aria-labelledby='audit-tab'
            tabIndex={0}
            className='px-4 py-5 sm:p-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
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
                
                {/* Navegación de páginas */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700">
                    Página <span className='font-medium'>{currentPage}</span> de <span className='font-medium'>{totalPages}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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