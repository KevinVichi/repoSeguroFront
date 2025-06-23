'use client';

import React, { useState } from 'react';
import { useQuery} from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Key,
  Save
} from 'lucide-react';
import { authService } from '../../lib/services/authService';
import { TwoFactorSetup } from '../../types';

interface ProfileFormData {
  nombre: string;
  correo: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [] = useState<TwoFactorSetup | null>(null);
  const [] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile
  });

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileFormData>({
    defaultValues: {
      nombre: user?.Nombre || '',
      correo: user?.Correo || ''
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, watch } = useForm<PasswordFormData>();

  const watchNewPassword = watch('newPassword');

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'password', name: 'Contraseña', icon: Key },
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
        <p className='mt-2 text-sm text-gray-700'>
          Gestiona tu perfil y configuraciones de seguridad
        </p>
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
                id={`${tab.id}-tab`}                              // ✅ ID para referenciar desde panel
                aria-label={`Pestaña ${tab.name}`}                // ✅ ETIQUETA DESCRIPTIVA
                title={`Cambiar a ${tab.name}`}                   // ✅ TOOLTIP INFORMATIVO
                className={`${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-t-md`} // ✅ AGREGADO rounded-t-md
              >
                <Icon className='h-5 w-5 mr-2' aria-hidden='true' />
                {tab.name}
                {/* ✅ INDICADOR VISUAL PARA LECTORES DE PANTALLA */}
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
            aria-labelledby='profile-tab'     // ✅ REFERENCIA AL TAB
            tabIndex={0}                      // ✅ HACER FOCUSABLE
            className='px-4 py-5 sm:p-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' // ✅ ESTILOS DE FOCO
          >
            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
              Información del Perfil
            </h3>
            <form onSubmit={handleProfileSubmit(() => {})} className='space-y-4'>
              <div>
                <label htmlFor='nombre' className='block text-sm font-medium text-gray-700'>
                  Nombre completo
                </label>
                <input
                  id='nombre'
                  {...registerProfile('nombre', { required: 'El nombre es requerido' })}
                  type='text'
                  aria-describedby={profileErrors.nombre ? 'nombre-error' : undefined}
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
                {profileErrors.nombre && (
                  <p id='nombre-error' role='alert' className='mt-1 text-sm text-red-600'>
                    {profileErrors.nombre.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor='correo' className='block text-sm font-medium text-gray-700'>
                  Correo electrónico
                </label>
                <input
                  id='correo'
                  {...registerProfile('correo', { 
                    required: 'El correo es requerido',
                    pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' }
                  })}
                  type='email'
                  aria-describedby={profileErrors.correo ? 'correo-error' : undefined}
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
                {profileErrors.correo && (
                  <p id='correo-error' role='alert' className='mt-1 text-sm text-red-600'>
                    {profileErrors.correo.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor='rol' className='block text-sm font-medium text-gray-700'>
                  Rol
                </label>
                <input
                  id='rol'
                  type='text'
                  value={user?.Rol || ''}
                  disabled
                  aria-label='Rol del usuario (solo lectura)'
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm'
                />
                <p className='mt-1 text-sm text-gray-500'>
                  El rol no puede ser modificado
                </p>
              </div>

              <div className='flex justify-end'>
                <button
                  type='submit'
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                >
                  <Save className='h-4 w-4 mr-2' />
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div 
            id='password-panel' 
            role='tabpanel' 
            aria-labelledby='password-tab'    // ✅ REFERENCIA AL TAB
            tabIndex={0}                      // ✅ HACER FOCUSABLE
            className='px-4 py-5 sm:p-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
              Cambiar Contraseña
            </h3>
            
            <form onSubmit={handlePasswordSubmit(() => {})} className='space-y-4'>
              <div>
                <label htmlFor='currentPassword' className='block text-sm font-medium text-gray-700'>
                  Contraseña actual
                </label>
                <input
                  id='currentPassword'
                  {...registerPassword('currentPassword', { required: 'La contraseña actual es requerida' })}
                  type='password'
                  aria-describedby={passwordErrors.currentPassword ? 'currentPassword-error' : undefined}
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
                {passwordErrors.currentPassword && (
                  <p id='currentPassword-error' role='alert' className='mt-1 text-sm text-red-600'>
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor='newPassword' className='block text-sm font-medium text-gray-700'>
                  Nueva contraseña
                </label>
                <input
                  id='newPassword'
                  {...registerPassword('newPassword', { 
                    required: 'La nueva contraseña es requerida',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                  })}
                  type='password'
                  aria-describedby={passwordErrors.newPassword ? 'newPassword-error' : 'newPassword-help'}
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
                {passwordErrors.newPassword ? (
                  <p id='newPassword-error' role='alert' className='mt-1 text-sm text-red-600'>
                    {passwordErrors.newPassword.message}
                  </p>
                ) : (
                  <p id='newPassword-help' className='mt-1 text-sm text-gray-500'>
                    Debe tener al menos 6 caracteres
                  </p>
                )}
              </div>

              <div>
                <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700'>
                  Confirmar nueva contraseña
                </label>
                <input
                  id='confirmPassword'
                  {...registerPassword('confirmPassword', { 
                    required: 'Confirma la nueva contraseña',
                    validate: value => value === watchNewPassword || 'Las contraseñas no coinciden'
                  })}
                  type='password'
                  aria-describedby={passwordErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
                {passwordErrors.confirmPassword && (
                  <p id='confirmPassword-error' role='alert' className='mt-1 text-sm text-red-600'>
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className='flex justify-end'>
                <button
                  type='submit'
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                >
                  <Key className='h-4 w-4 mr-2' />
                  Cambiar contraseña
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettings;