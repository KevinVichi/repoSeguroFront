'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Shield, 
  Key,
  Copy, 
  Check,
  AlertTriangle,
  Save
} from 'lucide-react';
import Image from 'next/image';
import { authService } from '../../lib/services/authService';
import { twoFactorService } from '../../lib/services/twoFactorService';
import { TwoFactorSetup } from '../../types';
import toast from 'react-hot-toast';

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
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const setup2FAMutation = useMutation({
    mutationFn: twoFactorService.setup2FA,
    onSuccess: (data) => {
      setTwoFactorSetup(data);
      toast.success('Configuración 2FA iniciada');
    },
    onError: () => {
      toast.error('Error al configurar 2FA');
    }
  });

  const verify2FAMutation = useMutation({
    mutationFn: twoFactorService.verify2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setTwoFactorSetup(null);
      toast.success('2FA activado exitosamente');
    },
    onError: () => {
      toast.error('Código 2FA inválido');
    }
  });

  const disable2FAMutation = useMutation({
    mutationFn: twoFactorService.disable2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('2FA desactivado');
    },
    onError: () => {
      toast.error('Error al desactivar 2FA');
    }
  });

  const handleSetup2FA = () => {
    setup2FAMutation.mutate();
  };

  const handleVerify2FA = (code: string) => {
    verify2FAMutation.mutate(code);
  };

  const handleDisable2FA = (code: string) => {
    disable2FAMutation.mutate(code);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  };

  const watchNewPassword = watch('newPassword');

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'security', name: 'Seguridad', icon: Shield },
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

        {activeTab === 'security' && (
          <div 
            id='security-panel' 
            role='tabpanel' 
            aria-labelledby='security-tab'    // ✅ REFERENCIA AL TAB
            tabIndex={0}                      // ✅ HACER FOCUSABLE
            className='px-4 py-5 sm:p-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
              Autenticación de Dos Factores (2FA)
            </h3>
            
            {!user?.TwoFactorEnabled ? (
              <div>
                <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6' role='alert'>
                  <div className='flex'>
                    <AlertTriangle className='h-5 w-5 text-yellow-400' />
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-yellow-800'>
                        2FA Desactivado
                      </h3>
                      <div className='mt-2 text-sm text-yellow-700'>
                        <p>Tu cuenta no tiene autenticación de dos factores activada. Se recomienda activarla para mayor seguridad.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {!twoFactorSetup ? (
                  <button
                    type='button'
                    onClick={handleSetup2FA}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  >
                    <Shield className='h-4 w-4 mr-2' />
                    Activar 2FA
                  </button>
                ) : (
                  <TwoFactorSetupComponent 
                    setup={twoFactorSetup} 
                    onVerify={handleVerify2FA}
                    onCopyCode={copyToClipboard}
                    copiedCode={copiedCode}
                  />
                )}
              </div>
            ) : (
              <div>
                <div className='bg-green-50 border border-green-200 rounded-md p-4 mb-6' role='alert'>
                  <div className='flex'>
                    <Shield className='h-5 w-5 text-green-400' />
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-green-800'>
                        2FA Activado
                      </h3>
                      <div className='mt-2 text-sm text-green-700'>
                        <p>Tu cuenta está protegida con autenticación de dos factores.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <TwoFactorDisableComponent onDisable={handleDisable2FA} />
              </div>
            )}
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

// Componente para configurar 2FA
const TwoFactorSetupComponent: React.FC<{
  setup: TwoFactorSetup;
  onVerify: (code: string) => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}> = ({ setup, onVerify, onCopyCode, copiedCode }) => {
  const [verificationCode, setVerificationCode] = useState('');

  return (
    <div className='space-y-6'>
      <div>
        <h4 className='text-sm font-medium text-gray-900 mb-2'>
          1. Escanea el código QR
        </h4>
        <div className='bg-white p-4 rounded-lg border-2 border-gray-200 inline-block'>
          <Image 
            src={setup.qrCode} 
            alt='Código QR para configurar autenticación de dos factores' 
            width={192}
            height={192}
            className='w-48 h-48' 
          />
        </div>
        <p className='mt-2 text-sm text-gray-600'>
          Usa una app como Google Authenticator o Authy para escanear este código QR.
        </p>
      </div>

      <div>
        <h4 className='text-sm font-medium text-gray-900 mb-2'>
          2. Códigos de respaldo
        </h4>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <p className='text-sm text-gray-600 mb-3'>
            Guarda estos códigos en un lugar seguro. Puedes usarlos si no tienes acceso a tu dispositivo 2FA.
          </p>
          <div className='grid grid-cols-2 gap-2'>
            {setup.backupCodes.map((code, index) => (
              <div key={index} className='flex items-center justify-between bg-white p-2 rounded border'>
                <span className='font-mono text-sm' aria-label={`Código de respaldo ${index + 1}`}>
                  {code}
                </span>
                <button
                  type='button'
                  onClick={() => onCopyCode(code)}
                  className='text-gray-400 hover:text-gray-600'
                  aria-label={`Copiar código de respaldo ${index + 1} al portapapeles`}
                >
                  {copiedCode === code ? (
                    <Check className='h-4 w-4 text-green-500' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h4 className='text-sm font-medium text-gray-900 mb-2'>
          3. Verifica tu configuración
        </h4>
        <div className='flex space-x-3'>
          <label htmlFor='verificationCode' className='sr-only'>
            Código de verificación de 6 dígitos
          </label>
          <input
            id='verificationCode'
            type='text'
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder='Ingresa el código de 6 dígitos'
            maxLength={6}
            aria-label='Código de verificación de 6 dígitos'
            className='block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
          />
          <button
            type='button'
            onClick={() => onVerify(verificationCode)}
            disabled={verificationCode.length !== 6}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
          >
            Verificar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para desactivar 2FA
const TwoFactorDisableComponent: React.FC<{
  onDisable: (code: string) => void;
}> = ({ onDisable }) => {
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  if (!showDisable) {
    return (
      <button
        type='button'
        onClick={() => setShowDisable(true)}
        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
      >
        Desactivar 2FA
      </button>
    );
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm text-gray-600'>
        Para desactivar la autenticación de dos factores, ingresa un código de tu app autenticadora:
      </p>
      <div className='flex space-x-3'>
        <label htmlFor='disableCode' className='sr-only'>
          Código de desactivación de 6 dígitos
        </label>
        <input
          id='disableCode'
          type='text'
          value={disableCode}
          onChange={(e) => setDisableCode(e.target.value)}
          placeholder='Código de 6 dígitos'
          maxLength={6}
          aria-label='Código de desactivación de 6 dígitos'
          className='block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        />
        <button
          type='button'
          onClick={() => onDisable(disableCode)}
          disabled={disableCode.length !== 6}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50'
        >
          Desactivar
        </button>
        <button
          type='button'
          onClick={() => setShowDisable(false)}
          className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default UserSettings;