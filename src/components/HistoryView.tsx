import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Power,
  Sliders,
  UserCheck,
  UserX,
  Copy,
  Clock,
  ArrowRight,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { HistoryLog } from '../types';
import { api } from '../api';

interface HistoryViewProps {
  logs: HistoryLog[];
  isLoading: boolean;
  onRefresh: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

/**
 * Normalizes text by removing diacritics/accents, converting to lower case, and trimming.
 * Ensures searches for "excluido" match "QR Excluído", "analise" matches "Análise Resetada", etc.
 */
export const normalizeText = (text?: string): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const ACTION_BADGES: Record<
  string,
  { icon: React.FC<{ className?: string }>; label: string; bg: string }
> = {
  qr_url_changed: {
    icon: RefreshCw,
    label: 'URL Alterada',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  qr_created: {
    icon: Plus,
    label: 'QR Criado',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  qr_activated: {
    icon: Power,
    label: 'QR Ativado',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  qr_deactivated: {
    icon: Power,
    label: 'QR Pausado',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  qr_duplicated: {
    icon: Copy,
    label: 'QR Duplicado',
    bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  qr_deleted: {
    icon: Trash2,
    label: 'QR Excluído',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  qr_assigned: {
    icon: UserCheck,
    label: 'QR Atribuído',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  qr_unassigned: {
    icon: UserX,
    label: 'QR Desvinculado',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  client_created: {
    icon: Plus,
    label: 'Cliente Cadastrado',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  client_updated: {
    icon: Edit2,
    label: 'Cliente Atualizado',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  client_deleted: {
    icon: Trash2,
    label: 'Cliente Excluído',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  analytics_reset: {
    icon: RotateCcw,
    label: 'Análise Resetada',
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  settings_updated: {
    icon: Sliders,
    label: 'Configurações',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export const getActionBadge = (action: HistoryLog['action']) => {
  return (
    ACTION_BADGES[action] || {
      icon: Sliders,
      label: 'Ação do Sistema',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
    }
  );
};

export const HistoryView: React.FC<HistoryViewProps> = ({
  logs,
  isLoading,
  onRefresh,
  searchQuery,
  onSearchChange,
}) => {
  // Local immediate state for instant reactive input updates
  const [search, setSearch] = useState(() => searchQuery || '');
  const [filterAction, setFilterAction] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverLogs, setServerLogs] = useState<HistoryLog[]>(logs);

  // Active query ID counter to eliminate stale server-side response race conditions
  const queryVersionRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep serverLogs in sync when master logs prop changes (unless custom filtered from server)
  useEffect(() => {
    setServerLogs(logs);
  }, [logs]);

  // Synchronize when outer searchQuery prop changes
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== search) {
      setSearch(searchQuery);
    }
  }, [searchQuery]);

  // Handle immediate input change with debounced server request
  const handleSearchChange = (val: string) => {
    // 1. Immediate client-side state update for instant zero-latency UI re-render
    setSearch(val);
    if (onSearchChange) onSearchChange(val);

    // 2. Invalidate previous in-flight requests so stale responses cannot overwrite state
    queryVersionRef.current += 1;
    const currentVersion = queryVersionRef.current;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 3. Debounce server-side query request (250ms) to sync with host storage
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const fetched = await api.getHistory({
          search: val.trim() || undefined,
          action: filterAction !== 'all' ? filterAction : undefined,
          limit: 250,
        });
        // Discard result if user typed further or changed filters in the meantime
        if (queryVersionRef.current === currentVersion) {
          setServerLogs(fetched);
        }
      } catch (err) {
        // Fallback to client-side data on network glitch without breaking UI
        console.warn('History search sync warning:', err);
      }
    }, 250);
  };

  const handleClearSearch = () => {
    setSearch('');
    if (onSearchChange) onSearchChange('');
    queryVersionRef.current += 1;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Instantly reset back to base logs
    setServerLogs(logs);
  };

  const handleActionFilterChange = (newAction: string) => {
    setFilterAction(newAction);
    queryVersionRef.current += 1;
    const currentVersion = queryVersionRef.current;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounced sync with host side
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const fetched = await api.getHistory({
          search: search.trim() || undefined,
          action: newAction !== 'all' ? newAction : undefined,
          limit: 250,
        });
        if (queryVersionRef.current === currentVersion) {
          setServerLogs(fetched);
        }
      } catch (err) {
        console.warn('History filter sync warning:', err);
      }
    }, 150);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    queryVersionRef.current += 1;
    try {
      await onRefresh();
      const fresh = await api.getHistory({
        search: search.trim() || undefined,
        action: filterAction !== 'all' ? filterAction : undefined,
      });
      setServerLogs(fresh);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Immediate reactive filtering over the active log dataset
  // Matches against the entry's action text (both human badge label and raw action name),
  // as well as title, description, userName, and target ID.
  const activeLogSource = serverLogs.length > 0 ? serverLogs : logs;

  const filteredLogs = useMemo(() => {
    const rawSearch = search.trim();
    const normalizedQuery = normalizeText(rawSearch);
    const searchWords = normalizedQuery.split(/\s+/).filter(Boolean);

    return activeLogSource.filter((log) => {
      // 1. Action category filter
      if (filterAction !== 'all' && log.action !== filterAction) {
        return false;
      }

      // If no search query, keep entry
      if (searchWords.length === 0) {
        return true;
      }

      // 2. Extract and normalize fields, specifically action text
      const badge = getActionBadge(log.action);
      const actionText = normalizeText(badge.label); // e.g. "url alterada", "qr excluido"
      const rawActionText = normalizeText(log.action); // e.g. "qr_url_changed", "qr_deleted"
      const titleText = normalizeText(log.title);
      const descriptionText = normalizeText(log.description);
      const userText = normalizeText(log.userName);
      const targetIdText = normalizeText(log.targetId);
      const targetTypeText = normalizeText(log.targetType);

      // Match all query terms (supports multi-term searches like "qr excluido" or "url alterada")
      return searchWords.every((word) => {
        return (
          actionText.includes(word) ||
          rawActionText.includes(word) ||
          titleText.includes(word) ||
          descriptionText.includes(word) ||
          userText.includes(word) ||
          targetIdText.includes(word) ||
          targetTypeText.includes(word)
        );
      });
    });
  }, [activeLogSource, search, filterAction]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Histórico & Logs de Auditoria
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Registro reativo de ações: alterações de URLs, mudanças de status, exclusões e cadastros.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all self-start sm:self-auto cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Histórico'}</span>
        </button>
      </div>

      {/* Reactive Search and Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Reactive Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por ação (ex: URL Alterada, QR Excluído), título ou usuário..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-hidden text-slate-800 placeholder-slate-400 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                title="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <select
                value={filterAction}
                onChange={(e) => handleActionFilterChange(e.target.value)}
                className="text-xs sm:text-sm py-2.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-hidden hover:bg-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer transition-all"
              >
                <option value="all">Todas as Ações</option>
                <option value="qr_url_changed">URL Alterada (Destino)</option>
                <option value="qr_created">QR Criado</option>
                <option value="qr_activated">QR Ativado</option>
                <option value="qr_deactivated">QR Pausado</option>
                <option value="qr_duplicated">QR Duplicado</option>
                <option value="qr_deleted">QR Excluído</option>
                <option value="qr_assigned">QR Atribuído a Cliente</option>
                <option value="client_created">Cliente Cadastrado</option>
                <option value="client_updated">Cliente Atualizado</option>
                <option value="client_deleted">Cliente Excluído</option>
                <option value="analytics_reset">Análise Resetada</option>
                <option value="settings_updated">Configurações Alteradas</option>
              </select>
            </div>

            {(search || filterAction !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  handleClearSearch();
                  handleActionFilterChange('all');
                }}
                className="text-xs font-semibold px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Limpar Tudo
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips for Rapid Filtering */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 text-xs">
          <span className="text-slate-400 font-medium text-[11px] shrink-0 mr-1">Filtro rápido:</span>
          {[
            { label: 'Todos', value: 'all' },
            { label: 'URLs', value: 'qr_url_changed' },
            { label: 'QR Criados', value: 'qr_created' },
            { label: 'QR Pausados', value: 'qr_deactivated' },
            { label: 'QR Excluídos', value: 'qr_deleted' },
            { label: 'Clientes', value: 'client_created' },
            { label: 'Métricas Zeradas', value: 'analytics_reset' },
          ].map((chip) => {
            const isActive = filterAction === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => handleActionFilterChange(chip.value)}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Active Results Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>
              Exibindo <strong className="text-slate-800 font-semibold">{filteredLogs.length}</strong> de{' '}
              <strong className="text-slate-800 font-semibold">{activeLogSource.length}</strong> registros
            </span>
            {search && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                Filtrado por "{search}"
              </span>
            )}
          </div>

          {filteredLogs.length > 0 && (
            <span className="text-slate-400 hidden sm:inline">Ordem cronológica reversa (mais recentes primeiro)</span>
          )}
        </div>
      </div>

      {/* History Timeline Cards */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Nenhum registro encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search
                  ? `Nenhuma ação no histórico corresponde ao termo "${search}". Verifique a digitação ou limpe a busca.`
                  : 'Nenhum registro de auditoria disponível para o filtro selecionado.'}
              </p>
            </div>
            {(search || filterAction !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  handleClearSearch();
                  handleActionFilterChange('all');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar filtros de busca</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((item) => {
              const badge = getActionBadge(item.action);
              const Icon = badge.icon;
              const date = new Date(item.timestamp);
              const isValidDate = !isNaN(date.getTime());
              const formattedDate = isValidDate
                ? `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : item.timestamp;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50/90 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl border ${badge.bg} shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{item.title}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        {item.targetType && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                            {item.targetType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl break-words">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 text-xs text-slate-500 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      {item.userName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {formattedDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
