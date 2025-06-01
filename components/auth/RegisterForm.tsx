'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../lib/services/authService';
import toast from 'react-hot-toast';

interface RegisterFormData {
  nombre: string;
  correo: string;
  password: string;
  confirmPassword: string;
}

const RegisterForm: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>();
  const router = useRouter();
  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (data.password !== data.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      const response = await authService.register(data.nombre, data.correo, data.password);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast.success('Cuenta creada exitosamente');
      router.push('/files');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta';
      toast.error(errorMessage);
      console.error('Register error:', error);
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
            Crea tu cuenta nueva
          </p>
        </div>
        
        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label htmlFor='nombre' className='sr-only'>
                Nombre completo
              </label>
              <input
                id='nombre'
                {...register('nombre', { 
                  required: 'Nombre es requerido',
                  minLength: { value: 2, message: 'Nombre debe tener al menos 2 caracteres' }
                })}
                type='text'
                autoComplete='name'
                placeholder='Nombre completo'
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              />
              {errors.nombre && (
                <p className='mt-1 text-sm text-red-600'>{errors.nombre.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor='correo' className='sr-only'>
                Correo electrónico
              </label>
              <input
                id='correo'
                {...register('correo', { 
                  required: 'Email es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                type='email'
                autoComplete='email'
                placeholder='Correo electrónico'
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              />
              {errors.correo && (
                <p className='mt-1 text-sm text-red-600'>{errors.correo.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor='password' className='sr-only'>
                Contraseña
              </label>
              <input
                id='password'
                {...register('password', { 
                  required: 'Contraseña es requerida',
                  minLength: { value: 6, message: 'Contraseña debe tener al menos 6 caracteres' }
                })}
                type='password'
                autoComplete='new-password'
                placeholder='Contraseña'
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              />
              {errors.password && (
                <p className='mt-1 text-sm text-red-600'>{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor='confirmPassword' className='sr-only'>
                Confirmar contraseña
              </label>
              <input
                id='confirmPassword'
                {...register('confirmPassword', { 
                  required: 'Confirma tu contraseña',
                  validate: (value) => value === password || 'Las contraseñas no coinciden'
                })}
                type='password'
                autoComplete='new-password'
                placeholder='Confirmar contraseña'
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              />
              {errors.confirmPassword && (
                <p className='mt-1 text-sm text-red-600'>{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Información de seguridad */}
          <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
            <div className='flex'>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-blue-800'>
                  Tu cuenta será segura
                </h3>
                <div className='mt-2 text-sm text-blue-700'>
                  <ul className='list-disc list-inside space-y-1'>
                    <li>Contraseña cifrada con bcrypt</li>
                    <li>Autenticación de dos factores opcional</li>
                    <li>Acceso controlado a documentos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={isSubmitting}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </div>

          <div className='text-center'>
            <p className='mt-2 text-sm text-gray-600'>
              ¿Ya tienes una cuenta?{' '}
              <Link 
                href='/login' 
                className='font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150'
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;