import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Smartphone,
  Globe,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Filter,
  RefreshCw,
  Eye,
  MapPin,
  Laptop,
  Compass,
  RotateCcw,
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
import type { QRCodeItem, ScanRecord } from '../types';
import { api } from '../api';
import { ResetAnalyticsModal } from './ResetAnalyticsModal';

interface AnalyticsViewProps {
  qrcodes: QRCodeItem[];
  selectedQRId?: string;
  onSelectQR: (qr: QRCodeItem) => void;
  onTestScan: (id: string) => void;
  onResetAnalytics?: (qrCodeId?: string) => Promise<void>;
  userName?: string;
}

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  qrcodes,
  selectedQRId,
  onSelectQR,
  onTestScan,
  onResetAnalytics,
  userName,
}) => {
  const [currentQRId, setCurrentQRId] = useState<string>(selectedQRId || 'all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [scansList, setScansList] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Sync if prop changes
  useEffect(() => {
    if (selectedQRId) {
      setCurrentQRId(selectedQRId);
    }
  }, [selectedQRId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (currentQRId === 'all') {
        const [overview, scans] = await Promise.all([
          api.getOverviewAnalytics(),
          api.getScans(undefined, undefined, 40),
        ]);
        setAnalyticsData(overview);
        setScansList(scans);
      } else {
        const [qrAnalytics, scans] = await Promise.all([
          api.getQRCodeAnalytics(currentQRId),
          api.getScans(currentQRId, undefined, 40),
        ]);
        setAnalyticsData(qrAnalytics);
        setScansList(scans);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentQRId]);

  const handleConfirmReset = async (qrCodeId?: string) => {
    if (onResetAnalytics) {
      await onResetAnalytics(qrCodeId);
    } else {
      await api.resetAnalytics(qrCodeId, userName);
    }
    await loadData();
  };

  const currentQR = qrcodes.find((q) => q.id === currentQRId);

  // Normalize data depending on all vs specific
  const dailyData = currentQRId === 'all' ? analyticsData?.dailyScans || [] : analyticsData?.dailyScans || [];
  const devicesData = currentQRId === 'all' ? analyticsData?.devicesData || [] : analyticsData?.devices || [];
  const osData = currentQRId === 'all' ? analyticsData?.osData || [] : analyticsData?.operatingSystems || [];
  const browsersData = currentQRId === 'all' ? analyticsData?.browsersData || [] : analyticsData?.browsers || [];
  const peakHours = currentQRId === 'all' ? analyticsData?.peakHoursData || [] : analyticsData?.peakHours || [];
  const citiesData = currentQRId === 'all' ? analyticsData?.citiesData || [] : analyticsData?.cities || [];
  const totalScans = currentQRId === 'all'
    ? analyticsData?.stats?.totalScans || 0
    : analyticsData?.totalScans || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Estatísticas & Analytics de Scans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Métricas detalhadas de leituras, dispositivos, navegadores, cidades e horários de pico.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* QR Code Selector */}
          <select
            value={currentQRId}
            onChange={(e) => setCurrentQRId(e.target.value)}
            className="w-full sm:w-auto max-w-full text-xs sm:text-sm py-2 px-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 shadow-xs outline-hidden hover:border-slate-300"
          >
            <option value="all">Visão Consolidada (Todos os QR Codes)</option>
            {qrcodes.map((qr) => (
              <option key={qr.id} value={qr.id}>
                {qr.name} ({qr.clientName || 'Cliente'})
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            title="Atualizar dados"
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="btn-open-reset-analytics"
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors border border-rose-200/80 cursor-pointer shadow-2xs"
            title="Zerar e resetar dados de análise"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Resetar Análise</span>
          </button>

          {currentQR && (
            <button
              onClick={() => onTestScan(currentQR.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition-colors border border-emerald-200"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simular Scan Agora</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Highlight Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Scans</span>
          <p className="text-2xl font-bold text-indigo-600">{totalScans.toLocaleString('pt-BR')}</p>
          <span className="text-xs text-slate-500">Leituras registradas</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Canal Principal</span>
          <p className="text-2xl font-bold text-slate-900">
            {devicesData[0]?.name || 'Mobile'}
          </p>
          <span className="text-xs text-slate-500">Mais frequente</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Principal Cidade</span>
          <p className="text-2xl font-bold text-slate-900">{citiesData[0]?.name || 'Nenhum scan'}</p>
          <span className="text-xs text-slate-500">Maior volume</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Filtro Ativo</span>
          <p className="text-sm font-bold text-slate-900 truncate">
            {currentQR ? currentQR.name : 'Todos os QR Codes'}
          </p>
          <span className="text-xs text-emerald-600 font-semibold">Tempo real</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scans Timeline (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Scans por Período (Últimos 14 Dias)</h3>
              <p className="text-xs text-slate-500">Tendência diária de acessos</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
              Diário
            </span>
          </div>

          <div className="h-64 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
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
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#analyticsGradient)"
                  name="Scans"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Devices Donut (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Dispositivos</h3>
            <p className="text-xs text-slate-500">Origem de hardware das leituras</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devicesData}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {devicesData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {devicesData.map((d: any, idx: number) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-slate-600 font-medium">{d.name}</span>
                </div>
                <span className="font-bold text-slate-900">{d.value} scans</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Hours Bar Chart & Top Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Peak Hours (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Horários com Maior Número de Acessos</h3>
            <p className="text-xs text-slate-500">Distribuição de scans nas 24 horas do dia</p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="scans" fill="#6366f1" radius={[4, 4, 0, 0]} name="Scans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating Systems & Browsers (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sistemas Operacionais & Navegadores</h3>
            <p className="text-xs text-slate-500">Ambiente de software dos usuários</p>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">
                Sistemas Mais Usados
              </span>
              <div className="space-y-1.5">
                {osData.slice(0, 3).map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">
                Navegadores Populares
              </span>
              <div className="space-y-1.5">
                {browsersData.slice(0, 3).map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">
                Principais Cidades & Regiões
              </span>
              <div className="space-y-1.5">
                {citiesData.slice(0, 3).map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate mr-2">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Individual Scans Log Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Log de Acessos Recentes em Tempo Real</h3>
            <p className="text-xs text-slate-500">Últimas leituras com registro de IP, cidade e dispositivo</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Atualizado
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Data e Hora</th>
                <th className="py-2.5 px-3">QR Code</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Dispositivo & SO</th>
                <th className="py-2.5 px-3">Navegador</th>
                <th className="py-2.5 px-3">Localização Exata</th>
                <th className="py-2.5 px-3">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {scansList.slice(0, 15).map((scan) => {
                const date = new Date(scan.timestamp);
                const formattedDate = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                return (
                  <tr key={scan.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[150px] truncate">
                      {scan.qrCodeName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[140px] truncate">
                      {scan.clientName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                        {scan.device} • {scan.os}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{scan.browser}</td>
                    <td className="py-2.5 px-3 min-w-[170px]">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">
                            {scan.city}
                            {scan.region && scan.region !== scan.city && (
                              <span className="text-slate-500 font-normal text-[11px]"> ({scan.region})</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-slate-500">{scan.country}</span>
                            {scan.latitude && scan.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 hover:underline font-mono inline-flex items-center gap-0.5"
                                title="Ver coordenadas exatas no Google Maps"
                              >
                                <span>[GPS {scan.latitude.toFixed(2)}, {scan.longitude.toFixed(2)}]</span>
                              </a>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{scan.referrer}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmação de reset de dados de análise */}
      <ResetAnalyticsModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        qrcodes={qrcodes}
        selectedQRId={currentQRId}
        totalScansCount={totalScans}
      />
    </div>
  );
};
