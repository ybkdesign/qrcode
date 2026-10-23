import type {
  Client,
  QRCodeItem,
  ScanRecord,
  HistoryLog,
  SystemSettings,
  UserSession,
  ClientPortalData,
} from './types';

const API_BASE = '/api';

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user: UserSession }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha no login' }));
      throw new Error(err.error || 'Credenciais inválidas');
    }
    return res.json();
  },

  async clientLogin(data: {
    clientId?: string;
    email?: string;
    password?: string;
  }): Promise<{ success: boolean; user: UserSession }> {
    const res = await fetch(`${API_BASE}/auth/client-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha no login do cliente' }));
      throw new Error(err.error || 'Credenciais de cliente inválidas');
    }
    return res.json();
  },

  async getClientPortalData(clientId?: string): Promise<ClientPortalData> {
    const ts = Date.now();
    const url = clientId
      ? `${API_BASE}/client/portal-data?clientId=${encodeURIComponent(clientId)}&_t=${ts}`
      : `${API_BASE}/client/portal-data?_t=${ts}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao carregar dados do portal' }));
      throw new Error(err.error || 'Erro ao carregar dados do portal do cliente');
    }
    return res.json();
  },

  async updateClientProfile(data: {
    clientId: string;
    contactPerson?: string;
    phone?: string;
    postalCode?: string;
    prefecture?: string;
    city?: string;
    address?: string;
    building?: string;
    notes?: string;
    password?: string;
  }): Promise<{ success: boolean; client: Client; message: string }> {
    const res = await fetch(`${API_BASE}/client/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao atualizar dados' }));
      throw new Error(err.error || 'Erro ao atualizar dados cadastrais');
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao recuperar senha' }));
      throw new Error(err.error || 'Erro ao processar solicitação');
    }
    return res.json();
  },

  async getAdminProfile(): Promise<{ id: string; name: string; email: string; role: string }> {
    const res = await fetch(`${API_BASE}/auth/profile`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao carregar perfil' }));
      throw new Error(err.error || 'Erro ao carregar perfil do administrador');
    }
    return res.json();
  },

  async updateAdminProfile(data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; user: UserSession; message: string }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao atualizar dados de acesso' }));
      throw new Error(err.error || 'Erro ao atualizar credenciais do administrador');
    }
    return res.json();
  },

  async repairAdminCredentials(data: {
    name?: string;
    email?: string;
    password?: string;
    newPassword?: string;
    resetToDefault?: boolean;
  }): Promise<{ success: boolean; user: UserSession; admin: { id: string; name: string; email: string }; message: string }> {
    const res = await fetch(`${API_BASE}/auth/repair-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao reparar credenciais de administrador' }));
      throw new Error(err.error || 'Erro ao reparar credenciais do administrador');
    }
    return res.json();
  },

  // Clients
  async getClients(): Promise<Client[]> {
    const res = await fetch(`${API_BASE}/clients`);
    if (!res.ok) throw new Error('Erro ao buscar clientes');
    return res.json();
  },

  async getClient(id: string): Promise<Client & { qrcodes: QRCodeItem[]; totalScans: number }> {
    const res = await fetch(`${API_BASE}/clients/${id}`);
    if (!res.ok) throw new Error('Cliente não encontrado');
    return res.json();
  },

  async createClient(data: Partial<Client>): Promise<Client> {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao criar cliente' }));
      throw new Error(err.error || 'Erro ao criar cliente');
    }
    return res.json();
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao atualizar cliente' }));
      throw new Error(err.error || 'Erro ao atualizar cliente');
    }
    return res.json();
  },

  async deleteClient(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao excluir cliente');
    return res.json();
  },

  // QR Codes
  async getQRCodes(clientId?: string): Promise<QRCodeItem[]> {
    const url = clientId ? `${API_BASE}/qrcodes?clientId=${clientId}` : `${API_BASE}/qrcodes`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar QR Codes');
    return res.json();
  },

  async getQRCode(id: string): Promise<QRCodeItem> {
    const res = await fetch(`${API_BASE}/qrcodes/${id}`);
    if (!res.ok) throw new Error('QR Code não encontrado');
    return res.json();
  },

  async createQRCode(data: Partial<QRCodeItem>): Promise<QRCodeItem> {
    const res = await fetch(`${API_BASE}/qrcodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao criar QR Code' }));
      throw new Error(err.error || 'Erro ao criar QR Code');
    }
    return res.json();
  },

  async updateQRCode(id: string, data: Partial<QRCodeItem>): Promise<QRCodeItem> {
    const res = await fetch(`${API_BASE}/qrcodes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao atualizar QR Code' }));
      throw new Error(err.error || 'Erro ao atualizar QR Code');
    }
    return res.json();
  },

  async assignQRCodeToClient(id: string, clientId: string | null, userName?: string): Promise<QRCodeItem> {
    const res = await fetch(`${API_BASE}/qrcodes/${id}/assign-client`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, userName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao atribuir QR Code' }));
      throw new Error(err.error || 'Erro ao atribuir QR Code ao cliente');
    }
    return res.json();
  },

  async updateDestination(id: string, destinationUrl: string): Promise<QRCodeItem> {
    const res = await fetch(`${API_BASE}/qrcodes/${id}/destination`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao alterar destino' }));
      throw new Error(err.error || 'Erro ao alterar destino');
    }
    return res.json();
  },

  async toggleStatus(id: string, status?: 'active' | 'inactive'): Promise<QRCodeItem> {
    const res = await fetch(`${API_BASE}/qrcodes/${id}/status`, {
      method: 'PATCH',
      headers: status ? { 'Content-Type': 'application/json' } : undefined,
      body: status ? JSON.stringify({ status }) : undefined,
    });
    if (!res.ok) throw new Error('Erro ao alternar status do QR Code');
    return res.json();
  },

  async toggleQRCodeStatus(id: string, status?: 'active' | 'inactive'): Promise<QRCodeItem> {
    return this.toggleStatus(id, status);
  },

  async testScan(id: string): Promise<{ success: boolean; scanCount: number }> {
    const res = await fetch(`${API_BASE}/qrcodes/${id}/test-scan`, {
      method: 'POST',
    });
    if (!res.ok) {
      // Fallback to triggerTestScan
      const fallback = await this.triggerTestScan(id);
      return { success: true, scanCount: fallback.scan ? 1 : 0 };
    }
    return res.json();
  },

  async duplicateQRCode(id: string): Promise<QRCodeItem> {
    const res = await fetch(`${API_BASE}/qrcodes/${id}/duplicate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Erro ao duplicar QR Code');
    return res.json();
  },

  async deleteQRCode(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/qrcodes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao excluir QR Code');
    return res.json();
  },

  // Analytics & Scans
  async getOverviewAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('Erro ao carregar estatísticas');
    return res.json();
  },

  async getQRCodeAnalytics(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/qrcode/${id}`);
    if (!res.ok) throw new Error('Erro ao carregar métricas do QR Code');
    return res.json();
  },

  async getScans(qrCodeId?: string, clientId?: string, limit = 100): Promise<ScanRecord[]> {
    let url = `${API_BASE}/scans?limit=${limit}`;
    if (qrCodeId) url += `&qrCodeId=${qrCodeId}`;
    if (clientId) url += `&clientId=${clientId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao carregar registros de scans');
    return res.json();
  },

  async triggerTestScan(qrCodeId: string): Promise<{ success: boolean; scan: ScanRecord }> {
    const res = await fetch(`${API_BASE}/scans/test-trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCodeId }),
    });
    if (!res.ok) throw new Error('Erro ao simular scan');
    return res.json();
  },

  async resetAnalytics(
    qrCodeId?: string,
    userName?: string
  ): Promise<{ success: boolean; scansCleared: number; qrcodesReset: number; message: string }> {
    const res = await fetch(`${API_BASE}/analytics/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCodeId, userName }),
    });
    if (!res.ok) throw new Error('Erro ao resetar dados de análise');
    return res.json();
  },

  async insertManualScans(data: {
    qrCodeId: string;
    count?: number;
    device?: 'Mobile' | 'Desktop' | 'Tablet';
    os?: string;
    browser?: string;
    city?: string;
    country?: string;
    timestamp?: string;
    userName?: string;
  }): Promise<{ success: boolean; insertedCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/scans/manual-insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao inserir dados no dashboard' }));
      throw new Error(err.error || 'Erro ao inserir dados no dashboard');
    }
    return res.json();
  },

  async deleteScansBatch(data: {
    qrCodeId?: string;
    count?: number;
    period?: '24h' | '7d' | '30d' | 'all';
    userName?: string;
  }): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/scans/delete-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao retirar dados do dashboard' }));
      throw new Error(err.error || 'Erro ao retirar dados do dashboard');
    }
    return res.json();
  },

  // History
  async getHistory(options?: { search?: string; action?: string; limit?: number }): Promise<HistoryLog[]> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.action && options.action !== 'all') params.append('action', options.action);
    if (options?.limit) params.append('limit', options.limit.toString());
    const qs = params.toString();
    const url = qs ? `${API_BASE}/history?${qs}` : `${API_BASE}/history`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao carregar histórico');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Erro ao carregar configurações');
    return res.json();
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Erro ao salvar configurações');
    return res.json();
  },

  // System Restore & Protection
  async restoreSystem(options?: {
    restoreSettings?: boolean;
    clearScans?: boolean;
    clearHistory?: boolean;
    userName?: string;
  }): Promise<{
    success: boolean;
    message: string;
    preservedClientsCount: number;
    preservedQRCodesCount: number;
  }> {
    const res = await fetch(`${API_BASE}/system/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao restaurar sistema' }));
      throw new Error(err.error || 'Erro ao restaurar sistema');
    }
    return res.json();
  },

  async getSystemBackupStatus(): Promise<{
    protectedClientsCount: number;
    protectedQRCodesCount: number;
    totalClients: number;
    totalQRCodes: number;
    lastRegistrySync: string;
    storageStatus: string;
    guarantee: string;
  }> {
    const res = await fetch(`${API_BASE}/system/backup-status`);
    if (!res.ok) throw new Error('Erro ao consultar status de backup');
    return res.json();
  },

  async syncCreatedEntities(data: {
    clients?: Client[];
    qrcodes?: QRCodeItem[];
  }): Promise<{
    success: boolean;
    syncedClients: number;
    syncedQRCodes: number;
    totalClients: number;
    totalQRCodes: number;
  }> {
    const res = await fetch(`${API_BASE}/system/sync-created`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao sincronizar entidades criadas');
    return res.json();
  },
};
