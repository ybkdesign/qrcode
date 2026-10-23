import React, { useState } from 'react';
import {
  QrCode,
  Search,
  Plus,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Download,
  Power,
  Check,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowUpDown,
  Smartphone,
  Building2,
  UserCheck,
  UserX,
  UserPlus,
  X,
} from 'lucide-react';
import type { QRCodeItem, Client, QRCodeType } from '../types';
import { AssignClientModal } from './AssignClientModal';

interface QRCodesViewProps {
  qrcodes: QRCodeItem[];
  clients: Client[];
  isLoading: boolean;
  onOpenNewQR: () => void;
  onEditQR: (qr: QRCodeItem) => void;
  onQuickChangeUrl: (qr: QRCodeItem) => void;
  onToggleStatus: (id: string) => void;
  onDuplicateQR: (id: string) => void;
  onDeleteQR: (id: string, name: string) => void;
  onDownloadQR: (qr: QRCodeItem) => void;
  onViewAnalytics: (qr: QRCodeItem) => void;
  onTestScan: (id: string) => void;
  onAssignClient?: (qrId: string, clientId: string | null) => Promise<void>;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const QRCodesView: React.FC<QRCodesViewProps> = ({
  qrcodes,
  clients,
  isLoading,
  onOpenNewQR,
  onEditQR,
  onQuickChangeUrl,
  onToggleStatus,
  onDuplicateQR,
  onDeleteQR,
  onDownloadQR,
  onViewAnalytics,
  onTestScan,
  onAssignClient,
  searchQuery,
  onSearchChange,
}) => {
  const [search, setSearch] = useState('');
  const activeSearch = searchQuery !== undefined ? searchQuery : search;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [assignTargetQR, setAssignTargetQR] = useState<QRCodeItem | null>(null);

  const unassignedCount = qrcodes.filter((q) => !q.clientId || q.clientId.trim() === '').length;
  const assignedCount = qrcodes.length - unassignedCount;

  const filteredQRs = qrcodes.filter((qr) => {
    const matchesSearch =
      qr.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      qr.shortCode.toLowerCase().includes(activeSearch.toLowerCase()) ||
      qr.destinationUrl.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (qr.clientName && qr.clientName.toLowerCase().includes(activeSearch.toLowerCase()));

    let matchesClient = true;
    if (clientFilter === 'unassigned') {
      matchesClient = !qr.clientId || qr.clientId.trim() === '';
    } else if (clientFilter === 'assigned') {
      matchesClient = !!qr.clientId && qr.clientId.trim() !== '';
    } else if (clientFilter !== 'all') {
      matchesClient = qr.clientId === clientFilter;
    }

    const matchesStatus = statusFilter === 'all' ? true : qr.status === statusFilter;
    const matchesType = typeFilter === 'all' || qr.type === typeFilter;

    return matchesSearch && matchesClient && matchesStatus && matchesType;
  });

  const handleCopyLink = (shortCode: string, id: string) => {
    const dynamicUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(dynamicUrl);
    setCopiedSlug(id);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const qrTypeLabels: Record<QRCodeType, string> = {
    website: 'Website',
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    google_maps: 'Google Maps',
    custom_link: 'Link Personalizado',
    link_page: 'Página de Links',
    pdf: 'Documento PDF',
    digital_menu: 'Menu Digital',
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Gerenciamento de QR Codes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Códigos dinâmicos de alta resolução. Altere destinos em tempo real sem precisar reimprimir embalagens ou placas.
          </p>
        </div>

        <button
          id="btn-create-qr-view"
          onClick={onOpenNewQR}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Criar QR Code Dinâmico</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, slug, cliente ou destino..."
              value={activeSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-hidden font-medium"
            />
            {activeSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Client Filter */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-hidden hover:bg-slate-100"
            >
              <option value="all">Filtro Cliente: Todos</option>
              <option value="unassigned">Apenas Avulsos (Sem Cliente - {unassignedCount})</option>
              <option value="assigned">Apenas Vinculados ({assignedCount})</option>
              <optgroup label="Clientes Específicos">
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-hidden hover:bg-slate-100"
            >
              <option value="all">Status: Todos</option>
              <option value="active">Apenas Ativos</option>
              <option value="inactive">Apenas Pausados</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-hidden hover:bg-slate-100"
            >
              <option value="all">Tipos: Todos</option>
              {Object.entries(qrTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {(activeSearch || clientFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  handleSearchChange('');
                  setClientFilter('all');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer col-span-full sm:col-auto text-center"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {activeSearch && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Filtrando tabela por: <strong>&quot;{activeSearch}&quot;</strong> ({filteredQRs.length} de {qrcodes.length} QR Codes)
            </span>
            <button
              onClick={() => handleSearchChange('')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer underline"
            >
              Remover filtro
            </button>
          </div>
        )}

        {/* Quick Filter Chips for Client Linkage */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
          <span className="text-slate-400 font-semibold text-[11px] mr-1">Vínculo:</span>
          <button
            type="button"
            onClick={() => setClientFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              clientFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({qrcodes.length})
          </button>

          <button
            type="button"
            onClick={() => setClientFilter('unassigned')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              clientFilter === 'unassigned'
                ? 'bg-amber-600 text-white shadow-xs'
                : unassignedCount > 0
                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Avulsos / Não Vinculados ({unassignedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setClientFilter('assigned')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              clientFilter === 'assigned'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Vinculados a Clientes ({assignedCount})</span>
          </button>
        </div>

        {/* Active search filter feedback indicator */}
        {activeSearch.trim() && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Filtrando QR Codes por: <strong className="text-slate-900">&quot;{activeSearch}&quot;</strong>
              <span className="text-indigo-600 font-bold ml-1">
                ({filteredQRs.length} {filteredQRs.length === 1 ? 'QR Code encontrado' : 'QR Codes encontrados'})
              </span>
            </span>
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        )}
      </div>

      {/* QR Codes Table or Grid */}
      {filteredQRs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {activeSearch.trim()
              ? `Nenhum QR Code encontrado para "${activeSearch}"`
              : 'Nenhum QR Code encontrado'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {activeSearch.trim()
              ? 'Tente pesquisar por outro termo, slug ou alterar o filtro de status/cliente.'
              : 'Ajuste os filtros de pesquisa ou gere um novo QR Code dinâmico.'}
          </p>
          {activeSearch.trim() ? (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" /> Limpar filtro de busca
            </button>
          ) : (
            <button
              onClick={onOpenNewQR}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Criar Novo QR Code
            </button>
          )}
        </div>
      ) : (
        <>
          {/* MOBILE CARD LIST (lg:hidden) */}
          <div className="lg:hidden space-y-3.5">
            {filteredQRs.map((qr) => (
              <div
                key={qr.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3 transition-all"
              >
                {/* Top Row: QR Icon + Title & Slug + Prominent Status Toggle */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onDownloadQR(qr)}
                      title="Visualizar e Baixar QR Code"
                      className="w-11 h-11 rounded-2xl bg-indigo-50/90 border border-indigo-100 flex items-center justify-center text-indigo-600 active:scale-95 transition-transform shrink-0 cursor-pointer shadow-2xs"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h4
                        onClick={() => onDownloadQR(qr)}
                        className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors cursor-pointer truncate"
                      >
                        {qr.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-indigo-600 bg-indigo-50/90 px-1.5 py-0.5 rounded text-[11px] font-bold">
                          /r/{qr.shortCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(qr.shortCode, qr.id)}
                          title="Copiar URL dinâmica"
                          className="p-1 text-slate-400 hover:text-slate-700 active:scale-90 transition-transform cursor-pointer"
                        >
                          {copiedSlug === qr.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle Pill - Highly touch-accessible */}
                  <button
                    type="button"
                    onClick={() => onToggleStatus(qr.id)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer border shadow-2xs ${
                      qr.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                    title="Alternar Ativo/Pausado"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        qr.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>{qr.status === 'active' ? 'Ativo' : 'Pausado'}</span>
                  </button>
                </div>

                {/* Client & Type Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {qr.clientId && qr.clientId.trim() !== '' ? (
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-semibold truncate max-w-[170px]">{qr.clientName || 'Cliente'}</span>
                        <button
                          type="button"
                          onClick={() => setAssignTargetQR(qr)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer ml-1"
                        >
                          Alterar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <UserX className="w-3 h-3 text-amber-600" />
                          Avulso
                        </span>
                        <button
                          type="button"
                          onClick={() => setAssignTargetQR(qr)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          Vincular Cliente
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    {qrTypeLabels[qr.type] || qr.type}
                  </span>
                </div>

                {/* Destination URL Box with 1-tap Change Button */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Destino Atual:</span>
                    <a
                      href={qr.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-slate-700 hover:text-indigo-600 font-medium truncate block mt-0.5"
                    >
                      {qr.destinationUrl}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuickChangeUrl(qr)}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 text-xs font-bold rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    Alterar
                  </button>
                </div>

                {/* Scans Metric Strip & Action Buttons */}
                <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onViewAnalytics(qr)}
                      className="flex items-center gap-1 text-left cursor-pointer hover:opacity-80"
                    >
                      <span className="font-extrabold text-slate-900 text-sm font-mono tabular-nums">
                        {qr.scanCount.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-slate-400 text-xs">scans</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {qr.lastScannedAt ? 'Escaneado recentemente' : 'Sem scans'}
                    </span>
                  </div>

                  {/* Touch Action Row: Spacious grid with clear delete button */}
                  <div className="grid grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => onDownloadQR(qr)}
                      title="Baixar QR Code"
                      className="min-h-[42px] flex items-center justify-center text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 rounded-xl border border-slate-200/90 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewAnalytics(qr)}
                      title="Estatísticas"
                      className="min-h-[42px] flex items-center justify-center text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 rounded-xl border border-slate-200/90 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditQR(qr)}
                      title="Editar Configurações"
                      className="min-h-[42px] flex items-center justify-center text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 rounded-xl border border-slate-200/90 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDuplicateQR(qr.id)}
                      title="Duplicar"
                      className="min-h-[42px] flex items-center justify-center text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 rounded-xl border border-slate-200/90 transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteQR(qr.id, qr.name);
                      }}
                      title="Excluir QR Code"
                      className="min-h-[42px] flex items-center justify-center text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE (hidden lg:block) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Código & Nome</th>
                  <th className="py-3 px-4">Cliente Vinculado</th>
                  <th className="py-3 px-4">Destino Atual</th>
                  <th className="py-3 px-4">Scans</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredQRs.map((qr) => (
                  <tr key={qr.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* QR Code Identification */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onDownloadQR(qr)}
                          title="Visualizar e Baixar"
                          className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors shrink-0"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                        <div className="truncate max-w-[220px]">
                          <p
                            onClick={() => onDownloadQR(qr)}
                            className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                          >
                            {qr.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                              /r/{qr.shortCode}
                            </span>
                            <button
                              onClick={() => handleCopyLink(qr.shortCode, qr.id)}
                              title="Copiar URL dinâmica"
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                            >
                              {copiedSlug === qr.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-3.5 px-4">
                      {qr.clientId && qr.clientId.trim() !== '' ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-900 block truncate max-w-[160px]">
                              {qr.clientName || 'Cliente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 capitalize">
                              {qrTypeLabels[qr.type] || qr.type}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAssignTargetQR(qr)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                              title="Alterar ou desvincular cliente"
                            >
                              Alterar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <UserX className="w-3 h-3 text-amber-600" />
                            Avulso (Sem Cliente)
                          </span>
                          <button
                            type="button"
                            onClick={() => setAssignTargetQR(qr)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Vincular Cliente</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Destination URL */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-[240px]">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={qr.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-600 hover:text-indigo-600 truncate font-mono text-[11px] max-w-[190px]"
                            title={qr.destinationUrl}
                          >
                            {qr.destinationUrl}
                          </a>
                          <a
                            href={qr.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <button
                          onClick={() => onQuickChangeUrl(qr)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 underline mt-0.5 inline-block"
                        >
                          Alterar Destino
                        </button>
                      </div>
                    </td>

                    {/* Scans */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onViewAnalytics(qr)}
                        className="text-left group/scan hover:underline"
                      >
                        <span className="font-bold text-slate-900 text-sm block">
                          {qr.scanCount.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {qr.lastScannedAt ? 'Último hoje' : 'Sem scans'}
                        </span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(qr.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border shadow-2xs ${
                          qr.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Clique para alternar status"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            qr.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span>{qr.status === 'active' ? 'Ativo' : 'Pausado'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onDownloadQR(qr)}
                          title="Baixar em PNG / SVG / PDF"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onViewAnalytics(qr)}
                          title="Ver Estatísticas do QR Code"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditQR(qr)}
                          title="Editar Configurações e Estilo"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDuplicateQR(qr.id)}
                          title="Duplicar QR Code"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onTestScan(qr.id)}
                          title="Simular Scan / Testar Leitura"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setAssignTargetQR(qr)}
                          title={qr.clientId ? "Alterar ou Desvincular Cliente" : "Direcionar / Atribuir a um Cliente"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            !qr.clientId
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                              : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          id={`btn-delete-qr-${qr.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteQR(qr.id, qr.name);
                          }}
                          title="Excluir QR Code"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}

      {/* Modal for Assigning / Directing QR Code to Client */}
      <AssignClientModal
        isOpen={Boolean(assignTargetQR)}
        onClose={() => setAssignTargetQR(null)}
        qr={assignTargetQR}
        clients={clients}
        onAssign={async (qrId, clientId) => {
          if (onAssignClient) {
            await onAssignClient(qrId, clientId);
          }
          setAssignTargetQR(null);
        }}
      />
    </div>
  );
};
