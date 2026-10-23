import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  QrCode,
  Users,
  ExternalLink,
  CheckCircle2,
  X,
  LogOut,
  Building2,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Client, QRCodeItem } from '../types';

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenNewQRCode?: () => void;
  onOpenNewQR?: () => void;
  onOpenNewClient?: () => void;
  clients: Client[];
  qrcodes: QRCodeItem[];
  onSelectQRCode?: (qr: QRCodeItem) => void;
  onSelectQR?: (qr: QRCodeItem) => void;
  onSelectClient?: (client: Client) => void;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onToggleMobileMenu,
  onOpenNewQRCode,
  onOpenNewQR,
  onOpenNewClient,
  clients,
  qrcodes,
  onSelectQRCode,
  onSelectQR,
  onSelectClient,
  userName,
  userEmail,
  onLogout,
  searchQuery,
  onSearchChange,
  currentView = 'dashboard',
  onNavigate,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'qrcodes' | 'clients'>('all');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Controlled or uncontrolled query
  const query = searchQuery !== undefined ? searchQuery : internalSearch;

  const handleOpenMenu = onOpenMobileSidebar || onToggleMobileMenu || (() => {});
  const handleCreateQR = onOpenNewQRCode || onOpenNewQR || (() => {});
  const handleCreateClient = onOpenNewClient || (() => {});

  const handleSelectQR = (qr: QRCodeItem) => {
    if (onSelectQRCode) onSelectQRCode(qr);
    else if (onSelectQR) onSelectQR(qr);
    else if (onNavigate) onNavigate('qrcodes');
  };

  const handleSelectClientItem = (client: Client) => {
    if (onSelectClient) {
      onSelectClient(client);
    } else if (onNavigate) {
      onNavigate('clients');
    }
  };

  const handleQueryChange = (val: string) => {
    if (searchQuery === undefined) {
      setInternalSearch(val);
    }
    if (onSearchChange) {
      onSearchChange(val);
    }
    setIsSearchOpen(true);
  };

  const handleClearQuery = () => {
    if (searchQuery === undefined) {
      setInternalSearch('');
    }
    if (onSearchChange) {
      onSearchChange('');
    }
    inputRef.current?.focus();
  };

  // Keyboard shortcut (Ctrl+K / Cmd+K or /) to focus global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter items based on query
  const cleanQ = query.trim().toLowerCase();

  const filteredQRs = cleanQ
    ? qrcodes.filter(
        (q) =>
          q.name.toLowerCase().includes(cleanQ) ||
          q.shortCode.toLowerCase().includes(cleanQ) ||
          q.destinationUrl.toLowerCase().includes(cleanQ) ||
          (q.clientName && q.clientName.toLowerCase().includes(cleanQ))
      )
    : [];

  const filteredClients = cleanQ
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQ) ||
          (c.companyName && c.companyName.toLowerCase().includes(cleanQ)) ||
          c.contactPerson.toLowerCase().includes(cleanQ) ||
          c.email.toLowerCase().includes(cleanQ) ||
          (c.city && c.city.toLowerCase().includes(cleanQ)) ||
          (c.prefecture && c.prefecture.toLowerCase().includes(cleanQ))
      )
    : [];

  const totalResults = filteredQRs.length + filteredClients.length;
  const hasResults = totalResults > 0;

  // View name label for indicator
  const getViewName = () => {
    switch (currentView) {
      case 'qrcodes':
        return 'Tabela de QR Codes';
      case 'clients':
        return 'Tabela de Clientes';
      case 'analytics':
        return 'Tabela de Acessos & Métricas';
      case 'history':
        return 'Histórico Operacional';
      case 'client_detail':
        return 'Detalhes do Cliente';
      default:
        return 'Tabela Atual';
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Form submit / Enter key
  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (currentView === 'dashboard' && onNavigate) {
        if (filteredQRs.length > 0 && filteredClients.length === 0) {
          onNavigate('qrcodes');
          setIsSearchOpen(false);
        } else if (filteredClients.length > 0 && filteredQRs.length === 0) {
          onNavigate('clients');
          setIsSearchOpen(false);
        } else if (filteredQRs.length > 0) {
          onNavigate('qrcodes');
          setIsSearchOpen(false);
        }
      } else {
        // If already on a table view, close dropdown so user sees the filtered table
        setIsSearchOpen(false);
      }
    }
  };

  const getSearchPlaceholder = () => {
    switch (currentView) {
      case 'qrcodes':
        return 'Buscar QR Codes (nome, slug, destino)...';
      case 'clients':
        return 'Buscar clientes (nome, empresa, e-mail)...';
      case 'history':
        return 'Buscar no histórico de alterações...';
      default:
        return 'Buscar clientes ou QR Codes...';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 max-w-full overflow-hidden">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-2xl">
        <button
          id="btn-mobile-menu"
          type="button"
          onClick={handleOpenMenu}
          className="p-2 -ml-1 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl lg:hidden flex items-center justify-center cursor-pointer min-w-[40px] min-h-[40px] shrink-0 transition-colors"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Global Search Box */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              id="global-search-input"
              type="text"
              placeholder={getSearchPlaceholder()}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleKeyDownInput}
              className="w-full pl-10 pr-20 sm:pr-28 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs md:text-sm text-slate-900 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-hidden font-medium"
            />

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Limpar pesquisa e filtro"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/90 border border-slate-200 rounded-md shadow-2xs select-none">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Search Dropdown Results & Table Filter Status */}
          {isSearchOpen && query.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 max-h-[85vh] sm:max-h-[500px] flex flex-col animate-in fade-in zoom-in-98 duration-150">
              {/* Dropdown Header: Filter scope & table indicator */}
              <div className="p-3 bg-slate-50 border-b border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Resultados da Busca Global</span>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                      {totalResults} {totalResults === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  {/* Filter scope buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveFilterTab('all')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        activeFilterTab === 'all'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      Todos ({totalResults})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilterTab('qrcodes')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        activeFilterTab === 'qrcodes'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      QR Codes ({filteredQRs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilterTab('clients')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        activeFilterTab === 'clients'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      Clientes ({filteredClients.length})
                    </button>
                  </div>
                </div>

                {/* Banner: Visualizing active filter on current table */}
                <div className="px-2.5 py-1.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Filtrando em tempo real na: <strong>{getViewName()}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    Ver tabela completa
                  </button>
                </div>
              </div>

              {/* Results list body */}
              <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-2 space-y-2">
                {hasResults ? (
                  <>
                    {/* QR Codes Group */}
                    {(activeFilterTab === 'all' || activeFilterTab === 'qrcodes') &&
                      filteredQRs.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-indigo-600">
                              <QrCode className="w-3.5 h-3.5" /> QR Codes ({filteredQRs.length})
                            </span>
                            {onNavigate && currentView !== 'qrcodes' && (
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigate('qrcodes');
                                  setIsSearchOpen(false);
                                }}
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                              >
                                <span>Ver na tabela de QR Codes</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-1 mt-1">
                            {filteredQRs.slice(0, 6).map((qr) => (
                              <button
                                key={qr.id}
                                type="button"
                                onClick={() => {
                                  handleSelectQR(qr);
                                  setIsSearchOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 flex items-center justify-between transition-all group cursor-pointer"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <QrCode className="w-4 h-4" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                                      {qr.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate font-mono">
                                      /r/{qr.shortCode} • {qr.clientName || 'Geral (Sem cliente)'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors shrink-0">
                                  {qr.scanCount || 0} scans
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Clients Group */}
                    {(activeFilterTab === 'all' || activeFilterTab === 'clients') &&
                      filteredClients.length > 0 && (
                        <div className="pt-2">
                          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-emerald-600">
                              <Users className="w-3.5 h-3.5" /> Clientes ({filteredClients.length})
                            </span>
                            {onNavigate && currentView !== 'clients' && (
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigate('clients');
                                  setIsSearchOpen(false);
                                }}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-1"
                              >
                                <span>Ver na tabela de clientes</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-1 mt-1">
                            {filteredClients.slice(0, 6).map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => {
                                  handleSelectClientItem(client);
                                  setIsSearchOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 flex items-center justify-between transition-all group cursor-pointer"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    {client.logoUrl ? (
                                      <img
                                        src={client.logoUrl}
                                        alt={client.name}
                                        className="w-full h-full object-contain p-0.5"
                                      />
                                    ) : (
                                      client.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-emerald-700 truncate">
                                      {client.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate">
                                      {client.contactPerson} • {client.city || client.prefecture || 'Japão'} • {client.email}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                    client.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                                  }`}
                                >
                                  {client.status === 'active' ? 'Ativo' : 'Inativo'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                    <p className="font-semibold text-slate-700">Nenhum resultado encontrado para &quot;{query}&quot;</p>
                    <p className="text-[11px] text-slate-400">
                      Tente buscar por outro termo, nome da empresa, destino ou cidade.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Table Switcher Footer */}
              {hasResults && onNavigate && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Pressione <strong>Enter</strong> para ver na tela atual
                  </span>
                  <div className="flex items-center gap-2">
                    {filteredQRs.length > 0 && currentView !== 'qrcodes' && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('qrcodes');
                          setIsSearchOpen(false);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Tabela QR Codes ({filteredQRs.length})
                      </button>
                    )}
                    {filteredClients.length > 0 && currentView !== 'clients' && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('clients');
                          setIsSearchOpen(false);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Tabela Clientes ({filteredClients.length})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          id="btn-header-new-client"
          type="button"
          onClick={handleCreateClient}
          className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all hover:border-slate-300 cursor-pointer"
        >
          <Users className="w-4 h-4 text-slate-500" />
          <span>Novo Cliente</span>
        </button>

        <button
          id="btn-header-new-qr"
          type="button"
          onClick={handleCreateQR}
          className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 text-xs md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Criar QR Code</span>
          <span className="sm:hidden text-xs">Criar QR</span>
        </button>

        {onLogout && (
          <button
            id="btn-header-logout"
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl shadow-xs transition-all cursor-pointer group shrink-0"
            title="Sair do sistema (Encerrar sessão)"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        )}
      </div>
    </header>
  );
};
