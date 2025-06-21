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
  ContenidoCifrado?: Buffer;
  UsuarioCreador: number;
  FechaSubida: string;
  Activo: boolean;
  Checksum: string;
  TamañoArchivo?: number;
  FirmaDigital?: string;
  ClaveDescifrado?: string;
  ClaveUsuarioCifrada?: string;
  ChecksumClave?: string;
  ChecksumCifrado?: string;
  MetadataCifrado?: string;

  // ✅ CAMPOS ADICIONALES PARA LA UI
  NombreCreador?: string;
  PuedeVer?: boolean;
  PuedeDescargar?: boolean;

  // ✅ CAMPO TEMPORAL PARA PASAR CLAVE AL VISOR
  tempUserKey?: string;
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

export interface TwoFactorSetup {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}