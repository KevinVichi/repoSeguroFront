// frontend/lib/security/fieldProtection.ts
export class FieldProtection {
  private static readonly SALT = 'SecureRepo2024!';
  
  // Ofuscar datos sensibles
  static obfuscateField(value: string, fieldName: string): string {
    if (!value) return '';
    
    // Simple XOR con salt personalizado por campo
    const key = this.generateKey(fieldName);
    let result = '';
    
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      const keyCode = key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode ^ keyCode);
    }
    
    // Codificar en base64 para transporte seguro
    return btoa(result);
  }
  
  // Deofuscar en el backend
  static deobfuscateField(obfuscatedValue: string, fieldName: string): string {
    if (!obfuscatedValue) return '';
    
    try {
      // Decodificar base64
      const encoded = atob(obfuscatedValue);
      
      // XOR reverso
      const key = this.generateKey(fieldName);
      let result = '';
      
      for (let i = 0; i < encoded.length; i++) {
        const charCode = encoded.charCodeAt(i);
        const keyCode = key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode ^ keyCode);
      }
      
      return result;
    } catch (error) {
      console.error('Error deofuscando campo:', error);
      return '';
    }
  }
  
  private static generateKey(fieldName: string): string {
    // Generar clave única por campo
    const combined = this.SALT + fieldName + this.SALT;
    let hash = 0;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36) + fieldName.slice(0, 3);
  }
  
  // Añadir timestamp para protección adicional
  static addTimestamp(): string {
    return Date.now().toString(36);
  }
  
  // Validar timestamp (opcional)
  static isValidTimestamp(timestamp: string, maxAgeMinutes = 10): boolean {
    try {
      const time = parseInt(timestamp, 36);
      const now = Date.now();
      const maxAge = maxAgeMinutes * 60 * 1000;
      
      return (now - time) <= maxAge;
    } catch {
      return false;
    }
  }
}