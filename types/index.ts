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
  FechaSubida: string;
  TamañoArchivo?: number;
  Checksum?: string;
  UsuarioCreador?: number;
  Activo?: boolean;

  // ✅ NUEVAS PROPIEDADES PARA PERMISOS
  NombreCreador?: string;        // Nombre del usuario que creó el documento
  PuedeVer?: boolean;           // Si el usuario puede ver el documento
  PuedeDescargar?: boolean;     // Si el usuario puede descargar el documento

  // ✅ NUEVAS PROPIEDADES PARA CLAVES (SOLO ADMIN)
  ClaveUsuarioCifrada?: string; // Clave cifrada para el admin
  ChecksumClave?: string;       // Checksum de la clave
  ChecksumCifrado?: string;     // Checksum del archivo cifrado
  MetadataCifrado?: string;     // Metadatos del cifrado
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