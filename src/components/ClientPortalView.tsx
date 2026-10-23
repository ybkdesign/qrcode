import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  BarChart3,
  User,
  LayoutDashboard,
  ExternalLink,
  Copy,
  Check,
  Download,
  Edit2,
  Play,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Search,
  RefreshCw,
  Sparkles,
  Shield,
  FileSpreadsheet,
  HelpCircle,
  KeyRound,
  Save,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../api';
import type { Client, QRCodeItem, ClientPortalData, ScanRecord } from '../types';
import {
  formatJapaneseAddress,
  formatJapanesePostalCode,
  formatShortJapaneseLocation,
  getGoogleMapsSearchUrl,
} from '../utils/japaneseAddress';
import { renderQRCodeToCanvas } from '../utils/qrGenerator';

interface ClientPortalViewProps {
  clientId?: string;
  isAdminView?: boolean;
  onBackToAdmin?: () => void;
  onLogout: () => void;
  onOpenDownloadQR?: (qr: QRCodeItem) => void;
  onOpenQuickDestination?: (qr: QRCodeItem) => void;
  onTestScan?: (qrId: string) => Promise<void>;
  onUpdateClient?: (clientId: string, clientData: Partial<Client>) => Promise<Client>;
  onReloadData?: () => Promise<void>;
}

// Mini QR Canvas Thumbnail component
const QRThumbnail: React.FC<{ qr: QRCodeItem; size?: number }> = ({ qr, size = 110 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dynamicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${qr.shortCode}`;

  useEffect(() => {
    if (canvasRef.current) {
      renderQRCodeToCanvas({
        text: dynamicUrl,
        style: qr.style || {
          foregroundColor: '#0f172a',
          backgroundColor: '#ffffff',
          dotType: 'rounded',
          eyeFrame: 'rounded',
          eyeBall: 'rounded',
          margin: 1,
          size: 256,
        },
        canvas: canvasRef.current,
        targetSize: size,
      });
    }
  }, [qr, dynamicUrl, size]);

  return (
    <div
      className="p-1.5 bg-white rounded-xl shadow-xs border border-slate-200/90 shrink-0 flex items-center justify-center"
      style={{ width: size + 12, height: size + 12 }}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
};

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  clientId,
  isAdminView,
  onBackToAdmin,
  onLogout,
  onOpenDownloadQR,
  onOpenQuickDestination,
  onTestScan,
  onUpdateClient,
  onReloadData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'qrcodes' | 'analytics' | 'profile'>('overview');
  const [data, setData] = useState<ClientPortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter for QR Codes tab
  const [searchQR, setSearchQR] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Analytics QR Filter
  const [selectedQRIdForMetrics, setSelectedQRIdForMetrics] = useState<string>('all');

  // Inline Quick Destination Editor Modal
  const [editingDestQR, setEditingDestQR] = useState<QRCodeItem | null>(null);
  const [destInput, setDestInput] = useState('');
  const [isSavingDest, setIsSavingDest] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    contactPerson: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    building: '',
    notes: '',
    password: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setLocalToast({ message, type });
    setTimeout(() => setLocalToast(null), 3500);
  };

  const loadClientData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getClientPortalData(clientId);
      setData(res);
      if (res.client) {
        setProfileForm({
          contactPerson: res.client.contactPerson || '',
          phone: res.client.phone || '',
          postalCode: res.client.postalCode || '',
          prefecture: res.client.prefecture || '',
          city: res.client.city || '',
          address: res.client.address || '',
          building: res.client.building || '',
          notes: res.client.notes || '',
          password: '',
        });
      }
    } catch (err: any) {
      console.error('Error loading client portal data:', err);
      showToast(err.message || 'Erro ao carregar dados do portal do cliente.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  const handleManualReload = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      await loadClientData();
      if (onReloadData) {
        await onReloadData();
      }
      showToast('Dados e métricas recarregados com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao recarregar dados do portal.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  // Copy link handler
  const handleCopyLink = (shortCode: string, id: string) => {
    const fullUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    showToast('Link dinâmico copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy address
  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    showToast('Endereço japonês copiado!');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Perform quick test scan
  const handleSimulateScan = async (qrId: string) => {
    try {
      if (onTestScan) {
        await onTestScan(qrId);
      } else {
        await api.testScan(qrId);
      }
      showToast('Leitura de teste registrada com sucesso!');
      await loadClientData();
    } catch {
      showToast('Erro ao simular leitura.', 'error');
    }
  };

  // Save quick destination change
  const handleSaveDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDestQR) return;
    if (!destInput.trim()) {
      showToast('Por favor insira um link de destino válido.', 'error');
      return;
    }

    try {
      setIsSavingDest(true);
      await api.updateDestination(editingDestQR.id, destInput.trim());
      showToast('Destino do QR Code atualizado com sucesso! Sem necessidade de reimpressão.');
      setEditingDestQR(null);
      await loadClientData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar destino.', 'error');
    } finally {
      setIsSavingDest(false);
    }
  };

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.client) return;

    const trimmedPassword = profileForm.password ? profileForm.password.trim() : '';

    // Validation step: ensure password meets minimum length requirement if provided
    if (trimmedPassword !== '' && trimmedPassword.length < 4) {
      showToast('A nova senha deve possuir no mínimo 4 caracteres.', 'error');
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await api.updateClientProfile({
        clientId: data.client.id,
        contactPerson: profileForm.contactPerson,
        phone: profileForm.phone,
        postalCode: profileForm.postalCode,
        prefecture: profileForm.prefecture,
        city: profileForm.city,
        address: profileForm.address,
        building: profileForm.building,
        notes: profileForm.notes,
        password: trimmedPassword !== '' ? trimmedPassword : undefined,
      });

      // Synchronize with local storage and session state
      try {
        const storedUserJson = localStorage.getItem('qr_auth_user');
        if (storedUserJson) {
          const storedUser = JSON.parse(storedUserJson);
          if (storedUser.clientId === data.client.id || storedUser.id === data.client.id) {
            const updatedUser = {
              ...storedUser,
              name: res.client.name,
              email: res.client.email,
              hasPassword: Boolean(res.client.password || trimmedPassword),
              passwordUpdatedAt: new Date().toISOString(),
            };
            localStorage.setItem('qr_auth_user', JSON.stringify(updatedUser));
          }
        }
      } catch (e) {
        console.warn('Erro ao sincronizar localStorage:', e);
      }

      if (onUpdateClient) {
        await onUpdateClient(data.client.id, res.client);
      }

      if (trimmedPassword !== '') {
        showToast(`Senha alterada com sucesso! Guarde a nova senha "${trimmedPassword}" para o próximo login.`);
      } else {
        showToast('Dados cadastrais atualizados com sucesso!');
      }

      setIsEditingProfile(false);
      await loadClientData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar dados cadastrais.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center animate-spin mb-4">
          <RefreshCw className="w-6 h-6 text-indigo-400" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Carregando Área do Cliente...</p>
      </div>
    );
  }

  const client = data?.client;
  const qrcodes = data?.qrcodes || [];
  const stats = data?.stats || {
    totalQRCodes: 0,
    activeQRCodes: 0,
    inactiveQRCodes: 0,
    totalScans: 0,
    scansLast24h: 0,
    scansLast7d: 0,
    scansLast30d: 0,
  };

  // Filtered QR Codes list
  const filteredQRCodes = qrcodes.filter((q) => {
    const qTerm = searchQR.toLowerCase();
    const matchTerm =
      q.name.toLowerCase().includes(qTerm) ||
      q.shortCode.toLowerCase().includes(qTerm) ||
      q.destinationUrl.toLowerCase().includes(qTerm);
    const matchStatus = statusFilter === 'all' ? true : q.status === statusFilter;
    return matchTerm && matchStatus;
  });

  // Filtered metrics data based on selected QR
  const currentScansList = (data?.recentScans || []).filter((s) =>
    selectedQRIdForMetrics === 'all' ? true : s.qrCodeId === selectedQRIdForMetrics
  );

  const selectedQRItem = qrcodes.find((q) => q.id === selectedQRIdForMetrics);
  const currentTotalScans = selectedQRItem ? selectedQRItem.scanCount : stats.totalScans;

  const fullAddress = client
    ? formatJapaneseAddress(client, { includePostalCode: true, includeCountry: true })
    : '';
  const mapsUrl = client ? getGoogleMapsSearchUrl(client) : '';

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast alert */}
      {localToast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-top-4 duration-200 text-xs font-semibold ${
            localToast.type === 'success'
              ? 'bg-slate-950 text-white border-slate-700 shadow-indigo-500/10'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {localToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{localToast.message}</span>
        </div>
      )}

      {/* Admin Impersonation Top Banner */}
      {isAdminView && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>
              Você está visualizando a <strong>Área do Cliente</strong> de {client?.name}.
            </span>
          </div>
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Painel Admin</span>
            </button>
          )}
        </div>
      )}

      {/* Main Client Top Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Brand & Client Identification */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/25 shrink-0 overflow-hidden bg-white border border-slate-700/80">
              {client?.logoUrl ? (
                <img
                  src={client.logoUrl}
                  alt={client.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                client?.name ? client.name.charAt(0).toUpperCase() : 'C'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                  {client?.name || 'Portal do Cliente'}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Área do Cliente
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{client?.contactPerson}</span>
                {client?.city && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      {client.city}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              type="button"
              id="btn-client-reload"
              onClick={handleManualReload}
              disabled={isRefreshing}
              title="Recarregar dados e métricas em tempo real"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Recarregando...' : 'Recarregar'}</span>
            </button>

            {isAdminView && onBackToAdmin ? (
              <button
                onClick={onBackToAdmin}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Painel Admin</span>
              </button>
            ) : (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 border-t border-slate-800/80 pt-2.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcodes')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'qrcodes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Meus QR Codes</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'qrcodes' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {qrcodes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Métricas & Scans</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Meus Dados Cadastrais</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ========================================================
            TAB 1: VISÃO GERAL
        ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total de QR Codes</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <QrCode className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{stats.totalQRCodes}</span>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {stats.activeQRCodes} Ativos
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total de Leituras</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{stats.totalScans}</span>
                  <span className="text-xs text-slate-400 font-medium">Acumulado</span>
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Leituras (7 Dias)</span>
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{stats.scansLast7d}</span>
                  <span className="text-xs text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    Semana
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Leituras (24h)</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{stats.scansLast24h}</span>
                  <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Hoje
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Chart & Device Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Scans Area Chart */}
              <div className="lg:col-span-2 bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Evolução de Leituras Diárias</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Volume de scans em seus QR Codes nos últimos 14 dias
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-xl">
                    Tempo Real
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.dailyScans || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="clientScanGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="scans"
                        name="Leituras"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#clientScanGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Devices Distribution Card */}
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">Dispositivos Utilizados</h3>
                  <p className="text-xs text-slate-400 mb-4">Aparelhos usados para escanear seus códigos</p>

                  <div className="space-y-3.5">
                    {(data?.devicesData || []).map((dev) => {
                      const total = (data?.devicesData || []).reduce((acc, d) => acc + d.value, 0) || 1;
                      const pct = Math.round((dev.value / total) * 100);
                      const Icon = dev.name === 'Mobile' ? Smartphone : dev.name === 'Tablet' ? Tablet : Monitor;

                      return (
                        <div key={dev.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                              <Icon className="w-3.5 h-3.5 text-indigo-400" />
                              {dev.name === 'Mobile' ? 'Celular / Smartphone' : dev.name}
                            </span>
                            <span className="font-bold text-white">
                              {dev.value} <span className="text-slate-400 text-[11px]">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Destino Dinâmico Ativo
                  </span>
                  <span className="text-emerald-400 font-semibold">100% Online</span>
                </div>
              </div>
            </div>

            {/* Quick QR Codes List Preview */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Seus QR Codes Dinâmicos</h3>
                  <p className="text-xs text-slate-400">
                    Acesse links, realize testes ou altere os destinos em tempo real
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('qrcodes')}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Ver Todos ({qrcodes.length}) →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qrcodes.slice(0, 4).map((qr) => (
                  <div
                    key={qr.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center gap-4 hover:border-slate-600 transition-all"
                  >
                    <QRThumbnail qr={qr} size={64} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{qr.name}</h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            qr.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {qr.status === 'active' ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{qr.destinationUrl}</span>
                      </p>

                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleCopyLink(qr.shortCode, qr.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === qr.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === qr.id ? 'Copiado' : 'Copiar Link'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingDestQR(qr);
                            setDestInput(qr.destinationUrl);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar Destino</span>
                        </button>

                        <button
                          onClick={() => handleSimulateScan(qr.id)}
                          title="Simular scan de teste"
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 text-emerald-400" />
                          <span>Testar</span>
                        </button>

                        <span className="text-[11px] text-slate-400 font-medium ml-auto">
                          {qr.scanCount || 0} scans
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Scan Audit Feed */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Últimas Leituras em Tempo Real</h3>
                  <p className="text-xs text-slate-400">Registros detalhados de interações com os seus QR Codes</p>
                </div>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Ver Métricas Completas →
                </button>
              </div>

              {(data?.recentScans || []).length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum scan registrado ainda. Realize uma leitura de teste para verificar!
                </div>
              ) : (
                <div className="divide-y divide-slate-700/60 overflow-hidden">
                  {(data?.recentScans || []).slice(0, 5).map((scan) => (
                    <div key={scan.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-700/60 flex items-center justify-center text-indigo-400 shrink-0">
                          {scan.device === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-white">{scan.qrCodeName}</p>
                          <p className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            <span>{scan.city ? `${scan.city}, ${scan.country}` : scan.country || 'Japão'}</span>
                            <span>•</span>
                            <span>{scan.browser} ({scan.os})</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-slate-300 font-mono text-[11px] block">
                          {new Date(scan.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(scan.timestamp).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: MEUS QR CODES
        ======================================================== */}
        {activeTab === 'qrcodes' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Search */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Catálogo de QR Codes</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie o destino dos seus links dinâmicos e baixe em alta resolução para impressão
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar QR Code por nome..."
                  value={searchQR}
                  onChange={(e) => setSearchQR(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Grid of QR Codes */}
            {filteredQRCodes.length === 0 ? (
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                <QrCode className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-white">Nenhum QR Code encontrado</p>
                <p className="text-xs text-slate-400">Verifique os filtros ou entre em contato com o administrador.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredQRCodes.map((qr) => (
                  <div
                    key={qr.id}
                    className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-600 transition-all space-y-4"
                  >
                    <div>
                      {/* Top info and status badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                            {qr.type}
                          </span>
                          <h3 className="text-base font-bold text-white leading-snug mt-0.5">{qr.name}</h3>
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                            qr.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {qr.status === 'active' ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>

                      {/* QR Thumbnail Preview */}
                      <div className="flex justify-center py-2">
                        <QRThumbnail qr={qr} size={150} />
                      </div>

                      {/* Destination URL & Short Link details */}
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50 space-y-1">
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span>Destino Atual:</span>
                            <button
                              onClick={() => {
                                setEditingDestQR(qr);
                                setDestInput(qr.destinationUrl);
                              }}
                              className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Alterar</span>
                            </button>
                          </div>
                          <a
                            href={qr.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-slate-200 hover:text-white truncate block flex items-center gap-1"
                          >
                            <span className="truncate">{qr.destinationUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                          </a>
                        </div>

                        {/* Short Link */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                          <span>Link Curto: /r/{qr.shortCode}</span>
                          <button
                            onClick={() => handleCopyLink(qr.shortCode, qr.id)}
                            className="text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === qr.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === qr.id ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stats bar */}
                    <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total de Scans</span>
                        <span className="text-base font-bold text-emerald-400">{qr.scanCount || 0}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSimulateScan(qr.id)}
                          title="Simular leitura de teste"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Testar</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onOpenDownloadQR) {
                              onOpenDownloadQR(qr);
                            } else {
                              showToast('Modal de download do QR Code.');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors inline-flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: MÉTRICAS & SCANS
        ======================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter Bar */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Relatório de Métricas & Analytics</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Análise detalhada de comportamento, dias, aparelhos e cidades dos clientes que escanearam seus QR Codes
                </p>
              </div>

              {/* QR Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">Filtrar QR:</label>
                <select
                  value={selectedQRIdForMetrics}
                  onChange={(e) => setSelectedQRIdForMetrics(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 w-full sm:w-60"
                >
                  <option value="all">Todos os meus QR Codes ({qrcodes.length})</option>
                  {qrcodes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name} ({q.scanCount || 0} scans)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Leituras Selecionadas</span>
                <span className="text-2xl font-bold text-indigo-400">{currentTotalScans}</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Últimas 24 Horas</span>
                <span className="text-2xl font-bold text-amber-400">{stats.scansLast24h}</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Últimos 7 Dias</span>
                <span className="text-2xl font-bold text-violet-400">{stats.scansLast7d}</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Últimos 30 Dias</span>
                <span className="text-2xl font-bold text-emerald-400">{stats.scansLast30d}</span>
              </div>
            </div>

            {/* Evolution Chart */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-white">Histórico Diário de Leituras</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.dailyScans || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="scans" name="Leituras" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Breakdown Cards: Cities, Devices, Operating Systems, Peak Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Cities */}
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Cidades & Regiões Mais Ativas</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">Onde seus clientes estão escaneando</p>

                <div className="space-y-3">
                  {(data?.citiesData || []).length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum dado geográfico ainda.</p>
                  ) : (
                    (data?.citiesData || []).map((city, idx) => {
                      const total = (data?.citiesData || []).reduce((acc, c) => acc + c.value, 0) || 1;
                      const pct = Math.round((city.value / total) * 100);

                      return (
                        <div key={city.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-200">{city.name}</span>
                            <span className="font-bold text-white">
                              {city.value} <span className="text-slate-400 text-[11px]">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Peak Hours Breakdown */}
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Horários com Maior Fluxo de Leituras</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">Horas do dia em que ocorrem mais leituras</p>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(data?.peakHoursData || []).filter((h, idx) => idx % 2 === 0)}
                      margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="#334155" vertical={false} />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          color: '#f8fafc',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="scans" name="Leituras" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Scans History Table */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Registro de Leituras Recentes</h3>
                  <p className="text-xs text-slate-400">Auditoria individual dos acessos efetuados</p>
                </div>
              </div>

              {currentScansList.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Nenhum scan registrado para esta seleção.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Data & Hora</th>
                        <th className="py-2.5 px-3">QR Code</th>
                        <th className="py-2.5 px-3">Localização</th>
                        <th className="py-2.5 px-3">Dispositivo</th>
                        <th className="py-2.5 px-3">Navegador</th>
                        <th className="py-2.5 px-3 text-right">Origem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {currentScansList.slice(0, 15).map((scan) => (
                        <tr key={scan.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-300">
                            {new Date(scan.timestamp).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-3 px-3 font-bold text-white">{scan.qrCodeName}</td>
                          <td className="py-3 px-3 text-slate-300">
                            {scan.city ? `${scan.city}, ${scan.country}` : scan.country || 'Japão'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-200">
                              {scan.device} ({scan.os})
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400">{scan.browser}</td>
                          <td className="py-3 px-3 text-right text-slate-400 text-[11px] truncate max-w-[140px]">
                            {scan.referrer || 'Câmera Nativa'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: MEUS DADOS CADASTRAIS
        ======================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top bar with Edit Mode Toggle */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Dados Cadastrais da Empresa</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Informações de contato, endereço fiscal no Japão e credenciais de acesso
                </p>
              </div>

              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Meus Dados</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <span>Cancelar Edição</span>
                </button>
              )}
            </div>

            {/* Profile Form / View */}
            {!isEditingProfile ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details Card */}
                <div className="lg:col-span-2 bg-slate-800/70 border border-slate-700/70 rounded-2xl p-6 shadow-xs space-y-6">
                  {/* Company & Contact Person */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-700/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Razão Social / Nome do Estabelecimento
                      </span>
                      <p className="text-base font-bold text-white">{client?.name}</p>
                      {client?.companyName && (
                        <p className="text-xs text-slate-400 mt-0.5">{client.companyName}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Pessoa de Contato / Responsável
                      </span>
                      <p className="text-base font-bold text-white">{client?.contactPerson}</p>
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-700/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        E-mail de Notificações
                      </span>
                      <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-indigo-400" />
                        <span>{client?.email}</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Telefone de Contato / WhatsApp
                      </span>
                      <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span>{client?.phone || 'Não informado'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Japanese Formatted Address */}
                  <div className="space-y-3 pb-6 border-b border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Endereço Cadastrado (Padrão Japonês - 日本の住所)
                      </span>
                      {fullAddress && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyAddress(fullAddress)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedAddress ? 'Copiado!' : 'Copiar'}</span>
                          </button>

                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-slate-200 font-semibold inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Google Maps</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-200 space-y-1.5 font-sans">
                      {client?.postalCode && (
                        <p className="font-mono text-indigo-300 font-semibold">
                          〒{formatJapanesePostalCode(client.postalCode)}
                        </p>
                      )}
                      <p className="text-sm font-bold text-white">
                        {client?.prefecture} {client?.city} {client?.address}
                      </p>
                      {client?.building && <p className="text-slate-300">{client.building}</p>}
                      <p className="text-slate-500 text-[11px] pt-1">{client?.country || 'Japão'}</p>
                    </div>
                  </div>

                  {/* Notes / Services */}
                  {client?.notes && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Observações & Plano Contratado
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                        {client.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Side Card: Security & Support */}
                <div className="space-y-6">
                  {/* Security & Access Box */}
                  <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <KeyRound className="w-4 h-4" />
                      <h4 className="text-sm font-bold text-white">Acesso & Segurança</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Seu acesso a esta área é protegido. Você pode definir ou atualizar sua senha de acesso a qualquer momento clicando em <strong>Editar Meus Dados</strong>.
                    </p>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs space-y-1">
                      <p className="text-slate-400 text-[11px]">E-mail de Login:</p>
                      <p className="font-mono text-white font-semibold">{client?.email}</p>
                    </div>
                  </div>

                  {/* Support Box */}
                  <div className="bg-gradient-to-br from-indigo-900/30 to-violet-900/20 border border-indigo-500/30 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-indigo-300">
                      <HelpCircle className="w-4 h-4" />
                      <h4 className="text-sm font-bold text-white">Suporte Técnico</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Precisa de novos QR Codes impressos, totens, adesivos ou suporte técnico para suas campanhas?
                    </p>
                    <div className="text-xs space-y-1 text-slate-400">
                      <p>E-mail: <span className="text-white">suporte@qrdynamic.com</span></p>
                      <p>Horário: <span className="text-white">Seg a Sex, 09h às 18h</span></p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Profile Edit Form */
              <form onSubmit={handleSaveProfile} className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-6 shadow-xs space-y-6">
                <h3 className="text-base font-bold text-white pb-3 border-b border-slate-700">
                  Editar Informações Cadastrais
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Pessoa de Contato / Responsável
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.contactPerson}
                      onChange={(e) => setProfileForm({ ...profileForm, contactPerson: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Telefone / Celular
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+81 3-1234-5678"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Japanese Address Fields */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Endereço no Japão (日本の住所)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Código Postal (〒 郵便番号)
                      </label>
                      <input
                        type="text"
                        placeholder="150-0001"
                        value={profileForm.postalCode}
                        onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Província (都道府県)
                      </label>
                      <input
                        type="text"
                        placeholder="Tóquio / 東京都"
                        value={profileForm.prefecture}
                        onChange={(e) => setProfileForm({ ...profileForm, prefecture: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Cidade / Distrito (市区町村)
                      </label>
                      <input
                        type="text"
                        placeholder="Shibuya-ku / 渋谷区"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Bairro e Número (丁目・番地・号)
                      </label>
                      <input
                        type="text"
                        placeholder="Jingumae 5-7-22"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Edifício e Sala (建物名・部屋番号)
                      </label>
                      <input
                        type="text"
                        placeholder="Edifício Central 3F"
                        value={profileForm.building}
                        onChange={(e) => setProfileForm({ ...profileForm, building: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Password / Access PIN */}
                <div className="pt-2 border-t border-slate-700/60">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Nova Senha / PIN de Acesso ao Portal (opcional)
                    </label>
                    {client?.password ? (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        ✓ Senha personalizada ativa
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Senha padrão: cliente123
                      </span>
                    )}
                  </div>
                  <div className="relative w-full sm:w-80">
                    <input
                      type={showProfilePassword ? 'text' : 'password'}
                      placeholder="Deixe em branco para manter a senha atual"
                      value={profileForm.password}
                      onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePassword(!showProfilePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                      title={showProfilePassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Utilize no mínimo 4 caracteres. Ao alterar, use essa nova senha na tela de login.
                  </p>
                </div>

                {/* Save Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Salvando Alterações...' : 'Salvar Alterações'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Inline Quick Destination Edit Modal */}
      {editingDestQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Alterar Destino Dinâmico</h3>
                  <p className="text-xs text-slate-400">{editingDestQR.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDestQR(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDestination} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nova URL de Destino (Link para onde o cliente será redirecionado):
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://seusite.com.br/novo-cardapio"
                  value={destInput}
                  onChange={(e) => setDestInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                ✨ <strong>Zero Reimpressão:</strong> A alteração é instantânea. Todos os QR codes já impressos ou distribuídos passarão a abrir este novo endereço imediatamente!
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDestQR(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingDest}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingDest ? 'Atualizando...' : 'Confirmar e Atualizar Destino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
