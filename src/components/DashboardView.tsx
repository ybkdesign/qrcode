import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  QrCode,
  CheckCircle2,
  XCircle,
  Eye,
  TrendingUp,
  Clock,
  Smartphone,
  Calendar,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  PlusCircle,
  Trash2,
  RotateCcw,
  Filter,
  X,
  Check,
  BarChart3,
  PieChart as PieIcon,
  MapPin,
  Laptop,
  Tablet as TabletIcon,
  Database,
  ArrowDownUp,
  Percent,
  Calculator,
  RefreshCw,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import type { QRCodeItem, Client } from '../types';
import { api } from '../api';

interface DashboardViewProps {
  overviewData?: any;
  stats?: any;
  qrcodes?: QRCodeItem[];
  clients?: Client[];
  isLoading?: boolean;
  onNavigate: (view: any) => void;
  onSelectQRCode?: (qr: QRCodeItem) => void;
  onSelectQR?: (qr: QRCodeItem) => void;
  onSelectClient?: (client: Client) => void;
  onOpenNewQR?: () => void;
  onOpenNewClient?: () => void;
  onReloadData?: () => Promise<void>;
  onResetAnalytics?: (qrCodeId?: string) => Promise<void>;
}

const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

// Definição de todos os widgets e seções configuráveis do Dashboard
const DEFAULT_VISIBLE_WIDGETS = [
  'stat_clients',
  'stat_qrcodes',
  'stat_total_scans',
  'stat_scans_24h',
  'stat_scans_7d',
  'stat_scans_30d',
  'stat_active_qr',
  'stat_inactive_qr',
  'stat_active_rate',
  'stat_avg_scans',
  'section_scans_chart',
  'section_devices_chart',
  'section_peak_hours',
  'section_top_qrcodes',
  'section_top_clients',
  'section_top_cities',
];

const WIDGET_LABELS: Record<string, { label: string; category: 'metric' | 'section'; desc: string }> = {
  stat_clients: { label: 'Total de Clientes', category: 'metric', desc: 'Contagem de empresas e clientes cadastrados' },
  stat_qrcodes: { label: 'Total de QR Codes', category: 'metric', desc: 'Total geral de códigos no sistema' },
  stat_total_scans: { label: 'Total de Scans', category: 'metric', desc: 'Total acumulado de leituras em tempo real' },
  stat_scans_24h: { label: 'Scans Últimas 24h', category: 'metric', desc: 'Acessos registrados no dia corrente' },
  stat_scans_7d: { label: 'Scans Últimos 7 dias', category: 'metric', desc: 'Volume de acessos na semana recente' },
  stat_scans_30d: { label: 'Scans Últimos 30 dias', category: 'metric', desc: 'Volume de acessos no mês recente' },
  stat_active_qr: { label: 'QR Codes Ativos', category: 'metric', desc: 'Códigos redirecionando com sucesso' },
  stat_inactive_qr: { label: 'QR Codes Pausados', category: 'metric', desc: 'Códigos em manutenção ou rascunho' },
  stat_active_rate: { label: 'Taxa de Ativação', category: 'metric', desc: 'Percentual de códigos em funcionamento' },
  stat_avg_scans: { label: 'Média Scans / QR', category: 'metric', desc: 'Média de leituras por código' },
  section_scans_chart: { label: 'Gráfico: Evolução dos Scans', category: 'section', desc: 'Histórico diário dos últimos 14 dias' },
  section_devices_chart: { label: 'Gráfico: Dispositivos Utilizados', category: 'section', desc: 'Divisão Mobile, Desktop e Tablet' },
  section_peak_hours: { label: 'Gráfico: Picos de Horário', category: 'section', desc: 'Horários com maior concentração de scans' },
  section_top_qrcodes: { label: 'Lista: QR Codes Mais Acessados', category: 'section', desc: 'Ranking dos 5 códigos mais lidos' },
  section_top_clients: { label: 'Lista: Clientes Mais Ativos', category: 'section', desc: 'Ranking dos 5 clientes com mais acessos' },
  section_top_cities: { label: 'Lista: Principais Cidades', category: 'section', desc: 'Localizações geográficas com mais leituras' },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  overviewData,
  stats: altStats,
  qrcodes = [],
  clients = [],
  isLoading = false,
  onNavigate,
  onSelectQRCode,
  onSelectQR,
  onSelectClient,
  onOpenNewQR,
  onOpenNewClient,
  onReloadData,
  onResetAnalytics,
}) => {
  // 1. Estado de Personalização (Widgets Visíveis / Inserir e Retirar do Painel)
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('qr_dashboard_visible_widgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar preferências de widgets:', e);
    }
    return DEFAULT_VISIBLE_WIDGETS;
  });

  // Modais de Controle de Dados
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isInsertDataModalOpen, setIsInsertDataModalOpen] = useState(false);
  const [isRemoveDataModalOpen, setIsRemoveDataModalOpen] = useState(false);

  // Filtros em tempo real no Dashboard
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | '24h' | '7d' | '30d'>('all');

  // Estados de formulário de Inserção de Dados
  const [insertForm, setInsertForm] = useState({
    qrCodeId: '',
    count: 10,
    device: 'Mobile' as 'Mobile' | 'Desktop' | 'Tablet',
    os: 'iOS',
    browser: 'Safari Mobile',
    city: 'Tóquio',
    country: 'Japão',
    distribution: 'now', // 'now', 'today', 'week'
  });
  const [isInserting, setIsInserting] = useState(false);
  const [insertSuccessMsg, setInsertSuccessMsg] = useState('');

  // Estados de formulário de Retirada de Dados
  const [removeForm, setRemoveForm] = useState({
    mode: 'recent' as 'recent' | 'single_qr' | 'period' | 'all',
    count: 10,
    qrCodeId: '',
    period: '24h' as '24h' | '7d' | '30d' | 'all',
  });
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeSuccessMsg, setRemoveSuccessMsg] = useState('');

  // Atualizar QR Code padrão no formulário de inserção quando qrcodes carregarem
  useEffect(() => {
    if (qrcodes.length > 0 && !insertForm.qrCodeId) {
      setInsertForm((prev) => ({ ...prev, qrCodeId: qrcodes[0].id }));
    }
    if (qrcodes.length > 0 && !removeForm.qrCodeId) {
      setRemoveForm((prev) => ({ ...prev, qrCodeId: qrcodes[0].id }));
    }
  }, [qrcodes]);

  // Persistir visibleWidgets no localStorage
  const updateVisibleWidgets = (newWidgets: string[]) => {
    setVisibleWidgets(newWidgets);
    try {
      localStorage.setItem('qr_dashboard_visible_widgets', JSON.stringify(newWidgets));
    } catch (e) {
      console.warn('Erro ao salvar preferências de widgets:', e);
    }
  };

  const toggleWidget = (widgetId: string) => {
    if (visibleWidgets.includes(widgetId)) {
      updateVisibleWidgets(visibleWidgets.filter((w) => w !== widgetId));
    } else {
      updateVisibleWidgets([...visibleWidgets, widgetId]);
    }
  };

  const removeWidget = (widgetId: string) => {
    updateVisibleWidgets(visibleWidgets.filter((w) => w !== widgetId));
  };

  const restoreDefaultWidgets = () => {
    updateVisibleWidgets(DEFAULT_VISIBLE_WIDGETS);
  };

  const insertAllWidgets = () => {
    updateVisibleWidgets(Object.keys(WIDGET_LABELS));
  };

  const removeAllWidgets = () => {
    updateVisibleWidgets([]);
  };

  // Dados consolidados do backend
  const data = overviewData || altStats;

  // Filtragem de dados quando filtro de cliente ou período estiver ativo
  const filteredData = useMemo(() => {
    if (!data) return null;
    let { stats, dailyScans, topQRCodes, topClients, devicesData, peakHoursData, citiesData } = data;

    // Se houver filtro por cliente
    if (filterClientId !== 'all') {
      const clientQRs = qrcodes.filter((q) => q.clientId === filterClientId);
      const clientQRIds = new Set(clientQRs.map((q) => q.id));
      const clientTotalScans = clientQRs.reduce((acc, q) => acc + (q.scanCount || 0), 0);
      const clientActiveQRs = clientQRs.filter((q) => q.status === 'active').length;

      stats = {
        ...stats,
        totalClients: 1,
        totalQRCodes: clientQRs.length,
        activeQRCodes: clientActiveQRs,
        inactiveQRCodes: clientQRs.length - clientActiveQRs,
        totalScans: clientTotalScans,
        scansLast24h: Math.round(clientTotalScans * 0.15),
        scansLast7d: Math.round(clientTotalScans * 0.45),
        scansLast30d: clientTotalScans,
      };

      topQRCodes = clientQRs
        .sort((a, b) => (b.scanCount || 0) - (a.scanCount || 0))
        .slice(0, 5)
        .map((q) => ({
          id: q.id,
          name: q.name,
          clientName: q.clientName,
          type: q.type,
          scans: q.scanCount,
          status: q.status,
        }));

      const activeClient = clients.find((c) => c.id === filterClientId);
      if (activeClient) {
        topClients = [
          {
            id: activeClient.id,
            name: activeClient.name,
            scans: clientTotalScans,
            qrCount: clientQRs.length,
          },
        ];
      }
    }

    return {
      stats: stats || {
        totalClients: clients.length,
        totalQRCodes: qrcodes.length,
        activeQRCodes: qrcodes.filter((q) => q.status === 'active').length,
        inactiveQRCodes: qrcodes.filter((q) => q.status === 'inactive').length,
        totalScans: qrcodes.reduce((a, b) => a + (b.scanCount || 0), 0),
        scansLast24h: 0,
        scansLast7d: 0,
        scansLast30d: 0,
      },
      dailyScans: dailyScans || [],
      topQRCodes: topQRCodes || [],
      topClients: topClients || [],
      devicesData: devicesData || [
        { name: 'Mobile', value: 78 },
        { name: 'Desktop', value: 16 },
        { name: 'Tablet', value: 6 },
      ],
      peakHoursData: peakHoursData || [],
      citiesData: citiesData || [
        { name: 'Tóquio', value: 85 },
        { name: 'Yokohama', value: 42 },
        { name: 'Oizumi (Gunma)', value: 31 },
        { name: 'Osaka', value: 24 },
        { name: 'São Paulo', value: 18 },
      ],
    };
  }, [data, filterClientId, qrcodes, clients]);

  // Ação: Inserir Dados no Dashboard (Scans manuais / simulados)
  const handleExecuteInsertData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insertForm.qrCodeId) return;

    try {
      setIsInserting(true);
      setInsertSuccessMsg('');

      let timestamp: string | undefined = undefined;
      if (insertForm.distribution === 'today') {
        timestamp = new Date(Date.now() - Math.floor(Math.random() * 12 * 3600 * 1000)).toISOString();
      } else if (insertForm.distribution === 'week') {
        timestamp = new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 3600 * 1000)).toISOString();
      }

      const res = await api.insertManualScans({
        qrCodeId: insertForm.qrCodeId,
        count: Number(insertForm.count) || 1,
        device: insertForm.device,
        os: insertForm.os,
        browser: insertForm.browser,
        city: insertForm.city,
        country: insertForm.country,
        timestamp,
      });

      setInsertSuccessMsg(res.message);
      if (onReloadData) {
        await onReloadData();
      }

      setTimeout(() => {
        setIsInsertDataModalOpen(false);
        setInsertSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Erro ao inserir dados no Dashboard.');
    } finally {
      setIsInserting(false);
    }
  };

  // Ação: Retirar Dados do Dashboard (Limpeza, Reset ou remoção em lote)
  const handleExecuteRemoveData = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsRemoving(true);
      setRemoveSuccessMsg('');

      if (removeForm.mode === 'all') {
        if (onResetAnalytics) {
          await onResetAnalytics();
        } else {
          await api.resetAnalytics();
        }
        setRemoveSuccessMsg('Todos os dados de análise foram retirados do sistema com sucesso.');
      } else if (removeForm.mode === 'single_qr') {
        if (!removeForm.qrCodeId) return;
        if (onResetAnalytics) {
          await onResetAnalytics(removeForm.qrCodeId);
        } else {
          await api.resetAnalytics(removeForm.qrCodeId);
        }
        setRemoveSuccessMsg('Dados do QR Code selecionado foram retirados com sucesso.');
      } else if (removeForm.mode === 'period') {
        const res = await api.deleteScansBatch({
          period: removeForm.period,
        });
        setRemoveSuccessMsg(res.message);
      } else if (removeForm.mode === 'recent') {
        const res = await api.deleteScansBatch({
          count: Number(removeForm.count) || 10,
        });
        setRemoveSuccessMsg(res.message);
      }

      if (onReloadData) {
        await onReloadData();
      }

      setTimeout(() => {
        setIsRemoveDataModalOpen(false);
        setRemoveSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Erro ao retirar dados do Dashboard.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading || !filteredData) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const { stats, dailyScans, topQRCodes, topClients, devicesData, peakHoursData, citiesData } = filteredData;

  // Cálculo de Métricas Adicionais
  const activeRate = stats.totalQRCodes > 0
    ? Math.round((stats.activeQRCodes / stats.totalQRCodes) * 100)
    : 100;

  const avgScans = stats.totalQRCodes > 0
    ? (stats.totalScans / stats.totalQRCodes).toFixed(1)
    : '0';

  // Configuração de todos os cartões de métrica
  const allStatCards = [
    {
      id: 'stat_clients',
      title: 'Total de Clientes',
      value: stats.totalClients,
      subtitle: 'Empresas cadastradas',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      onClick: () => onNavigate('clients'),
    },
    {
      id: 'stat_qrcodes',
      title: 'Total de QR Codes',
      value: stats.totalQRCodes,
      subtitle: `${stats.activeQRCodes} ativos • ${stats.inactiveQRCodes} inativos`,
      icon: QrCode,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      onClick: () => onNavigate('qrcodes'),
    },
    {
      id: 'stat_total_scans',
      title: 'Total de Scans',
      value: (stats.totalScans || 0).toLocaleString('pt-BR'),
      subtitle: 'Acessos acumulados',
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      onClick: () => onNavigate('analytics'),
    },
    {
      id: 'stat_scans_24h',
      title: 'Scans Últimas 24h',
      value: (stats.scansLast24h || 0).toLocaleString('pt-BR'),
      subtitle: 'Volume hoje',
      icon: Clock,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      onClick: () => onNavigate('analytics'),
    },
    {
      id: 'stat_scans_7d',
      title: 'Scans Últimos 7 dias',
      value: (stats.scansLast7d || 0).toLocaleString('pt-BR'),
      subtitle: 'Semana recente',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      onClick: () => onNavigate('analytics'),
    },
    {
      id: 'stat_scans_30d',
      title: 'Scans Últimos 30 dias',
      value: (stats.scansLast30d || 0).toLocaleString('pt-BR'),
      subtitle: 'Mês corrente',
      icon: Calendar,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      onClick: () => onNavigate('analytics'),
    },
    {
      id: 'stat_active_qr',
      title: 'QR Codes Ativos',
      value: stats.activeQRCodes,
      subtitle: 'Redirecionando em tempo real',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      onClick: () => onNavigate('qrcodes'),
    },
    {
      id: 'stat_inactive_qr',
      title: 'QR Codes Pausados',
      value: stats.inactiveQRCodes,
      subtitle: 'Em manutenção ou rascunho',
      icon: XCircle,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      onClick: () => onNavigate('qrcodes'),
    },
    {
      id: 'stat_active_rate',
      title: 'Taxa de Ativação',
      value: `${activeRate}%`,
      subtitle: 'Taxa de disponibilidade',
      icon: Percent,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      onClick: () => onNavigate('qrcodes'),
    },
    {
      id: 'stat_avg_scans',
      title: 'Média de Scans / QR',
      value: avgScans,
      subtitle: 'Engajamento por código',
      icon: Calculator,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      onClick: () => onNavigate('analytics'),
    },
  ];

  // Filtrar apenas os cards visíveis configurados pelo usuário
  const visibleStatCards = allStatCards.filter((card) => visibleWidgets.includes(card.id));
  const hiddenCount = allStatCards.length - visibleStatCards.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Barra Superior de Gestão de Dados & Personalização */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Lado Esquerdo: Filtros em Tempo Real */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Filtro:</span>
          </div>

          {/* Filtro por Cliente */}
          <select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            className="flex-1 sm:flex-none text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer max-w-full"
          >
            <option value="all">🏢 Todos os Clientes ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Indicador de Filtro Ativo com botão para retirar filtro */}
          {filterClientId !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterClientId('all')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
              title="Retirar filtro de cliente e voltar a ver todos os dados"
            >
              <span>Limpar</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Lado Direito: Botões para Inserir Dados, Retirar Dados e Personalizar Indicadores */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {/* Botão: Inserir Dados */}
          <button
            type="button"
            onClick={() => setIsInsertDataModalOpen(true)}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Inserir acessos e dados no dashboard"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Inserir Dados</span>
            <span className="sm:hidden">Inserir</span>
          </button>

          {/* Botão: Retirar Dados */}
          <button
            type="button"
            onClick={() => setIsRemoveDataModalOpen(true)}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Retirar ou zerar dados de análise do dashboard"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="hidden sm:inline">Retirar Dados</span>
            <span className="sm:hidden">Zerar</span>
          </button>

          {/* Botão: Personalizar Indicadores */}
          <button
            type="button"
            onClick={() => setIsCustomizeModalOpen(true)}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer active:scale-95"
            title="Inserir e retirar métricas e gráficos visíveis no painel"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="hidden sm:inline">Personalizar</span>
            <span className="sm:hidden">Ajustar</span>
            <span className="ml-0.5 px-1 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] leading-tight">
              {visibleStatCards.length}
            </span>
          </button>
        </div>
      </div>

      {/* Banner de Aviso de Indicadores Retirados da Tela */}
      {hiddenCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{hiddenCount}</strong> {hiddenCount === 1 ? 'indicador foi retirado' : 'indicadores foram retirados'} da exibição deste painel.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restoreDefaultWidgets}
              className="text-xs font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
            >
              Reinserir Todos
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsCustomizeModalOpen(true)}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
            >
              Personalizar
            </button>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Painel Geral Operacional
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Gerenciamento de QR Codes Dinâmicos
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Monitore acessos, atualize URLs de destino instantaneamente sem gerar novos impressos e gerencie sua carteira de clientes com relatórios consolidados.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 relative z-10 flex-wrap w-full sm:w-auto">
          <button
            onClick={onOpenNewQR}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-500/30 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Criar QR Code</span>
          </button>
          <button
            onClick={onOpenNewClient}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all border border-white/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid (com opção de retirar no hover) */}
      {visibleStatCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {visibleStatCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                id={`stat-card-${card.id}`}
                className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all cursor-pointer group relative"
              >
                {/* Botão sutil para retirar indicador do dashboard diretamente no cartão */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWidget(card.id);
                  }}
                  className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Retirar este indicador do dashboard"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div onClick={card.onClick}>
                  <div className="flex items-center justify-between mb-2 sm:mb-3 pr-2 sm:pr-4">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors line-clamp-1 leading-snug">
                      {card.title}
                    </span>
                    <div className={`p-1.5 sm:p-2 rounded-xl ${card.bg} ${card.color} shrink-0`}>
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
                      {card.value}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{card.subtitle}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Seção 1 de Gráficos: Evolução dos Scans & Dispositivos */}
      {(visibleWidgets.includes('section_scans_chart') || visibleWidgets.includes('section_devices_chart')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scans Evolution (2 Cols) */}
          {visibleWidgets.includes('section_scans_chart') && (
            <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 relative group ${
              visibleWidgets.includes('section_devices_chart') ? 'lg:col-span-2' : 'lg:col-span-3'
            }`}>
              <button
                type="button"
                onClick={() => removeWidget('section_scans_chart')}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Retirar este gráfico do dashboard"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Evolução dos Scans</h3>
                  <p className="text-xs text-slate-500">Histórico de acessos diários nos últimos 14 dias</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold self-start sm:self-auto">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Tempo Real
                </span>
              </div>

              <div className="h-64 sm:h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyScans} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="scans"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scanGradient)"
                      name="Scans"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Devices Distribution (1 Col) */}
          {visibleWidgets.includes('section_devices_chart') && (
            <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 relative group ${
              visibleWidgets.includes('section_scans_chart') ? 'lg:col-span-1' : 'lg:col-span-3'
            }`}>
              <button
                type="button"
                onClick={() => removeWidget('section_devices_chart')}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Retirar este gráfico do dashboard"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pr-6">
                <h3 className="text-base font-bold text-slate-900">Dispositivos Utilizados</h3>
                <p className="text-xs text-slate-500">Distribuição dos leitores</p>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devicesData}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {devicesData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                {devicesData.map((item: any, idx: number) => (
                  <div key={item.name} className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-xs text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seção 2 de Gráficos: Picos de Horário & Cidades */}
      {(visibleWidgets.includes('section_peak_hours') || visibleWidgets.includes('section_top_cities')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Picos de Horário */}
          {visibleWidgets.includes('section_peak_hours') && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 relative group">
              <button
                type="button"
                onClick={() => removeWidget('section_peak_hours')}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Retirar este gráfico do dashboard"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="pr-6">
                <h3 className="text-base font-bold text-slate-900">Picos de Horário</h3>
                <p className="text-xs text-slate-500">Concentração de leituras ao longo do dia</p>
              </div>
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData.length > 0 ? peakHoursData : [
                    { hour: '08h', scans: 14 },
                    { hour: '10h', scans: 35 },
                    { hour: '12h', scans: 62 },
                    { hour: '14h', scans: 48 },
                    { hour: '16h', scans: 55 },
                    { hour: '18h', scans: 88 },
                    { hour: '20h', scans: 74 },
                    { hour: '22h', scans: 39 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="scans" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Acessos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cidades e Localizações */}
          {visibleWidgets.includes('section_top_cities') && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 relative group">
              <button
                type="button"
                onClick={() => removeWidget('section_top_cities')}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Retirar esta lista do dashboard"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="pr-6">
                <h3 className="text-base font-bold text-slate-900">Principais Cidades & Regiões</h3>
                <p className="text-xs text-slate-500">Origem geográfica dos usuários que escanearam</p>
              </div>
              <div className="space-y-3 pt-1">
                {citiesData.slice(0, 5).map((city: any, idx: number) => {
                  const maxCity = Math.max(...citiesData.map((c: any) => c.value), 1);
                  const pct = Math.round((city.value / maxCity) * 100);
                  return (
                    <div key={city.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                          {city.name}
                        </span>
                        <span className="font-bold text-slate-900">{city.value} scans</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top QR Codes & Top Clients Row */}
      {(visibleWidgets.includes('section_top_qrcodes') || visibleWidgets.includes('section_top_clients')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top QR Codes */}
          {visibleWidgets.includes('section_top_qrcodes') && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 relative group">
              <button
                type="button"
                onClick={() => removeWidget('section_top_qrcodes')}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Retirar esta lista do dashboard"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pr-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">QR Codes Mais Acessados</h3>
                  <p className="text-xs text-slate-500">Códigos com maior volume de tráfego</p>
                </div>
                <button
                  onClick={() => onNavigate('qrcodes')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {topQRCodes.map((qr: any) => (
                  <div
                    key={qr.id}
                    onClick={() => {
                      if (onSelectQRCode) onSelectQRCode(qr);
                      else if (onSelectQR) onSelectQR(qr);
                    }}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-xs">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-900 truncate">{qr.name}</p>
                        <p className="text-xs text-slate-500 truncate">{qr.clientName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-bold text-indigo-600">{qr.scans}</span>
                        <span className="text-xs text-slate-400 block">scans</span>
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          qr.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Clients */}
          {visibleWidgets.includes('section_top_clients') && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 relative group">
              <button
                type="button"
                onClick={() => removeWidget('section_top_clients')}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Retirar esta lista do dashboard"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pr-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Clientes com Maior Utilização</h3>
                  <p className="text-xs text-slate-500">Empresas que mais geram tráfego</p>
                </div>
                <button
                  onClick={() => onNavigate('clients')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  Ver clientes <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {topClients.map((client: any) => (
                  <div
                    key={client.id}
                    onClick={() => {
                      if (onSelectClient) {
                        const fullClient = clients.find((c) => c.id === client.id);
                        if (fullClient) onSelectClient(fullClient);
                      } else {
                        onNavigate('clients');
                      }
                    }}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-900 truncate">{client.name}</p>
                        <p className="text-xs text-slate-500 truncate">{client.qrCount} QR Codes cadastrados</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900">{client.scans}</span>
                      <span className="text-xs text-slate-400 block">total scans</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PERSONALIZAR DASHBOARD (INSERIR E RETIRAR INDICADORES DA TELA) */}
      {/* ========================================================================= */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Cabeçalho */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personalizar Dashboard</h3>
                  <p className="text-xs text-slate-500">Insira ou retire indicadores e gráficos visíveis na tela</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com seleção de widgets */}
            <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Botões de Ação Rápida */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-100/80 text-xs">
                <span className="font-semibold text-slate-700">
                  {visibleWidgets.length} de {Object.keys(WIDGET_LABELS).length} itens visíveis
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={insertAllWidgets}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold shadow-2xs cursor-pointer"
                  >
                    Inserir Todos
                  </button>
                  <button
                    type="button"
                    onClick={removeAllWidgets}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-rose-600 font-bold shadow-2xs cursor-pointer"
                  >
                    Retirar Todos
                  </button>
                  <button
                    type="button"
                    onClick={restoreDefaultWidgets}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold shadow-2xs cursor-pointer"
                  >
                    Restaurar Padrão
                  </button>
                </div>
              </div>

              {/* Grupo: Cartões de Métricas */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Indicadores de Métricas (Cartões de Topo)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(WIDGET_LABELS)
                    .filter(([_, meta]) => meta.category === 'metric')
                    .map(([id, meta]) => {
                      const isVisible = visibleWidgets.includes(id);
                      return (
                        <div
                          key={id}
                          onClick={() => toggleWidget(id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isVisible
                              ? 'border-indigo-500 bg-indigo-50/40 text-slate-900'
                              : 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="truncate">
                            <p className="text-xs font-bold truncate">{meta.label}</p>
                            <p className="text-[11px] text-slate-500 truncate">{meta.desc}</p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {isVisible ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Grupo: Seções e Gráficos */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Gráficos e Listas do Dashboard</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(WIDGET_LABELS)
                    .filter(([_, meta]) => meta.category === 'section')
                    .map(([id, meta]) => {
                      const isVisible = visibleWidgets.includes(id);
                      return (
                        <div
                          key={id}
                          onClick={() => toggleWidget(id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isVisible
                              ? 'border-indigo-500 bg-indigo-50/40 text-slate-900'
                              : 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="truncate">
                            <p className="text-xs font-bold truncate">{meta.label}</p>
                            <p className="text-[11px] text-slate-500 truncate">{meta.desc}</p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {isVisible ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Concluir e Salvar Preferências
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INSERIR DADOS NO DASHBOARD (ADICIONAR ACESSOS / SCANS / REGISTROS) */}
      {/* ========================================================================= */}
      {isInsertDataModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Inserir Dados no Dashboard</h3>
                  <p className="text-xs text-slate-500">Adicione registros de scans e acessos para alimentar gráficos e métricas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInsertDataModalOpen(false)}
                disabled={isInserting}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteInsertData} className="p-6 space-y-4">
              {insertSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{insertSuccessMsg}</span>
                </div>
              )}

              {/* QR Code de Destino */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  QR Code para Inserir Dados *
                </label>
                <select
                  required
                  value={insertForm.qrCodeId}
                  onChange={(e) => setInsertForm({ ...insertForm, qrCodeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  {qrcodes.map((qr) => (
                    <option key={qr.id} value={qr.id}>
                      {qr.name} ({qr.clientName || 'Geral'}) - {qr.scanCount || 0} scans atuais
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantidade de Scans a Inserir */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Quantidade de Scans a Inserir
                  </label>
                  <span className="text-[11px] text-slate-400">Total a ser somado ao dashboard</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[1, 5, 25, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setInsertForm({ ...insertForm, count: val })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        insertForm.count === val
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      +{val} scans
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={insertForm.count}
                  onChange={(e) => setInsertForm({ ...insertForm, count: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden font-mono"
                  placeholder="Ou digite a quantidade"
                />
              </div>

              {/* Dispositivo e Sistema */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dispositivo</label>
                  <select
                    value={insertForm.device}
                    onChange={(e) => {
                      const dev = e.target.value as any;
                      setInsertForm({
                        ...insertForm,
                        device: dev,
                        os: dev === 'Mobile' ? 'iOS' : dev === 'Desktop' ? 'Windows' : 'iPadOS',
                        browser: dev === 'Mobile' ? 'Safari Mobile' : 'Chrome Desktop',
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
                  >
                    <option value="Mobile">📱 Smartphone</option>
                    <option value="Desktop">💻 Computador</option>
                    <option value="Tablet">📲 Tablet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cidade / Região</label>
                  <select
                    value={insertForm.city}
                    onChange={(e) => setInsertForm({ ...insertForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
                  >
                    <option value="Tóquio">Tóquio (Japão)</option>
                    <option value="Yokohama">Yokohama (Kanagawa)</option>
                    <option value="Oizumi-machi">Oizumi (Gunma)</option>
                    <option value="Osaka">Osaka (Kansai)</option>
                    <option value="Nagoya">Nagoya (Aichi)</option>
                    <option value="São Paulo">São Paulo (Brasil)</option>
                  </select>
                </div>
              </div>

              {/* Distribuição de Horário */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Distribuição de Data / Horário
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'now', label: 'Agora mesmo' },
                    { id: 'today', label: 'Ao longo de hoje' },
                    { id: 'week', label: 'Últimos 7 dias' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setInsertForm({ ...insertForm, distribution: item.id })}
                      className={`py-2 px-2 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        insertForm.distribution === item.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInsertDataModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 sm:bg-transparent rounded-xl sm:rounded-none text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isInserting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isInserting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Inserir Dados e Atualizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RETIRAR DADOS DO DASHBOARD (REMOVER SCANS, LIMPAR OU ZERAR) */}
      {/* ========================================================================= */}
      {isRemoveDataModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Retirar Dados do Dashboard</h3>
                  <p className="text-xs text-slate-500">Exclua acessos, limpe registros de teste ou zere métricas de leitura</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRemoveDataModalOpen(false)}
                disabled={isRemoving}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteRemoveData} className="p-6 space-y-4">
              {removeSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{removeSuccessMsg}</span>
                </div>
              )}

              {/* Opções de Escopo de Retirada */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Selecione o que deseja retirar:
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'recent',
                      title: 'Retirar últimos scans inseridos',
                      desc: 'Desfaz os scans mais recentes (ideal para limpar testes)',
                    },
                    {
                      id: 'single_qr',
                      title: 'Retirar scans de um QR Code específico',
                      desc: 'Zera as leituras apenas do QR Code que você selecionar',
                    },
                    {
                      id: 'period',
                      title: 'Retirar scans por período',
                      desc: 'Exclui leituras das últimas 24 horas ou 7 dias',
                    },
                    {
                      id: 'all',
                      title: 'Zerar todo o histórico de scans do sistema',
                      desc: 'Limpa todos os scans acumulados mantendo os cadastros intactos',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        removeForm.mode === opt.id
                          ? 'border-rose-500 bg-rose-50/40 text-slate-900 ring-2 ring-rose-500/10'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="remove_mode"
                        checked={removeForm.mode === opt.id}
                        onChange={() => setRemoveForm({ ...removeForm, mode: opt.id as any })}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <p className="text-xs font-bold">{opt.title}</p>
                        <p className="text-[11px] text-slate-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Opções dinâmicas conforme a seleção */}
              {removeForm.mode === 'recent' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantidade de scans recentes a retirar:
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[5, 10, 25, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRemoveForm({ ...removeForm, count: num })}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          removeForm.count === num
                            ? 'bg-rose-50 border-rose-500 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        -{num} scans
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {removeForm.mode === 'single_qr' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selecione o QR Code para zerar métricas:
                  </label>
                  <select
                    value={removeForm.qrCodeId}
                    onChange={(e) => setRemoveForm({ ...removeForm, qrCodeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-rose-500 outline-hidden cursor-pointer"
                  >
                    {qrcodes.map((qr) => (
                      <option key={qr.id} value={qr.id}>
                        {qr.name} ({qr.clientName || 'Geral'}) - {qr.scanCount || 0} scans
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {removeForm.mode === 'period' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selecione o período a retirar:
                  </label>
                  <select
                    value={removeForm.period}
                    onChange={(e) => setRemoveForm({ ...removeForm, period: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-rose-500 outline-hidden cursor-pointer"
                  >
                    <option value="24h">Últimas 24 horas</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                  </select>
                </div>
              )}

              {/* Ações */}
              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRemoveDataModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 sm:bg-transparent rounded-xl sm:rounded-none text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRemoving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRemoving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Confirmar e Retirar Dados</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
