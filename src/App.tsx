import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ClientDetailView } from './components/ClientDetailView';
import { QRCodesView } from './components/QRCodesView';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { ClientPortalView } from './components/ClientPortalView';
import { QRCodeModal } from './components/QRCodeModal';
import { ClientModal } from './components/ClientModal';
import { QuickDestinationModal } from './components/QuickDestinationModal';
import { DownloadQRModal } from './components/DownloadQRModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { api } from './api';
import type {
  Client,
  QRCodeItem,
  HistoryLog,
  OverviewAnalytics,
  SystemSettings,
} from './types';
import { CheckCircle2, AlertCircle, LayoutDashboard, Users, QrCode, BarChart3, Menu } from 'lucide-react';

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('qr_auth_token');
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('qr_auth_user');
    return saved ? JSON.parse(saved) : { name: 'Admin Master', email: 'admin@qrdynamic.com' };
  });

  // Routing & View state
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedQRIdForAnalytics, setSelectedQRIdForAnalytics] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Entities State
  const [clients, setClients] = useState<Client[]>([]);
  const [qrcodes, setQrcodes] = useState<QRCodeItem[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewAnalytics | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    platformName: 'QR Dynamic Hub',
    companyName: 'QR Dynamic Tecnologia Ltda',
    supportEmail: 'suporte@qrdynamic.com',
    supportPhone: '+55 11 3456-7890',
    baseDomain: typeof window !== 'undefined' ? window.location.origin : 'https://qrdynamic.app',
    defaultQrColor: '#0f172a',
    defaultBgColor: '#ffffff',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Global search state for Header bar and real-time table filtering
  const [globalSearch, setGlobalSearch] = useState('');

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<QRCodeItem | null>(null);
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isQuickDestOpen, setIsQuickDestOpen] = useState(false);
  const [quickDestQR, setQuickDestQR] = useState<QRCodeItem | null>(null);

  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadTargetQR, setDownloadTargetQR] = useState<QRCodeItem | null>(null);

  // Logout confirmation modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Custom Delete Confirm Modal State (replaces native window.confirm)
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'client' | 'qr';
    id: string;
    name: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    type: 'client',
    id: '',
    name: '',
    isDeleting: false,
  });

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load core data
  const loadAppData = useCallback(async () => {
    if (!isAuthenticated) return;
    if (currentUser?.role === 'client') {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [clientsData, qrcodesData, overviewData, logsData, settingsData] = await Promise.all([
        api.getClients(),
        api.getQRCodes(),
        api.getOverviewAnalytics(),
        api.getHistory(),
        api.getSettings(),
      ]);
      // Filtro estrito: jamais incluir cliente fictício legado
      const isFictional = (c: any) =>
        !c || c.id === 'cli_1791623610427_47d40b';

      // Regra estrita: apenas excluir códigos dummy legados, mantendo 100% dos QR codes criados pelo usuário
      const isTestQR = (q: any) =>
        !q ||
        q.id === 'qr_1791791581792_f83bb1' ||
        q.id === 'qr_1791970083519_347d8f';

      const validClientsData = (clientsData || []).filter((c: any) => !isFictional(c));
      const validQRsData = (qrcodesData || []).filter((q: any) => !isTestQR(q));

      // Dados autênticos inseridos pelo administrador
      let finalClients = [...validClientsData];
      let finalQRs = [...validQRsData];
      let needsSyncToServer = false;

      try {
        const deletedQRsRaw = localStorage.getItem('qr_deleted_ids_cache');
        const deletedQRIds: string[] = deletedQRsRaw ? JSON.parse(deletedQRsRaw) : [];

        // Excluir imediatamente códigos deletados da lista vinda do servidor
        if (deletedQRIds.length > 0) {
          finalQRs = finalQRs.filter((q: any) => !deletedQRIds.includes(q.id));
        }

        const storedClientsRaw = localStorage.getItem('qr_persistent_clients_cache');
        const storedQRsRaw = localStorage.getItem('qr_persistent_qrcodes_cache');
        const storedClients = (storedClientsRaw ? JSON.parse(storedClientsRaw) : []).filter(
          (c: any) => !isFictional(c)
        );
        const storedQRs = (storedQRsRaw ? JSON.parse(storedQRsRaw) : []).filter(
          (q: any) => q && q.id && q.name && !isTestQR(q) && !deletedQRIds.includes(q.id)
        );

        // 1. RECONCILIAÇÃO DE CLIENTES E PRESERVAÇÃO DE LOGOTIPOS
        // Para cada cliente persistido no navegador:
        storedClients.forEach((storedC: any) => {
          const serverIdx = finalClients.findIndex((c: any) => c.id === storedC.id);
          if (serverIdx === -1) {
            // Cliente criado pelo administrador ausente no servidor (ex: após restart) -> RESTAURAR
            finalClients.push(storedC);
            needsSyncToServer = true;
          } else {
            const serverC = finalClients[serverIdx];
            // Se o cliente local possui logotipo e o servidor não possui -> PRESERVAR LOGOTIPO
            if (
              storedC.logoUrl &&
              storedC.logoUrl.trim() !== '' &&
              (!serverC.logoUrl || serverC.logoUrl.trim() === '')
            ) {
              finalClients[serverIdx] = {
                ...serverC,
                logoUrl: storedC.logoUrl,
              };
              needsSyncToServer = true;
            }
          }
        });

        // 2. RECONCILIAÇÃO E PRESERVAÇÃO TOTAL DE QR CODES CRIADOS
        // Para cada QR code persistido no navegador:
        storedQRs.forEach((storedQ: any) => {
          if (!storedQ || !storedQ.id || isTestQR(storedQ) || deletedQRIds.includes(storedQ.id)) return;
          const serverIdx = finalQRs.findIndex((q: any) => q.id === storedQ.id);
          if (serverIdx === -1) {
            // QR Code criado pelo administrador ausente no servidor (ex: após atualização/deploy) -> NUNCA APAGAR! RESTAURAR!
            const cleanStored = { ...storedQ };
            if (cleanStored.style) {
              delete cleanStored.style.logoUrl;
              delete cleanStored.style.logoSize;
            }
            finalQRs.push(cleanStored);
            needsSyncToServer = true;
          } else {
            const serverQ = finalQRs[serverIdx];

            // PRESERVAÇÃO INVIOLÁVEL DE SLUGS DO ADMINISTRADOR:
            let finalSlug = serverQ.shortCode;
            if (storedQ.shortCode && storedQ.shortCode.trim() !== '') {
              const cleanStoredSlug = storedQ.shortCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
              if (cleanStoredSlug !== serverQ.shortCode) {
                finalSlug = cleanStoredSlug;
                needsSyncToServer = true;
              }
            }

            const storedTime = storedQ.updatedAt ? new Date(storedQ.updatedAt).getTime() : 0;
            const serverTime = serverQ.updatedAt ? new Date(serverQ.updatedAt).getTime() : 0;
            const primary = storedTime >= serverTime ? storedQ : serverQ;

            finalQRs[serverIdx] = {
              ...serverQ,
              ...primary,
              shortCode: finalSlug,
              status: primary.status || serverQ.status || 'active',
              destinationUrl: primary.destinationUrl || serverQ.destinationUrl,
              style: {
                ...serverQ.style,
                ...(primary.style || {}),
              },
            };

            // Regra do usuário: NÃO colocar logo nos QR codes
            if (finalQRs[serverIdx].style) {
              delete finalQRs[serverIdx].style.logoUrl;
              delete finalQRs[serverIdx].style.logoSize;
            }
          }
        });

        // Limpeza final de logos nos QR codes
        finalQRs.forEach((qr: any) => {
          if (qr.style) {
            delete qr.style.logoUrl;
            delete qr.style.logoSize;
          }
        });

        // 3. SE DETECTAMOS DIFERENÇAS, SINCRONIZAR AUTOMATICAMENTE COM O SERVIDOR (AWAIT)
        if (needsSyncToServer) {
          try {
            await api.syncCreatedEntities({ clients: finalClients, qrcodes: finalQRs });
          } catch (syncErr) {
            console.warn('Erro ao sincronizar entidades com servidor:', syncErr);
          }
        }

        // 4. ATUALIZAR CACHE LOCAL PERSISTENTE COM DADOS CONSOLIDADOS
        localStorage.setItem('qr_persistent_clients_cache', JSON.stringify(finalClients));
        localStorage.setItem('qr_persistent_qrcodes_cache', JSON.stringify(finalQRs));
      } catch (e) {
        console.warn('Erro ao processar cache persistente local:', e);
      }

      setClients(finalClients);
      setQrcodes(finalQRs);
      setOverviewStats(overviewData);
      setHistoryLogs(logsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser?.role]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAppData();
    }
  }, [isAuthenticated, loadAppData]);

  // Synchronize and validate session state with server on mount or auth change
  useEffect(() => {
    const syncAuthSession = async () => {
      const token = localStorage.getItem('qr_auth_token');
      const savedUserStr = localStorage.getItem('qr_auth_user');
      if (!token || !savedUserStr) return;

      try {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser.role === 'client' && (savedUser.clientId || savedUser.id)) {
          const clientId = savedUser.clientId || savedUser.id;
          const res = await fetch(`/api/client/portal-data?clientId=${clientId}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.client) {
              const updatedSession = {
                ...savedUser,
                name: data.client.name,
                email: data.client.email,
                hasPassword: Boolean(data.client.password),
                passwordUpdatedAt: data.client.updatedAt || new Date().toISOString(),
              };
              localStorage.setItem('qr_auth_user', JSON.stringify(updatedSession));
              setCurrentUser(updatedSession);
            }
          }
        } else if (savedUser.role === 'admin') {
          const res = await fetch('/api/auth/profile');
          if (res.ok) {
            const data = await res.json();
            if (data?.id) {
              const updatedSession = {
                ...savedUser,
                name: data.name,
                email: data.email,
              };
              localStorage.setItem('qr_auth_user', JSON.stringify(updatedSession));
              setCurrentUser(updatedSession);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar sessão de autenticação:', err);
      }
    };
    syncAuthSession();
  }, [isAuthenticated]);

  // Auth Handlers with validation step to ensure valid token and session sync
  const handleLoginSuccess = (token: string, user: any) => {
    // Validation step: ensure valid token and user structure before syncing session
    if (!token || typeof token !== 'string') {
      showToast('Token de autenticação inválido recebido.', 'error');
      return;
    }
    if (!user || typeof user !== 'object' || !user.role) {
      showToast('Dados de usuário inválidos para criação de sessão.', 'error');
      return;
    }

    const sessionUser = {
      ...user,
      hasPassword: user.hasPassword !== undefined ? Boolean(user.hasPassword) : Boolean(user.password),
      passwordUpdatedAt: user.passwordUpdatedAt || user.updatedAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    localStorage.setItem('qr_auth_token', token);
    localStorage.setItem('qr_auth_user', JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);
    setIsAuthenticated(true);
    if (user.role === 'client') {
      setCurrentView('client_portal');
    } else {
      setCurrentView('dashboard');
    }
    showToast(`Bem-vindo, ${user.name}!`);
  };

  const handleOpenLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('qr_auth_token');
    localStorage.removeItem('qr_auth_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedClient(null);
    setCurrentView('dashboard');
    setIsLogoutModalOpen(false);
    showToast('Sessão encerrada com sucesso.');
  };

  // Analytics Reset Handler
  const handleResetAnalytics = async (qrCodeId?: string) => {
    try {
      const res = await api.resetAnalytics(qrCodeId, currentUser?.name);
      await loadAppData();
      showToast(res.message || 'Dados de análise resetados com sucesso!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao resetar dados de análise.', 'error');
      throw err;
    }
  };

  // System Restore Handler: Guarantees created clients and QR codes are NEVER altered
  const handleRestoreSystem = async (options: {
    restoreSettings?: boolean;
    clearScans?: boolean;
    clearHistory?: boolean;
  }) => {
    try {
      const res = await api.restoreSystem({
        ...options,
        clearScans: false,
        userName: currentUser?.name || 'Administrador Master',
      });
      await loadAppData();
      showToast(
        res.message ||
          'Sistema restaurado com sucesso! Todos os clientes e QR Codes criados foram preservados e NÃO sofreram alterações.'
      );
    } catch (err: any) {
      showToast(err.message || 'Erro ao restaurar o sistema.', 'error');
      throw err;
    }
  };

  // QR Code actions
  const handleSaveQR = async (qrData: Partial<QRCodeItem>) => {
    let savedQR: QRCodeItem;
    if (editingQR) {
      savedQR = await api.updateQRCode(editingQR.id, qrData);
      setQrcodes((prev) => prev.map((item) => (item.id === savedQR.id ? savedQR : item)));
      showToast('QR Code atualizado com sucesso!');
    } else {
      savedQR = await api.createQRCode(qrData);
      setQrcodes((prev) => [savedQR, ...prev]);
      showToast('QR Code dinâmico gerado com sucesso!');
    }

    try {
      // 1. Desmarcar o id de qualquer lista de deletados
      const deletedList = JSON.parse(localStorage.getItem('qr_deleted_ids_cache') || '[]');
      const cleanDeletedList = deletedList.filter((did: string) => did !== savedQR.id);
      localStorage.setItem('qr_deleted_ids_cache', JSON.stringify(cleanDeletedList));

      // 2. Persistir imediatamente no cache local
      const stored = JSON.parse(localStorage.getItem('qr_persistent_qrcodes_cache') || '[]');
      const nextList = [savedQR, ...stored.filter((q: any) => q.id !== savedQR.id)];
      localStorage.setItem('qr_persistent_qrcodes_cache', JSON.stringify(nextList));

      // 3. Sincronizar com o banco de dados do servidor
      await api.syncCreatedEntities({ qrcodes: [savedQR] });
    } catch (e) {
      console.warn('Erro ao atualizar cache local de QR Codes:', e);
    }

    // 4. Recarregar dados consolidados
    await loadAppData();
  };

  const handleToggleQRStatus = async (id: string) => {
    const currentQR = qrcodes.find((q) => q.id === id);
    if (!currentQR) return;
    const targetStatus = currentQR.status === 'active' ? 'inactive' : 'active';
    const nowIso = new Date().toISOString();

    // 1. Atualização instantânea e otimista na interface
    setQrcodes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: targetStatus, updatedAt: nowIso } : q))
    );

    // 2. Persistir imediatamente no cache local
    try {
      const stored = JSON.parse(localStorage.getItem('qr_persistent_qrcodes_cache') || '[]');
      const nextList = stored.map((q: any) =>
        q.id === id ? { ...q, status: targetStatus, updatedAt: nowIso } : q
      );
      localStorage.setItem('qr_persistent_qrcodes_cache', JSON.stringify(nextList));
    } catch (e) {
      console.warn('Erro ao atualizar cache local:', e);
    }

    // 3. Chamar API do servidor
    try {
      const updated = await api.toggleQRCodeStatus(id, targetStatus);
      setQrcodes((prev) => prev.map((q) => (q.id === id ? { ...updated, status: targetStatus } : q)));
      try {
        const stored = JSON.parse(localStorage.getItem('qr_persistent_qrcodes_cache') || '[]');
        const nextList = stored.map((q: any) => (q.id === id ? { ...q, ...updated, status: targetStatus } : q));
        localStorage.setItem('qr_persistent_qrcodes_cache', JSON.stringify(nextList));
      } catch (e) {
        console.warn('Erro ao atualizar cache local:', e);
      }
      showToast(
        targetStatus === 'active' ? 'QR Code ativado com sucesso!' : 'QR Code pausado com sucesso.'
      );
    } catch (err: any) {
      // Reverter se falhar
      setQrcodes((prev) => prev.map((q) => (q.id === id ? currentQR : q)));
      showToast(err.message || 'Erro ao alterar status.', 'error');
    }
  };

  const handleQuickDestinationChange = async (id: string, newUrl: string) => {
    try {
      const updated = await api.updateQRCode(id, { destinationUrl: newUrl });
      setQrcodes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      try {
        const stored = JSON.parse(localStorage.getItem('qr_persistent_qrcodes_cache') || '[]');
        const nextList = stored.map((q: any) => (q.id === id ? { ...q, ...updated } : q));
        localStorage.setItem('qr_persistent_qrcodes_cache', JSON.stringify(nextList));
      } catch (e) {
        console.warn('Erro ao atualizar cache local:', e);
      }
      showToast('Destino do QR Code atualizado sem necessidade de reimpressão!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar destino.', 'error');
    }
  };

  const handleDuplicateQR = async (id: string) => {
    try {
      const duplicated = await api.duplicateQRCode(id);
      setQrcodes((prev) => [duplicated, ...prev]);
      try {
        const stored = JSON.parse(localStorage.getItem('qr_persistent_qrcodes_cache') || '[]');
        localStorage.setItem('qr_persistent_qrcodes_cache', JSON.stringify([duplicated, ...stored]));
      } catch (e) {
        console.warn('Erro ao atualizar cache local:', e);
      }
      showToast('QR Code duplicado com sucesso!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao duplicar QR Code.', 'error');
    }
  };

  const handleTestScan = async (id: string) => {
    try {
      const res = await api.testScan(id);
      showToast(`Scan simulado! Total de leituras: ${res.scanCount}`);
      // Update scan count locally
      setQrcodes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, scanCount: res.scanCount, lastScannedAt: new Date().toISOString() } : q))
      );
      loadAppData();
    } catch (err: any) {
      showToast('Erro ao simular scan.', 'error');
    }
  };

  // Client actions
  // Dedicated handleUpdateClient with validation step to ensure password changes sync correctly with local storage and session state
  const handleUpdateClient = async (clientId: string, clientData: Partial<Client>): Promise<Client> => {
    if (!clientId) {
      throw new Error('ID do cliente é obrigatório para atualização.');
    }

    // Validation step: validate and sanitize password update if provided
    if (clientData.password !== undefined && clientData.password !== null) {
      const cleanPass = String(clientData.password).trim();
      if (cleanPass !== '') {
        if (cleanPass.length < 4) {
          throw new Error('A nova senha deve possuir no mínimo 4 caracteres.');
        }
        clientData.password = cleanPass;
      } else {
        delete clientData.password;
      }
    }

    // Call API to perform update
    const updated = await api.updateClient(clientId, clientData);

    // Update state lists
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedClient?.id === updated.id) {
      setSelectedClient(updated);
    }

    // Validation & Sync Step: Ensure password changes sync correctly with local storage and active session state
    try {
      const activeUserStr = localStorage.getItem('qr_auth_user');
      if (activeUserStr) {
        const activeUser = JSON.parse(activeUserStr);
        if (activeUser && (activeUser.clientId === clientId || activeUser.id === clientId)) {
          const updatedSessionUser = {
            ...activeUser,
            name: updated.name,
            email: updated.email,
            hasPassword: Boolean(updated.password),
            passwordUpdatedAt: updated.updatedAt || new Date().toISOString(),
          };
          setCurrentUser(updatedSessionUser);
          localStorage.setItem('qr_auth_user', JSON.stringify(updatedSessionUser));
        }
      }

      // Persistir dados atualizados (incluindo logoUrl) no cache local e no registro do servidor
      const stored = JSON.parse(localStorage.getItem('qr_persistent_clients_cache') || '[]');
      const exists = stored.some((c: any) => c.id === updated.id);
      const nextStored = exists
        ? stored.map((c: any) => (c.id === updated.id ? updated : c))
        : [updated, ...stored];
      localStorage.setItem('qr_persistent_clients_cache', JSON.stringify(nextStored));
      api.syncCreatedEntities({ clients: [updated] }).catch(() => {});
    } catch (err) {
      console.warn('Erro ao sincronizar sessão de autenticação após atualização:', err);
    }

    return updated;
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      if (editingClient) {
        await handleUpdateClient(editingClient.id, clientData);
        showToast('Cadastro do cliente atualizado com sucesso!');
      } else {
        if (clientData.password) {
          const clean = String(clientData.password).trim();
          if (clean && clean.length < 4) {
            throw new Error('A nova senha deve possuir no mínimo 4 caracteres.');
          }
          clientData.password = clean;
        }
        const created = await api.createClient(clientData);
        setClients((prev) => [created, ...prev]);
        try {
          const stored = JSON.parse(localStorage.getItem('qr_persistent_clients_cache') || '[]');
          localStorage.setItem(
            'qr_persistent_clients_cache',
            JSON.stringify([created, ...stored.filter((c: any) => c.id !== created.id)])
          );
          await api.syncCreatedEntities({ clients: [created] });
        } catch (e) {
          console.warn('Erro ao salvar novo cliente no cache local:', e);
        }
        showToast('Novo cliente cadastrado com sucesso!');
      }
      await loadAppData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar cliente.', 'error');
      throw err;
    }
  };

  const handleDeleteQR = (id: string, name: string) => {
    setDeleteModalState({
      isOpen: true,
      type: 'qr',
      id,
      name,
      isDeleting: false,
    });
  };

  const handleDeleteClient = (id: string, name: string) => {
    setDeleteModalState({
      isOpen: true,
      type: 'client',
      id,
      name,
      isDeleting: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { type, id, name } = deleteModalState;
    if (!id) return;

    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

    try {
      if (type === 'client') {
        await api.deleteClient(id);
        setClients((prev) => prev.filter((c) => c.id !== id));
        setQrcodes((prev) => prev.filter((q) => q.clientId !== id));
        try {
          const storedClients = JSON.parse(localStorage.getItem('qr_persistent_clients_cache') || '[]');
          const storedQRs = JSON.parse(localStorage.getItem('qr_persistent_qrcodes_cache') || '[]');
          localStorage.setItem(
            'qr_persistent_clients_cache',
            JSON.stringify(storedClients.filter((c: any) => c.id !== id))
          );
          localStorage.setItem(
            'qr_persistent_qrcodes_cache',
            JSON.stringify(storedQRs.filter((q: any) => q.clientId !== id))
          );
        } catch (e) {
          console.warn('Erro ao atualizar cache local após exclusão:', e);
        }
        if (selectedClient?.id === id) {
          setCurrentView('clients');
          setSelectedClient(null);
        }
        showToast(`Cliente "${name}" e QR Codes vinculados foram excluídos com sucesso.`);
      } else {
        // 1. Atualizar estado imediatamente
        setQrcodes((prev) => prev.filter((q) => q.id !== id));

        // 2. Registrar id na lista definitiva de excluídos do navegador
        try {
          const deletedList = JSON.parse(localStorage.getItem('qr_deleted_ids_cache') || '[]');
          if (!deletedList.includes(id)) {
            deletedList.push(id);
            localStorage.setItem('qr_deleted_ids_cache', JSON.stringify(deletedList));
          }
          const storedQRs = JSON.parse(localStorage.getItem('qr_persistent_qrcodes_cache') || '[]');
          localStorage.setItem(
            'qr_persistent_qrcodes_cache',
            JSON.stringify(storedQRs.filter((q: any) => q.id !== id))
          );
        } catch (e) {
          console.warn('Erro ao atualizar cache local após exclusão:', e);
        }

        // 3. Excluir no backend
        await api.deleteQRCode(id);
        showToast(`QR Code "${name}" excluído com sucesso.`);
      }
      setDeleteModalState({ isOpen: false, type: 'client', id: '', name: '', isDeleting: false });
      await loadAppData();
    } catch (err: any) {
      showToast(err.message || `Erro ao excluir ${type === 'client' ? 'cliente' : 'QR Code'}.`, 'error');
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCloseDeleteModal = () => {
    if (!deleteModalState.isDeleting) {
      setDeleteModalState({ isOpen: false, type: 'client', id: '', name: '', isDeleting: false });
    }
  };

  const handleAssignClient = async (qrId: string, clientId: string | null) => {
    try {
      const updated = await api.assignQRCodeToClient(qrId, clientId, currentUser?.name);
      setQrcodes((prev) => prev.map((q) => (q.id === qrId ? updated : q)));
      const clientName = clientId ? clients.find((c) => c.id === clientId)?.name || 'Cliente' : 'Avulso';
      showToast(
        clientId
          ? `QR Code direcionado com sucesso para o cliente "${clientName}"!`
          : 'QR Code desvinculado e mantido em modo avulso.',
        'success'
      );
      loadAppData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atribuir cliente ao QR Code.', 'error');
      throw err;
    }
  };

  // Settings Save
  const handleSaveSettings = async (newSettings: SystemSettings) => {
    try {
      const saved = await api.updateSettings(newSettings);
      setSettings(saved);
      showToast('Configurações do sistema salvas com sucesso!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar configurações.', 'error');
    }
  };

  // Update Admin Profile & Login Credentials
  const handleUpdateAdminProfile = async (data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    try {
      const res = await api.updateAdminProfile(data);
      if (res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('qr_auth_user', JSON.stringify(res.user));
      }
      showToast('Credenciais do Administrador atualizadas com sucesso!');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar credenciais.', 'error');
      throw err;
    }
  };

  // Repair Admin Credentials & Save New Ones
  const handleRepairAdminCredentials = async (data: {
    name?: string;
    email?: string;
    password?: string;
    newPassword?: string;
    resetToDefault?: boolean;
  }) => {
    try {
      const res = await api.repairAdminCredentials(data);
      if (res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('qr_auth_user', JSON.stringify(res.user));
      }
      showToast(res.message || 'Credenciais de Administrador reparadas com sucesso!');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Erro ao reparar credenciais.', 'error');
      throw err;
    }
  };

  // If not authenticated, render LoginView
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // If authenticated as client, render dedicated ClientPortalView
  if (currentUser?.role === 'client') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        <ClientPortalView
          clientId={currentUser.clientId || currentUser.id}
          isAdminView={false}
          onLogout={handleOpenLogoutModal}
          onUpdateClient={handleUpdateClient}
          onOpenDownloadQR={(qr) => {
            setDownloadTargetQR(qr);
            setIsDownloadOpen(true);
          }}
          onOpenQuickDestination={(qr) => {
            setQuickDestQR(qr);
            setIsQuickDestOpen(true);
          }}
          onTestScan={handleTestScan}
          onReloadData={loadAppData}
        />

        {/* Download Modal for Client */}
        <DownloadQRModal
          isOpen={isDownloadOpen}
          onClose={() => {
            setIsDownloadOpen(false);
            setDownloadTargetQR(null);
          }}
          qr={downloadTargetQR}
          onTestScan={handleTestScan}
        />

        {/* Quick Destination Modal for Client */}
        <QuickDestinationModal
          isOpen={isQuickDestOpen}
          onClose={() => {
            setIsQuickDestOpen(false);
            setQuickDestQR(null);
          }}
          qr={quickDestQR}
          onSave={handleQuickDestinationChange}
        />

        {/* Logout Modal for Client */}
        <LogoutConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleConfirmLogout}
          userName={currentUser?.name}
          userEmail={currentUser?.email}
        />
      </div>
    );
  }

  // Active client object with linked QR codes
  const detailedClient = selectedClient
    ? {
        ...selectedClient,
        qrcodes: qrcodes.filter((q) => q.clientId === selectedClient.id),
      }
    : null;

  return (
    <div className="flex h-screen h-[100dvh] max-h-[100dvh] w-full min-w-0 bg-slate-100/70 text-slate-800 antialiased font-sans overflow-hidden">
      {/* Toast alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-top-4 duration-200 text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view !== 'client_detail') {
            setSelectedClient(null);
          }
          setMobileMenuOpen(false);
        }}
        settings={settings}
        user={currentUser}
        activeQRCodesCount={qrcodes.filter((q) => q.status === 'active').length}
        totalActiveQRs={qrcodes.filter((q) => q.status === 'active').length}
        totalClientsCount={clients.length}
        onLogout={handleOpenLogoutModal}
        isMobileOpen={mobileMenuOpen}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          qrcodes={qrcodes}
          clients={clients}
          userName={currentUser?.name || 'Administrador'}
          userEmail={currentUser?.email || 'admin@qrdynamic.com'}
          onLogout={handleOpenLogoutModal}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            if (view !== 'client_detail') {
              setSelectedClient(null);
            }
          }}
          onOpenMobileSidebar={() => setMobileMenuOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onOpenNewQRCode={() => {
            setEditingQR(null);
            setPreselectedClientId(undefined);
            setIsQRModalOpen(true);
          }}
          onOpenNewQR={() => {
            setEditingQR(null);
            setPreselectedClientId(undefined);
            setIsQRModalOpen(true);
          }}
          onOpenNewClient={() => {
            setEditingClient(null);
            setIsClientModalOpen(true);
          }}
          onSelectQRCode={(qr) => {
            setSelectedQRIdForAnalytics(qr.id);
            setCurrentView('analytics');
          }}
          onSelectQR={(qr) => {
            setSelectedQRIdForAnalytics(qr.id);
            setCurrentView('analytics');
          }}
          onSelectClient={(client) => {
            setSelectedClient(client);
            setCurrentView('client_detail');
          }}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-6 overflow-x-hidden min-w-0 w-full">
          {currentView === 'dashboard' && (
            <DashboardView
              overviewData={overviewStats}
              stats={overviewStats}
              qrcodes={qrcodes}
              clients={clients}
              isLoading={isLoading}
              onNavigate={setCurrentView}
              onReloadData={loadAppData}
              onResetAnalytics={handleResetAnalytics}
              onOpenNewQR={() => {
                setEditingQR(null);
                setPreselectedClientId(undefined);
                setIsQRModalOpen(true);
              }}
              onOpenNewClient={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              onSelectClient={(c) => {
                setSelectedClient(c);
                setCurrentView('client_detail');
              }}
              onSelectQRCode={(qr) => {
                setSelectedQRIdForAnalytics(qr.id);
                setCurrentView('analytics');
              }}
              onSelectQR={(qr) => {
                setSelectedQRIdForAnalytics(qr.id);
                setCurrentView('analytics');
              }}
              onQuickChangeUrl={(qr) => {
                setQuickDestQR(qr);
                setIsQuickDestOpen(true);
              }}
              onDownloadQR={(qr) => {
                setDownloadTargetQR(qr);
                setIsDownloadOpen(true);
              }}
              onTestScan={handleTestScan}
            />
          )}

          {currentView === 'clients' && (
            <ClientsView
              clients={clients}
              isLoading={isLoading}
              searchQuery={globalSearch}
              onSearchChange={setGlobalSearch}
              onOpenNewClient={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              onSelectClient={(c) => {
                setSelectedClient(c);
                setCurrentView('client_detail');
              }}
              onOpenClientPortal={(c) => {
                setSelectedClient(c);
                setCurrentView('client_portal');
              }}
              onEditClient={(c) => {
                setEditingClient(c);
                setIsClientModalOpen(true);
              }}
              onDeleteClient={handleDeleteClient}
              onCreateQRForClient={(c) => {
                setEditingQR(null);
                setPreselectedClientId(c.id);
                setIsQRModalOpen(true);
              }}
            />
          )}

          {currentView === 'client_detail' && detailedClient && (
            <ClientDetailView
              client={detailedClient}
              onBack={() => {
                setCurrentView('clients');
                setSelectedClient(null);
              }}
              onOpenClientPortal={(c) => {
                setSelectedClient(c);
                setCurrentView('client_portal');
              }}
              onEditClient={(c) => {
                setEditingClient(c);
                setIsClientModalOpen(true);
              }}
              onDeleteClient={handleDeleteClient}
              onDeleteQR={handleDeleteQR}
              onCreateQR={(c) => {
                setEditingQR(null);
                setPreselectedClientId(c.id);
                setIsQRModalOpen(true);
              }}
              onSelectQR={(qr) => {
                setSelectedQRIdForAnalytics(qr.id);
                setCurrentView('analytics');
              }}
              onToggleStatusQR={handleToggleQRStatus}
              onQuickChangeUrl={(qr) => {
                setQuickDestQR(qr);
                setIsQuickDestOpen(true);
              }}
              onDownloadQR={(qr) => {
                setDownloadTargetQR(qr);
                setIsDownloadOpen(true);
              }}
            />
          )}

          {currentView === 'client_portal' && (
            <div className="bg-slate-900 min-h-full">
              <ClientPortalView
                clientId={selectedClient?.id || clients[0]?.id}
                isAdminView={true}
                onBackToAdmin={() => {
                  setCurrentView('clients');
                  setSelectedClient(null);
                }}
                onLogout={handleOpenLogoutModal}
                onUpdateClient={handleUpdateClient}
                onOpenDownloadQR={(qr) => {
                  setDownloadTargetQR(qr);
                  setIsDownloadOpen(true);
                }}
                onOpenQuickDestination={(qr) => {
                  setQuickDestQR(qr);
                  setIsQuickDestOpen(true);
                }}
                onTestScan={handleTestScan}
                onReloadData={loadAppData}
              />
            </div>
          )}

          {currentView === 'qrcodes' && (
            <QRCodesView
              qrcodes={qrcodes}
              clients={clients}
              isLoading={isLoading}
              searchQuery={globalSearch}
              onSearchChange={setGlobalSearch}
              onOpenNewQR={() => {
                setEditingQR(null);
                setPreselectedClientId(undefined);
                setIsQRModalOpen(true);
              }}
              onEditQR={(qr) => {
                setEditingQR(qr);
                setIsQRModalOpen(true);
              }}
              onQuickChangeUrl={(qr) => {
                setQuickDestQR(qr);
                setIsQuickDestOpen(true);
              }}
              onToggleStatus={handleToggleQRStatus}
              onDuplicateQR={handleDuplicateQR}
              onDeleteQR={handleDeleteQR}
              onDownloadQR={(qr) => {
                setDownloadTargetQR(qr);
                setIsDownloadOpen(true);
              }}
              onViewAnalytics={(qr) => {
                setSelectedQRIdForAnalytics(qr.id);
                setCurrentView('analytics');
              }}
              onTestScan={handleTestScan}
              onAssignClient={handleAssignClient}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView
              qrcodes={qrcodes}
              selectedQRId={selectedQRIdForAnalytics}
              onSelectQR={(qr) => setSelectedQRIdForAnalytics(qr.id)}
              onTestScan={handleTestScan}
              onResetAnalytics={handleResetAnalytics}
              userName={currentUser?.name}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              logs={historyLogs}
              isLoading={isLoading}
              onRefresh={loadAppData}
              searchQuery={globalSearch}
              onSearchChange={setGlobalSearch}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              user={currentUser}
              onSaveSettings={handleSaveSettings}
              onUpdateAdminProfile={handleUpdateAdminProfile}
              onRepairAdminCredentials={handleRepairAdminCredentials}
              onLogout={handleOpenLogoutModal}
              onResetAnalytics={handleResetAnalytics}
              onRestoreSystem={handleRestoreSystem}
              clients={clients}
              qrcodes={qrcodes}
              totalScans={overviewStats?.stats?.totalScans || 0}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          id="mobile-bottom-nav"
          className="lg:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around z-30 shrink-0 shadow-lg"
        >
          <button
            id="mobile-nav-dashboard"
            type="button"
            onClick={() => {
              setCurrentView('dashboard');
              setSelectedClient(null);
            }}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 px-1 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer active:scale-95 ${
              currentView === 'dashboard'
                ? 'text-indigo-600 bg-indigo-50/70 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="leading-none">Início</span>
          </button>

          <button
            id="mobile-nav-qrcodes"
            type="button"
            onClick={() => {
              setCurrentView('qrcodes');
              setSelectedClient(null);
            }}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 px-1 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer active:scale-95 ${
              currentView === 'qrcodes'
                ? 'text-indigo-600 bg-indigo-50/70 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="leading-none">QR Codes</span>
          </button>

          <button
            id="mobile-nav-clients"
            type="button"
            onClick={() => {
              setCurrentView('clients');
              setSelectedClient(null);
            }}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 px-1 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer active:scale-95 ${
              currentView === 'clients' || currentView === 'client_detail'
                ? 'text-indigo-600 bg-indigo-50/70 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="leading-none">Clientes</span>
          </button>

          <button
            id="mobile-nav-analytics"
            type="button"
            onClick={() => {
              setCurrentView('analytics');
              setSelectedClient(null);
            }}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 px-1 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer active:scale-95 ${
              currentView === 'analytics'
                ? 'text-indigo-600 bg-indigo-50/70 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="leading-none">Métricas</span>
          </button>

          <button
            id="mobile-nav-menu"
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 px-1 py-1 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer active:scale-95"
            aria-label="Abrir menu completo"
          >
            <Menu className="w-5 h-5" />
            <span className="leading-none">Menu</span>
          </button>
        </nav>
      </div>

      {/* MODALS */}
      {/* 1. Dynamic QR Code Generator / Editor Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setEditingQR(null);
        }}
        onSave={handleSaveQR}
        onDeleteQR={handleDeleteQR}
        editingQR={editingQR}
        clients={clients}
        initialClientId={preselectedClientId}
      />

      {/* 2. Client Management Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSaveClient}
        editingClient={editingClient}
      />

      {/* 3. Quick Change Destination Modal */}
      <QuickDestinationModal
        isOpen={isQuickDestOpen}
        onClose={() => {
          setIsQuickDestOpen(false);
          setQuickDestQR(null);
        }}
        qr={quickDestQR}
        onSave={handleQuickDestinationChange}
      />

      {/* 4. Download & Export QR Modal */}
      <DownloadQRModal
        isOpen={isDownloadOpen}
        onClose={() => {
          setIsDownloadOpen(false);
          setDownloadTargetQR(null);
        }}
        qr={downloadTargetQR}
        onTestScan={handleTestScan}
      />

      {/* 5. Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title={deleteModalState.type === 'client' ? 'Excluir Cliente' : 'Excluir QR Code'}
        itemName={deleteModalState.name}
        description={
          deleteModalState.type === 'client'
            ? 'Tem certeza que deseja remover o cliente'
            : 'Tem certeza que deseja remover o QR Code'
        }
        warningNote={
          deleteModalState.type === 'client'
            ? 'Atenção: Ao excluir este cliente, todos os QR Codes dinâmicos vinculados e seus redirecionamentos também serão removidos definitivamente do sistema.'
            : 'Atenção: O link dinâmico curto e as leituras deste QR Code deixarão de funcionar imediatamente.'
        }
        isDeleting={deleteModalState.isDeleting}
      />

      {/* 6. Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        userName={currentUser?.name}
        userEmail={currentUser?.email}
      />
    </div>
  );
}
