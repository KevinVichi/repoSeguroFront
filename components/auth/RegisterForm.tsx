'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../lib/services/authService';
import { twoFactorService } from '../../lib/services/twoFactorService';
import { FieldProtection } from '../../lib/security/fieldProtection'; // ✅ AÑADIR ESTA IMPORTACIÓN
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';

interface RegisterFormData {
  nombre: string;
  correo: string;
  password: string;
  confirmPassword: string;
}

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

const RegisterForm: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>();
  const router = useRouter();
  const password = watch('password');

  // ✅ ESTADOS PARA FLUJO 2FA OBLIGATORIO
  const [step, setStep] = useState<'register' | 'setup2fa' | 'verify2fa'>('register');
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // ✅ PASO 1: REGISTRO INICIAL - MODIFICADO PARA USAR PROTECCIÓN
  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (data.password !== data.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      // 🛡️ OFUSCAR DATOS DE REGISTRO ANTES DE ENVIAR
      const protectedData = {
        // Campos ofuscados
        nm: FieldProtection.obfuscateField(data.nombre, 'name'),
        usr: FieldProtection.obfuscateField(data.correo, 'email'),
        pwd: FieldProtection.obfuscateField(data.password, 'password'),
        
        // Metadata de seguridad
        ts: FieldProtection.addTimestamp(),
        fp: navigator.userAgent.slice(0, 20),
        
        // Flag para el backend
        _protected: true
      };

      console.log('🔒 Enviando registro protegido:', {
        hasName: !!protectedData.nm,
        hasUsr: !!protectedData.usr,
        hasPwd: !!protectedData.pwd,
        timestamp: protectedData.ts
      });

      // ✅ USAR MÉTODO PROTEGIDO EN LUGAR DEL TRADICIONAL
      const response = await authService.registerProtected(protectedData);
      
      // ✅ VERIFICAR SI REQUIERE 2FA OBLIGATORIO
      if (response.requiresTwoFactorSetup) {
        toast.success('Cuenta creada exitosamente');
        toast.loading('Configurando 2FA obligatorio...', { duration: 2000 });
        
        // ✅ GUARDAR TOKEN TEMPORAL Y CONTINUAR
        localStorage.setItem('temp_token', response.token ?? '');
        setStep('setup2fa');
        await setup2FA();
      } else {
        // ✅ REGISTRO TRADICIONAL (FALLBACK)
        localStorage.setItem('token', response.token ?? '');
        toast.success('Registro exitoso');
        router.push('/files');
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta';
      toast.error(errorMessage);
      console.error('Register error:', error);
    }
  };

  // ✅ PASO 2: CONFIGURAR 2FA AUTOMÁTICAMENTE
  const setup2FA = async () => {
    try {
      console.log('🔐 Configurando 2FA obligatorio...');
      const setupData = await twoFactorService.setup2FA();
      
      console.log('📱 Datos del setup 2FA:', setupData);
      
      // ✅ ALMACENAR TEMPORALMENTE PARA LA VERIFICACIÓN
      localStorage.setItem('temp_2fa_setup', JSON.stringify({
        secret: setupData.secret,
        backupCodes: setupData.backupCodes
      }));
      
      setTwoFactorSetup(setupData);
      setStep('verify2fa');
      
      toast.success('Escanea el código QR para completar tu registro');
      
    } catch (error) {
      console.error('2FA setup error:', error);
      toast.error('Error configurando 2FA obligatorio');
    }
  };

  // ✅ PASO 3: VERIFICAR 2FA Y COMPLETAR REGISTRO - MODIFICADO PARA PROTECCIÓN
  const verify2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Ingresa un código de 6 dígitos');
      return;
    }

    setIsVerifying(true);
    
    try {
      console.log('🔐 Verificando código 2FA protegido...');
      
      // 🛡️ USAR MÉTODO PROTEGIDO EN LUGAR DEL TRADICIONAL
      await twoFactorService.verify2FAProtected(twoFactorCode);
      
      // ✅ EL twoFactorService YA MANEJA EL TOKEN Y USUARIO
      toast.success('¡2FA verificado exitosamente!');
      toast.success('¡Registro completado! Bienvenido al repositorio seguro');
      
      // ✅ LIMPIAR ESTADO TEMPORAL
      localStorage.removeItem('temp_token');
      localStorage.removeItem('temp_2fa_setup');
      
      // ✅ REDIRIGIR AL SISTEMA
      router.push('/files');
      
    } catch (error) {
      console.error('2FA verification error:', error);
      toast.error('Código incorrecto. Inténtalo de nuevo.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ✅ RENDER PASO 2: CONFIGURANDO 2FA
  if (step === 'setup2fa') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <div className='text-center'>
            <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
              🔐 Configurando 2FA Obligatorio
            </h2>
            <p className='mt-2 text-center text-sm text-gray-600'>
              Preparando tu autenticación de dos factores...
            </p>
          </div>
          
          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex justify-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-500'></div>
            </div>
            <p className='mt-4 text-center text-gray-600'>
              Generando código QR obligatorio para tu seguridad
            </p>
            <p className='mt-2 text-center text-sm text-red-600 font-medium'>
              Este paso es requerido para acceder al sistema
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ RENDER PASO 3: VERIFICAR 2FA OBLIGATORIO
  if (step === 'verify2fa' && twoFactorSetup) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-lg w-full space-y-8'>
          <div className='text-center'>
            <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
              📱 2FA Obligatorio - Último Paso
            </h2>
            <p className='mt-2 text-center text-sm text-gray-600'>
              Escanea el código QR y verifica para completar tu registro
            </p>
            
            {/* ✅ ADVERTENCIA DE OBLIGATORIEDAD */}
            <div className='mt-4 bg-red-50 border border-red-200 rounded-md p-3'>
              <p className='text-sm text-red-800 font-medium'>
                🚨 2FA es OBLIGATORIO para completar tu registro
              </p>
              <p className='text-xs text-red-600 mt-1'>
                No podrás acceder al sistema sin verificar tu código
              </p>
            </div>
          </div>
          
          <div className='bg-white p-6 rounded-lg shadow space-y-6'>
            {/* ✅ CÓDIGO QR */}
            <div className='text-center'>
              <div className='bg-white p-4 rounded-lg border-2 border-gray-200 inline-block'>
                <QRCodeCanvas value={twoFactorSetup.qrCode} size={200} />
              </div>
            </div>

            {/* ✅ INSTRUCCIONES */}
            <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
              <h3 className='text-sm font-medium text-blue-800 mb-2'>
                📋 Instrucciones obligatorias:
              </h3>
              <ol className='text-sm text-blue-700 list-decimal list-inside space-y-1'>
                <li>Descarga Google Authenticator o Authy</li>
                <li>Escanea el código QR de arriba</li>
                <li>Ingresa el código de 6 dígitos</li>
                <li>¡Completa tu registro seguro!</li>
              </ol>
            </div>

            {/* ✅ INPUT PARA CÓDIGO */}
            <div>
              <label htmlFor='code' className='block text-sm font-medium text-gray-700 mb-2'>
                Código de verificación obligatorio (6 dígitos)
              </label>
              <input
                id='code'
                type='text'
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder='123456'
                className='appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg tracking-widest'
                maxLength={6}
                autoFocus
              />
            </div>

            {/* ✅ CÓDIGOS DE RESPALDO */}
            {twoFactorSetup.backupCodes && twoFactorSetup.backupCodes.length > 0 && (
              <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
                <h3 className='text-sm font-medium text-yellow-800 mb-2'>
                  🚨 Códigos de respaldo (¡GUÁRDALOS!):
                </h3>
                <div className='grid grid-cols-2 gap-2 text-sm font-mono text-yellow-700'>
                  {twoFactorSetup.backupCodes.map((code, index) => (
                    <div key={index} className='bg-white px-2 py-1 rounded border'>
                      {code}
                    </div>
                  ))}
                </div>
                <p className='text-xs text-yellow-600 mt-2'>
                  Guarda estos códigos en lugar seguro para emergencias
                </p>
              </div>
            )}

            {/* ✅ BOTÓN DE VERIFICACIÓN */}
            <div>
              <button
                onClick={verify2FA}
                disabled={isVerifying || twoFactorCode.length !== 6}
                className='w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isVerifying ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Verificando...
                  </>
                ) : (
                  'Verificar y Completar Registro Obligatorio'
                )}
              </button>
            </div>

            {/* ✅ ADVERTENCIA FINAL */}
            <div className='bg-gray-50 border border-gray-200 rounded-md p-3'>
              <p className='text-xs text-gray-600 text-center'>
                ⚠️ No cierres esta ventana hasta completar la verificación
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ RENDER PASO 1: FORMULARIO DE REGISTRO INICIAL
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            🔐 Repositorio Seguro
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Crea tu cuenta con 2FA obligatorio
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

          {/* ✅ INFORMACIÓN DE SEGURIDAD ACTUALIZADA */}
          <div className='bg-red-50 border border-red-200 rounded-md p-4'>
            <div className='flex'>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  🔐 Seguridad máxima obligatoria
                </h3>
                <div className='mt-2 text-sm text-red-700'>
                  <ul className='list-disc list-inside space-y-1'>
                    <li>Contraseña cifrada con bcrypt</li>
                    <li><strong>Autenticación 2FA OBLIGATORIA</strong></li>
                    <li>Sin 2FA no podrás acceder al sistema</li>
                    <li>Códigos de respaldo para emergencias</li>
                    <li>Acceso controlado a documentos cifrados</li>
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
              {isSubmitting ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta con 2FA obligatorio'
              )}
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