import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  QrCode,
  Edit2,
  Trash2,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Briefcase,
  X,
  Table as TableIcon,
  LayoutGrid,
  Filter,
  Sparkles,
} from 'lucide-react';
import type { Client, QRCodeItem } from '../types';
import {
  formatShortJapaneseLocation,
  formatJapaneseAddress,
} from '../utils/japaneseAddress';

interface ClientsViewProps {
  clients: (Client & { qrCodeCount?: number; totalScans?: number })[];
  isLoading: boolean;
  onOpenNewClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string, name: string) => void;
  onViewClientDetails?: (client: Client) => void;
  onSelectClient?: (client: Client) => void;
  onCreateQRForClient: (client: Client) => void;
  onOpenClientPortal?: (client: Client) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  isLoading,
  onOpenNewClient,
  onEditClient,
  onDeleteClient,
  onViewClientDetails,
  onSelectClient,
  onCreateQRForClient,
  onOpenClientPortal,
  searchQuery,
  onSearchChange,
}) => {
  const handleViewDetails = onSelectClient || onViewClientDetails || (() => {});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'cards' : 'table'
  );

  const activeSearch = searchQuery !== undefined ? searchQuery : search;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  const filteredClients = clients.filter((c) => {
    const q = activeSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.prefecture && c.prefecture.toLowerCase().includes(q)) ||
      (c.postalCode && c.postalCode.includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const renderClientCard = (client: any) => (
    <div
      key={client.id}
      className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
    >
      <div className="space-y-3.5">
        {/* Header with Avatar and Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-indigo-700 flex items-center justify-center font-bold text-base shadow-sm shrink-0 overflow-hidden">
              {client.logoUrl ? (
                <img
                  src={client.logoUrl}
                  alt={client.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                client.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="truncate min-w-0">
              <h3
                onClick={() => handleViewDetails(client)}
                className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors cursor-pointer truncate"
              >
                {client.name}
              </h3>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{client.contactPerson}</span>
              </p>
            </div>
          </div>

          <span
            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${
              client.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {client.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Contact details */}
        <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}
          {(client.prefecture || client.city || client.postalCode || client.address) && (
            <div
              className="flex items-center gap-2 text-slate-700"
              title={formatJapaneseAddress(client, { includePostalCode: true, includeCountry: true })}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate font-medium text-slate-700">
                {formatShortJapaneseLocation(client)}
              </span>
            </div>
          )}
        </div>

        {/* Metrics Stats Badge */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">QR Codes</span>
            <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">{client.qrCodeCount ?? 0}</span>
          </div>
          <div className="text-center border-l border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Scans</span>
            <span className="text-sm font-bold text-indigo-600 font-mono tabular-nums">{client.totalScans ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => handleViewDetails(client)}
          className="flex-1 min-w-[95px] inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ver Detalhes</span>
        </button>

        {onOpenClientPortal && (
          <button
            type="button"
            onClick={() => onOpenClientPortal(client)}
            title="Acessar como Área do Cliente"
            className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Área do Cliente</span>
            <span className="sm:hidden">Portal</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onCreateQRForClient(client)}
          title="Criar QR Code para este cliente"
          className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onEditClient(client)}
          title="Editar cliente"
          className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          id={`btn-delete-client-${client.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClient(client.id, client.name);
          }}
          title="Excluir cliente"
          className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Gerenciamento de Clientes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cadastre empresas parceiras, visualize métricas, gerencie logos e vincule QR Codes dinâmicos.
          </p>
        </div>
        <button
          id="btn-add-client-page"
          onClick={onOpenNewClient}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input synchronized with Global Search */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar clientes por nome, empresa, e-mail, cidade ou endereço..."
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

          {/* Status Filters and View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 w-full md:w-auto">
            {/* Status pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({clients.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ativos ({clients.filter((c) => c.status === 'active').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === 'inactive'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Inativos ({clients.filter((c) => c.status === 'inactive').length})
              </button>
            </div>

            {/* View Mode Toggle: Table vs Cards */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Exibir em modo Tabela"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Exibir em modo Cards / Grade"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active search filter feedback indicator */}
        {activeSearch.trim() && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Filtrando clientes por: <strong className="text-slate-900">&quot;{activeSearch}&quot;</strong>
              <span className="text-indigo-600 font-bold ml-1">
                ({filteredClients.length} {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'})
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

      {/* Content Area: Table or Cards */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {activeSearch.trim()
              ? `Nenhum cliente encontrado para "${activeSearch}"`
              : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {activeSearch.trim()
              ? 'Tente verificar a ortografia ou buscar por outro termo, e-mail ou cidade.'
              : 'Cadastre seu primeiro cliente parceiro para começar a gerar QR Codes dinâmicos.'}
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
              type="button"
              onClick={onOpenNewClient}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Cadastrar Primeiro Cliente
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <>
          {/* MOBILE CARDS VIEW (lg:hidden) */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.map((client) => renderClientCard(client))}
          </div>

          {/* DESKTOP TABLE VIEW (hidden lg:block) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Empresa / Cliente</th>
                  <th className="py-3 px-4">Contato & Responsável</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4 text-center">QR Codes</th>
                  <th className="py-3 px-4 text-center">Scans</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Logo & Company Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 overflow-hidden">
                          {client.logoUrl ? (
                            <img
                              src={client.logoUrl}
                              alt={client.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            client.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="truncate max-w-[200px]">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(client)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate text-left block"
                          >
                            {client.name}
                          </button>
                          {client.companyName && client.companyName !== client.name && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {client.companyName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Person & Email */}
                    <td className="py-3 px-4">
                      <div className="truncate max-w-[190px]">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{client.contactPerson}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </p>
                        {client.phone && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate font-mono">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{client.phone}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <div
                        className="truncate max-w-[180px]"
                        title={formatJapaneseAddress(client, { includePostalCode: true, includeCountry: true })}
                      >
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{formatShortJapaneseLocation(client)}</span>
                        </div>
                        {client.postalCode && (
                          <span className="text-[10px] font-mono text-slate-400 ml-5 block">
                            〒{client.postalCode}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* QR Code Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {client.qrCodeCount ?? 0}
                      </span>
                    </td>

                    {/* Total Scans */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono">
                        {client.totalScans ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                          client.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            client.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(client)}
                          title="Ver Detalhes do Cliente"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onOpenClientPortal && (
                          <button
                            type="button"
                            onClick={() => onOpenClientPortal(client)}
                            title="Acessar Portal do Cliente"
                            className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Building2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onCreateQRForClient(client)}
                          title="Criar QR Code para este cliente"
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditClient(client)}
                          title="Editar cliente"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          id={`btn-delete-client-table-${client.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClient(client.id, client.name);
                          }}
                          title="Excluir cliente"
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
    ) : (
      /* CARDS GRID VIEW */
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredClients.map((client) => renderClientCard(client))}
      </div>
    )}
    </div>
  );
};
