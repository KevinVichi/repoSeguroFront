'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FileText,
  Upload,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Trash2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  // ✅ ESTADO PARA USUARIO
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // ✅ EFECTO OPTIMIZADO - SE EJECUTA SOLO UNA VEZ
  useEffect(() => {
    setIsClient(true);
    
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
    };

    // Cargar usuario solo una vez
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

  const navigation: NavigationItem[] = [ 
    { name: 'Mis Archivos', href: '/files', icon: FileText },
    { name: 'Subir Archivo', href: '/upload', icon: Upload, adminOnly: true },
    { name: 'Documentos Eliminados', href: '/deleted', icon: Trash2, adminOnly: true },
    { name: 'Permisos', href: '/permissions', icon: Users, adminOnly: true },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI ES ADMIN (SIN LOGS)
  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    
    // Verificar diferentes formatos de rol
    const rol = user.Rol || user.role || user.ROL;
    return rol === 'admin' || rol === 'Admin' || rol === 'ADMIN';
  }, [user]);

  // ✅ FILTRAR NAVEGACIÓN SEGÚN ROL (SIN LOGS)
  const filteredNavigation = React.useMemo(() => {
    return navigation.filter(item => {
      if (!item.adminOnly) return true;
      return isAdmin;
    });
  }, [isAdmin, navigation]);

  // ✅ NO RENDERIZAR HASTA QUE EL CLIENTE ESTÉ LISTO
  if (!isClient) {
    return (
      <div className='h-screen flex items-center justify-center bg-gray-100'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  return (
    <div className='h-screen flex overflow-hidden bg-gray-100'>
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className='fixed inset-0 bg-gray-600 bg-opacity-75' onClick={() => setSidebarOpen(false)}/>
        <div className='relative flex-1 flex flex-col max-w-xs w-full bg-white'>
          <div className='absolute top-0 right-0 -mr-12 pt-2'>
            <button
              type='button'
              title='Cerrar menú'
              className='ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
              onClick={() => setSidebarOpen(false)}
            >
              <X className='h-6 w-6 text-white' />
              <span className='sr-only'>Cerrar menú</span>
            </button>
          </div>
          <SidebarContent 
            navigation={filteredNavigation} 
            currentPath={pathname} 
            onLogout={handleLogout}
            user={user}
          />
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className='hidden md:flex md:flex-shrink-0'>
        <div className='flex flex-col w-64'>
          <SidebarContent 
            navigation={filteredNavigation} 
            currentPath={pathname} 
            onLogout={handleLogout}
            user={user}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className='flex flex-col w-0 flex-1 overflow-hidden'>
        <div className='md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3'>
          <button
            type='button'
            title='Abrir menú'
            className='-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className='h-6 w-6' />
            <span className='sr-only'>Abrir menú</span>
          </button>
        </div>
        <main className='flex-1 relative z-0 overflow-y-auto focus:outline-none'>
          <div className='py-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 md:px-8'>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// ✅ COMPONENTE SIDEBAR MEMOIZADO
const SidebarContent = React.memo<{
  navigation: NavigationItem[];
  currentPath: string;
  onLogout: () => void;
  user: any;
}>(({ navigation, currentPath, onLogout, user }) => {
  return (
    <div className='flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white'>
      <div className='flex-1 flex flex-col pt-5 pb-4 overflow-y-auto'>
        <div className='flex items-center flex-shrink-0 px-4'>
          <h1 className='text-lg font-semibold text-gray-900'>🔒 Repositorio Seguro</h1>
        </div>
        
        {/* Información del usuario */}
        {user && (
          <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
            <p className='text-sm font-medium text-gray-900'>
              {user.Nombre || user.nombre || 'Usuario'}
            </p>
            <p className='text-xs text-gray-500'>
              {user.Rol || user.role || 'Sin rol'} • {user.correo || 'Sin correo'}
            </p>
          </div>
        )}
        
        <nav className='mt-5 flex-1 px-2 bg-white space-y-1'>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className='mr-3 h-5 w-5' />
                {item.name}
                {item.adminOnly && (
                  <span className='ml-auto text-xs bg-red-100 text-red-800 px-1 rounded'>
                    ADMIN
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className='flex-shrink-0 flex border-t border-gray-200 p-4'>
        <button
          type='button'
          onClick={onLogout}
          className='flex items-center text-sm text-gray-600 hover:text-gray-900'
        >
          <LogOut className='mr-3 h-5 w-5' />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
});

SidebarContent.displayName = 'SidebarContent';

export default Layout;