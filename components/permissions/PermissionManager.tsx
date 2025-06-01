'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Users, 
  Eye, 
  Download, 
  X, 
  Check,
  Search,
  Filter,
  AlertTriangle,
  UserCheck,
  Shield
} from 'lucide-react';
import { permissionService } from '../../lib/services/permissionService';
import { fileService } from '../../lib/services/fileService';
import { userService } from '../../lib/services/userService';
import { Permiso, Documento, User } from '../../types';
import toast from 'react-hot-toast';

const PermissionManager: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'documents' | 'users'>('all');
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: permissionService.getPermissions
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['files'],
    queryFn: fileService.getFiles
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ documentoId, usuarioId, puedeVer, puedeDescargar }: {
      documentoId: number;
      usuarioId: number;
      puedeVer: boolean;
      puedeDescargar: boolean;
    }) => permissionService.updatePermission(documentoId, usuarioId, puedeVer, puedeDescargar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permisos actualizados exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar permisos');
    }
  });

  const handlePermissionUpdate = (documentoId: number, usuarioId: number, puedeVer: boolean, puedeDescargar: boolean) => {
    updatePermissionMutation.mutate({ documentoId, usuarioId, puedeVer, puedeDescargar });
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = 
      permission.NombreDocumento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.NombreUsuario?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'documents' && selectedDocument) {
      return permission.DocumentoID === selectedDocument && matchesSearch;
    }
    if (filterType === 'users' && selectedUser) {
      return permission.UsuarioID === selectedUser && matchesSearch;
    }
    return matchesSearch;
  });

  const getPermissionStats = () => {
    const total = permissions.length;
    const canView = permissions.filter(p => p.PuedeVer).length;
    const canDownload = permissions.filter(p => p.PuedeDescargar).length;
    
    return { total, canView, canDownload };
  };

  const stats = getPermissionStats();

  if (permissionsLoading || documentsLoading || usersLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-semibold text-gray-900'>Gestión de Permisos</h1>
        <p className='mt-2 text-sm text-gray-700'>
          Administra quién puede ver y descargar cada documento
        </p>
      </div>

      {/* Estadísticas */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Shield className='h-6 w-6 text-gray-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Total Permisos
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Eye className='h-6 w-6 text-blue-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Pueden Ver
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {stats.canView}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Download className='h-6 w-6 text-green-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Pueden Descargar
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {stats.canDownload}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <FileText className='h-6 w-6 text-purple-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Documentos
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {documents.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className='bg-white shadow rounded-lg mb-6'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {/* Búsqueda */}
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Search className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='Buscar documento o usuario...'
              />
            </div>

            {/* Filtro por tipo */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'documents' | 'users')}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              >
                <option value='all'>Todos los permisos</option>
                <option value='documents'>Por documento</option>
                <option value='users'>Por usuario</option>
              </select>
            </div>

            {/* Filtro por documento */}
            {filterType === 'documents' && (
              <div>
                <select
                  value={selectedDocument ?? ''}
                  onChange={(e) => setSelectedDocument(e.target.value ? Number(e.target.value) : null)}
                  className='block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                >
                  <option value=''>Seleccionar documento</option>
                  {documents.map((doc) => (
                    <option key={doc.DocumentoID} value={doc.DocumentoID}>
                      {doc.Nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por usuario */}
            {filterType === 'users' && (
              <div>
                <select
                  value={selectedUser ?? ''}
                  onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : null)}
                  className='block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                >
                  <option value=''>Seleccionar usuario</option>
                  {users.map((user) => (
                    <option key={user.UsuarioID} value={user.UsuarioID}>
                      {user.Nombre} ({user.Correo})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de permisos */}
      <div className='bg-white shadow overflow-hidden sm:rounded-md'>
        <div className='px-4 py-5 sm:px-6 border-b border-gray-200'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>
            Permisos de Documentos
          </h3>
          <p className='mt-1 max-w-2xl text-sm text-gray-500'>
            {filteredPermissions.length} de {permissions.length} permisos mostrados
          </p>
        </div>

        {filteredPermissions.length === 0 ? (
          <div className='text-center py-12'>
            <AlertTriangle className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No se encontraron permisos
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Ajusta los filtros de búsqueda para ver más resultados.
            </p>
          </div>
        ) : (
          <ul className='divide-y divide-gray-200'>
            {filteredPermissions.map((permiso) => (
              <li key={`${permiso.DocumentoID}-${permiso.UsuarioID}`}>
                <div className='px-4 py-4 sm:px-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center min-w-0 flex-1'>
                      <div className='flex-shrink-0'>
                        <FileText className='h-8 w-8 text-gray-400' />
                      </div>
                      <div className='min-w-0 flex-1 ml-4'>
                        <div className='flex items-center'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {permiso.NombreDocumento}
                          </p>
                        </div>
                        <div className='mt-2 flex items-center text-sm text-gray-500'>
                          <UserCheck className='h-4 w-4 mr-1' />
                          <span>{permiso.NombreUsuario}</span>
                          <span className='mx-2'></span>
                          <span>Asignado: {new Date(permiso.FechaAsignado).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className='flex items-center space-x-4'>
                      {/* Toggle Ver */}
                      <div className='flex items-center'>
                        <label className='text-sm text-gray-700 mr-2'>Ver:</label>
                        <button
                          type='button'
                          onClick={() => handlePermissionUpdate(
                            permiso.DocumentoID, 
                            permiso.UsuarioID, 
                            !permiso.PuedeVer, 
                            permiso.PuedeDescargar
                          )}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            permiso.PuedeVer ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className='sr-only'>Cambiar permiso de ver</span>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              permiso.PuedeVer ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Toggle Descargar */}
                      <div className='flex items-center'>
                        <label className='text-sm text-gray-700 mr-2'>Descargar:</label>
                        <button
                          type='button'
                          onClick={() => handlePermissionUpdate(
                            permiso.DocumentoID, 
                            permiso.UsuarioID, 
                            permiso.PuedeVer, 
                            !permiso.PuedeDescargar
                          )}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            permiso.PuedeDescargar ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className='sr-only'>Cambiar permiso de descarga</span>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              permiso.PuedeDescargar ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Botón para crear nuevos permisos */}
      <div className='mt-6'>
        <button
          type='button'
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
        >
          <Users className='h-4 w-4 mr-2' />
          Asignar nuevos permisos
        </button>
      </div>
    </div>
  );
};

export default PermissionManager;
