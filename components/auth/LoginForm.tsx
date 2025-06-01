'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../lib/services/authService';
import toast from 'react-hot-toast';

interface LoginFormData {
  correo: string;
  password: string;
  twoFactorCode?: string;
}

const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();
  const router = useRouter();
  const [requires2FA, setRequires2FA] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authService.login(data.correo, data.password, data.twoFactorCode);
      
      if (response.requires2FA) {
        setRequires2FA(true);
        setUserEmail(data.correo);
        toast.success('Por favor ingresa tu código de autenticación de dos factores');
        return;
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast.success('Inicio de sesión exitoso');
      router.push('/files');
    } catch (error) {
      toast.error('Error al iniciar sesión. Verifica tus credenciales.');
      console.error('Login error:', error);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            🔐 Repositorio Seguro
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Inicia sesión en tu cuenta
          </p>
        </div>
        
        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label htmlFor='correo' className='sr-only'>
                Correo electrónico
              </label>
              <input
                id='correo'
                {...register('correo', { required: 'Email es requerido' })}
                type='email'
                autoComplete='email'
                placeholder='Correo electrónico'
                defaultValue={userEmail}
                aria-describedby={errors.correo ? 'correo-error' : undefined}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              />
              {errors.correo && (
                <p id='correo-error' role='alert' className='mt-1 text-sm text-red-600'>
                  {errors.correo.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor='password' className='sr-only'>
                Contraseña
              </label>
              <input
                id='password'
                {...register('password', { required: 'Contraseña es requerida' })}
                type='password'
                autoComplete='current-password'
                placeholder='Contraseña'
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${requires2FA ? '' : 'rounded-b-md'}`}
              />
              {errors.password && (
                <p id='password-error' role='alert' className='mt-1 text-sm text-red-600'>
                  {errors.password.message}
                </p>
              )}
            </div>
            
            {requires2FA && (
              <div>
                <label htmlFor='twoFactorCode' className='sr-only'>
                  Código de autenticación de dos factores
                </label>
                <input
                  id='twoFactorCode'
                  {...register('twoFactorCode', { required: requires2FA ? 'Código 2FA es requerido' : false })}
                  type='text'
                  placeholder='Código de autenticación (6 dígitos)'
                  maxLength={6}
                  aria-describedby={errors.twoFactorCode ? 'twoFactorCode-error' : 'twoFactorCode-help'}
                  className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                />
                {errors.twoFactorCode ? (
                  <p id='twoFactorCode-error' role='alert' className='mt-1 text-sm text-red-600'>
                    {errors.twoFactorCode.message}
                  </p>
                ) : (
                  <p id='twoFactorCode-help' className='mt-1 text-sm text-gray-500'>
                    Ingresa el código de 6 dígitos de tu app autenticadora
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type='submit'
              disabled={isSubmitting}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>

          {/* Nuevo enlace para registro */}
          <div className='text-center'>
            <p className='mt-2 text-sm text-gray-600'>
              ¿No tienes una cuenta?{' '}
              <Link 
                href='/register' 
                className='font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150'
              >
                Crear cuenta nueva
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;