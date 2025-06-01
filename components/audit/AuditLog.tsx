'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Calendar, 
  User, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { auditService } from '../../lib/services/auditService';

const AuditLog: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 días atrás
    endDate: new Date().toISOString().split('T')[0]
  });
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: auditLogs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['audit', dateRange, actionFilter, userFilter],
    queryFn: () => auditService.getAuditLogs({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      action: actionFilter !== 'all' ? actionFilter : undefined,
      user: userFilter || undefined
    }),
    refetchInterval: 30000 // Refrescar cada 30 segundos
  });

  const filteredLogs = auditLogs.filter(log =>
    log.consulta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.objeto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    if (action.includes('SELECT')) return <Search className='h-4 w-4 text-blue-500' />;
    if (action.includes('INSERT')) return <CheckCircle className='h-4 w-4 text-green-500' />;
    if (action.includes('UPDATE')) return <RefreshCw className='h-4 w-4 text-yellow-500' />;
    if (action.includes('DELETE')) return <XCircle className='h-4 w-4 text-red-500' />;
    return <Activity className='h-4 w-4 text-gray-500' />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('SELECT')) return 'bg-blue-100 text-blue-800';
    if (action.includes('INSERT')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const exportLogs = () => {
    const csvContent = [
      ['Fecha/Hora', 'Usuario', 'Acción', 'Objeto', 'Exitoso', 'Base de Datos'].join(','),
      ...filteredLogs.map(log => [
        log.fechaHora,
        log.usuario,
        log.accion,
        log.objeto,
        log.exitoso ? 'Sí' : 'No',
        log.baseDatos
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatistics = () => {
    const total = filteredLogs.length;
    const successful = filteredLogs.filter(log => log.exitoso).length;
    const failed = total - successful;
    const uniqueUsers = new Set(filteredLogs.map(log => log.usuario)).size;
    
    return { total, successful, failed, uniqueUsers };
  };

  const stats = getStatistics();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <AlertTriangle className='mx-auto h-12 w-12 text-red-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>Error al cargar logs</h3>
        <p className='mt-1 text-sm text-gray-500'>
          Hubo un problema al cargar los logs de auditoría.
        </p>
        <button
          type='button'
          onClick={() => refetch()}
          className='mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
        >
          <RefreshCw className='h-4 w-4 mr-1' />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-semibold text-gray-900'>Logs de Auditoría</h1>
        <p className='mt-2 text-sm text-gray-700'>
          Monitorea todas las actividades del sistema para detectar accesos sospechosos
        </p>
      </div>

      {/* Estadísticas */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Activity className='h-6 w-6 text-gray-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Total Eventos
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
                <CheckCircle className='h-6 w-6 text-green-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Exitosos
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {stats.successful}
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
                <XCircle className='h-6 w-6 text-red-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Fallidos
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {stats.failed}
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
                <User className='h-6 w-6 text-purple-400' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Usuarios Únicos
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {stats.uniqueUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className='bg-white shadow rounded-lg mb-6'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            {/* Fecha inicio */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Fecha inicio
              </label>
              <input
                type='date'
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Fecha fin
              </label>
              <input
                type='date'
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            {/* Filtro de acción */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Tipo de acción
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              >
                <option value='all'>Todas las acciones</option>
                <option value='SELECT'>Consultas (SELECT)</option>
                <option value='INSERT'>Inserciones (INSERT)</option>
                <option value='UPDATE'>Actualizaciones (UPDATE)</option>
                <option value='DELETE'>Eliminaciones (DELETE)</option>
              </select>
            </div>

            {/* Filtro de usuario */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Usuario
              </label>
              <input
                type='text'
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder='Filtrar por usuario'
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            {/* Búsqueda */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Búsqueda
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder='Buscar en logs...'
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
              </div>
            </div>
          </div>

          <div className='mt-4 flex justify-between items-center'>
            <button
              type='button'
              onClick={() => refetch()}
              className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              <RefreshCw className='h-4 w-4 mr-1' />
              Actualizar
            </button>

            <button
              type='button'
              onClick={exportLogs}
              className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              <Download className='h-4 w-4 mr-1' />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className='bg-white shadow overflow-hidden sm:rounded-md'>
        <div className='px-4 py-5 sm:px-6 border-b border-gray-200'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>
            Eventos de Auditoría
          </h3>
          <p className='mt-1 max-w-2xl text-sm text-gray-500'>
            {filteredLogs.length} de {auditLogs.length} eventos mostrados
          </p>
        </div>

        {filteredLogs.length === 0 ? (
          <div className='text-center py-12'>
            <Database className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No se encontraron logs
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Ajusta los filtros de fecha para ver más eventos.
            </p>
          </div>
        ) : (
          <ul className='divide-y divide-gray-200'>
            {filteredLogs.map((log, index) => (
              <li key={index}>
                <div className='px-4 py-4 sm:px-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center min-w-0 flex-1'>
                      <div className='flex-shrink-0'>
                        {getActionIcon(log.accion)}
                      </div>
                      <div className='min-w-0 flex-1 ml-4'>
                        <div className='flex items-center'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {log.objeto}
                          </p>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.accion)}`}>
                            {log.accion}
                          </span>
                          {!log.exitoso && (
                            <span className='ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'>
                              Error
                            </span>
                          )}
                        </div>
                        <div className='mt-2 flex items-center text-sm text-gray-500'>
                          <Calendar className='h-4 w-4 mr-1' />
                          <span>{new Date(log.fechaHora).toLocaleString('es-ES')}</span>
                          <span className='mx-2'></span>
                          <User className='h-4 w-4 mr-1' />
                          <span>{log.usuario}</span>
                          <span className='mx-2'></span>
                          <Database className='h-4 w-4 mr-1' />
                          <span>{log.baseDatos}</span>
                        </div>
                        {log.consulta && (
                          <div className='mt-2 text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded'>
                            {log.consulta.length > 100 ? `${log.consulta.substring(0, 100)}...` : log.consulta}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
