export const auditService = {
  async getAuditLog() {
    const res = await fetch('/api/audit');
    if (!res.ok) throw new Error('No se pudo obtener la auditoría');
    return res.json();
  }
};