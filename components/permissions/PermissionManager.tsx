'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Users, 
  Eye, 
  Download,
  Search,
  AlertTriangle,
  UserCheck,
  Shield,
  User
} from 'lucide-react';
import { permissionService } from '../../lib/services/permissionService';
import { fileService } from '../../lib/services/fileService';
import { userService } from '../../lib/services/userService';
import toast from 'react-hot-toast';

const PermissionManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // ✅ QUERIES PRINCIPALES
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: permissionService.getPermissions
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['files'],
    queryFn: fileService.getFiles
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers
  });

  // ✅ FILTRAR SOLO USUARIOS NORMALES (no admin)
  const normalUsers = Array.isArray(allUsers) 
  ? allUsers.filter(user => user.Rol !== 'admin')
  : [];

  // ✅ MUTATION PARA ACTUALIZAR PERMISOS
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

  // ✅ FUNCIÓN PARA OBTENER PERMISOS DE UN USUARIO ESPECÍFICO
  const getUserPermissions = (usuarioId: number) => {
    return documents.map(documento => {
      const permiso = permissions.find(p => 
        p.UsuarioID === usuarioId && p.DocumentoID === documento.DocumentoID
      );
      
      return {
        documento,
        puedeVer: permiso?.PuedeVer || false,
        puedeDescargar: permiso?.PuedeDescargar || false,
        existePermiso: !!permiso
      };
    });
  };

  // ✅ FUNCIÓN PARA MANEJAR CAMBIOS DE PERMISOS
  const handlePermissionChange = (
    usuarioId: number,
    documentoId: number,
    tipo: 'ver' | 'descargar',
    valor: boolean
  ) => {
    const currentPermissions = getUserPermissions(usuarioId);
    const currentDoc = currentPermissions.find(p => p.documento.DocumentoID === documentoId);

    const puedeVer = tipo === 'ver' ? valor : (currentDoc?.puedeVer || false);
    const puedeDescargar = tipo === 'descargar' ? valor : (currentDoc?.puedeDescargar || false);

    updatePermissionMutation.mutate({ 
      documentoId, 
      usuarioId, 
      puedeVer, 
      puedeDescargar 
    });
  };

  // ✅ FILTRAR USUARIOS POR BÚSQUEDA
  const filteredUsers = normalUsers.filter(user => 
    user.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ OBTENER ESTADÍSTICAS
  const getStats = () => {
    const totalUsers = normalUsers.length;
    const usersWithAccess = normalUsers.filter(user => 
      permissions.some(p => p.UsuarioID === user.UsuarioID && p.PuedeVer)
    ).length;
    const totalDocuments = documents.length;
    const documentsShared = documents.filter(doc => 
      permissions.some(p => p.DocumentoID === doc.DocumentoID && p.PuedeVer)
    ).length;

    return { totalUsers, usersWithAccess, totalDocuments, documentsShared };
  };

  const stats = getStats();

  if (permissionsLoading || documentsLoading || usersLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto'>
      {/* HEADER */}
      <div className='mb-8'>
        <h1 className='text-2xl font-semibold text-gray-900'>Gestión de Permisos por Usuario</h1>
        <p className='mt-2 text-sm text-gray-700'>
          Administra qué documentos puede ver y descargar cada usuario
        </p>
      </div>

      {/* ESTADÍSTICAS */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Users className='h-6 w-6 text-blue-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Usuarios Normales
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {stats.totalUsers}
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
                <UserCheck className='h-6 w-6 text-green-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Con Acceso
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {stats.usersWithAccess}
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
                    {stats.totalDocuments}
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
                <Shield className='h-6 w-6 text-orange-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Docs Compartidos
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {stats.documentsShared}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className='bg-white shadow rounded-lg mb-6'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='max-w-lg'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Search className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900'
                placeholder='Buscar usuario por nombre o email...'
              />
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE USUARIOS */}
      <div className='space-y-6'>
        {filteredUsers.length === 0 ? (
          <div className='text-center py-12'>
            <AlertTriangle className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No se encontraron usuarios
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Ajusta la búsqueda o verifica que existan usuarios normales.
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const userPermissions = getUserPermissions(user.UsuarioID);
            const documentsWithAccess = userPermissions.filter(p => p.puedeVer).length;
            const documentsCanDownload = userPermissions.filter(p => p.puedeDescargar).length;

            return (
              <div key={user.UsuarioID} className='bg-white shadow rounded-lg'>
                {/* HEADER DEL USUARIO */}
                <div className='px-6 py-4 border-b border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <User className='h-8 w-8 text-gray-400' />
                      </div>
                      <div className='ml-4'>
                        <h3 className='text-lg font-medium text-gray-900'>
                          {user.Nombre}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          {user.Correo}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-4 text-sm text-gray-500'>
                      <span className='flex items-center'>
                        <Eye className='h-4 w-4 mr-1' />
                        Puede ver: {documentsWithAccess}
                      </span>
                      <span className='flex items-center'>
                        <Download className='h-4 w-4 mr-1' />
                        Puede descargar: {documentsCanDownload}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TABLA DE DOCUMENTOS Y PERMISOS */}
                <div className='px-6 py-4'>
                  {documents.length === 0 ? (
                    <p className='text-gray-500 text-center py-4'>No hay documentos disponibles</p>
                  ) : (
                    <div className='overflow-x-auto'>
                      <table className='min-w-full divide-y divide-gray-200'>
                        <thead className='bg-gray-50'>
                          <tr>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Documento
                            </th>
                            <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Puede Ver
                            </th>
                            <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Puede Descargar
                            </th>
                          </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                          {userPermissions.map((permissionData) => (
                            <tr key={permissionData.documento.DocumentoID}>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='flex items-center'>
                                  <FileText className='h-5 w-5 text-gray-400 mr-3' />
                                  <div>
                                    <div className='text-sm font-medium text-gray-900'>
                                      {permissionData.documento.Nombre}
                                    </div>
                                    <div className='text-sm text-gray-500'>
                                      Subido: {new Date(permissionData.documento.FechaSubida).toLocaleDateString('es-ES')}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-center'>
                                <button
                                  type='button'
                                  onClick={() => handlePermissionChange(
                                    user.UsuarioID,
                                    permissionData.documento.DocumentoID,
                                    'ver',
                                    !permissionData.puedeVer
                                  )}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    permissionData.puedeVer ? 'bg-indigo-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <span className='sr-only'>Cambiar permiso de ver</span>
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      permissionData.puedeVer ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-center'>
                                <button
                                  type='button'
                                  onClick={() => handlePermissionChange(
                                    user.UsuarioID,
                                    permissionData.documento.DocumentoID,
                                    'descargar',
                                    !permissionData.puedeDescargar
                                  )}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    permissionData.puedeDescargar ? 'bg-green-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <span className='sr-only'>Cambiar permiso de descarga</span>
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      permissionData.puedeDescargar ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PermissionManager;