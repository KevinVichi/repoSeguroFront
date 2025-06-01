export interface User {
  UsuarioID: number;
  Nombre: string;
  Correo: string;
  Rol: 'admin' | 'usuario';
  FechaCreacion: string;
  Activo: boolean;
  TwoFactorEnabled?: boolean;
}

export interface Documento {
  DocumentoID: number;
  Nombre: string;
  NombreOriginal: string;
  RutaArchivo: string;
  UsuarioCreador: number;
  NombreCreador?: string;
  FechaSubida: string;
  Activo: boolean;
  Checksum?: string;
  TamañoArchivo?: number;
  PuedeVer?: boolean;
  PuedeDescargar?: boolean;
}

export interface Permiso {
  PermisoID: number;
  DocumentoID: number;
  UsuarioID: number;
  PuedeVer: boolean;
  PuedeDescargar: boolean;
  FechaAsignado: string;
  NombreDocumento?: string;
  NombreUsuario?: string;
}

export interface AuditLog {
  fechaHora: string;
  accion: string;
  exitoso: boolean;
  baseDatos: string;
  esquema: string;
  objeto: string;
  consulta: string;
  usuario: string;
  aplicacion: string;
}

export interface TwoFactorSetup {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}