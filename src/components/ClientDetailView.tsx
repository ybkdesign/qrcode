import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  QrCode,
  Eye,
  Plus,
  Edit2,
  ExternalLink,
  Power,
  Download,
  Copy,
  Check,
  TrendingUp,
  Trash2,
  UserPlus,
  Link2Off,
  Sparkles,
  X,
  KeyRound,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { Client, QRCodeItem } from '../types';
import {
  formatJapaneseAddress,
  formatJapanesePostalCode,
  getGoogleMapsSearchUrl,
} from '../utils/japaneseAddress';

interface ClientDetailViewProps {
  client: Client & { qrcodes?: QRCodeItem[]; totalScans?: number };
  allQRCodes?: QRCodeItem[];
  onBack: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient?: (id: string, name: string) => void;
  onDeleteQR?: (id: string, name: string) => void;
  onCreateQR: (client: Client) => void;
  onSelectQR: (qr: QRCodeItem) => void;
  onToggleStatusQR: (id: string) => void;
  onQuickChangeUrl: (qr: QRCodeItem) => void;
  onDownloadQR: (qr: QRCodeItem) => void;
  onOpenClientPortal?: (client: Client) => void;
  onAssignQR?: (qrId: string, clientId: string | null) => Promise<void>;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  allQRCodes = [],
  onBack,
  onEditClient,
  onDeleteClient,
  onDeleteQR,
  onCreateQR,
  onSelectQR,
  onToggleStatusQR,
  onQuickChangeUrl,
  onDownloadQR,
  onOpenClientPortal,
  onAssignQR,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showClientPass, setShowClientPass] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [selectedUnassignedQRId, setSelectedUnassignedQRId] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);

  const unassignedQRs = allQRCodes.filter((q) => !q.clientId || q.clientId.trim() === '');

  const fullJapaneseAddress = formatJapaneseAddress(client, { includePostalCode: true, includeCountry: true });
  const mapsUrl = getGoogleMapsSearchUrl(client);

  const handleCopyAddress = () => {
    if (!fullJapaneseAddress) return;
    navigator.clipboard.writeText(fullJapaneseAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const qrcodes = client.qrcodes || [];
  const activeCount = qrcodes.filter((q) => q.status === 'active').length;
  const totalScans = client.totalScans || qrcodes.reduce((acc, q) => acc + (q.scanCount || 0), 0);

  // Synthesize chart data for client based on their QR codes
  const mockChartData = [
    { date: '01/09', scans: Math.round(totalScans * 0.05) },
    { date: '03/09', scans: Math.round(totalScans * 0.08) },
    { date: '05/09', scans: Math.round(totalScans * 0.12) },
    { date: '07/09', scans: Math.round(totalScans * 0.15) },
    { date: '09/09', scans: Math.round(totalScans * 0.22) },
    { date: '11/09', scans: Math.round(totalScans * 0.28) },
    { date: '12/09', scans: Math.round(totalScans * 0.32) },
  ];

  const handleCopyLink = (shortCode: string, id: string) => {
    const fullUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top back button & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Clientes</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenClientPortal && (
            <button
              onClick={() => onOpenClientPortal(client)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Visualizar exatamente como o cliente vê o portal"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Acessar Área do Cliente</span>
            </button>
          )}

          <button
            onClick={() => onEditClient(client)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Editar Dados</span>
          </button>
          {onDeleteClient && (
            <button
              onClick={() => onDeleteClient(client.id, client.name)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Excluir este cliente"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Excluir Cliente</span>
            </button>
          )}
          <button
            onClick={() => onCreateQR(client)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo QR Code</span>
          </button>
        </div>
      </div>

      {/* Client Overview Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-indigo-600/20 shrink-0 overflow-hidden bg-white border border-slate-200/80">
              {client.logoUrl ? (
                <img
                  src={client.logoUrl}
                  alt={client.name}
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                client.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {client.name}
                </h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    client.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {client.status === 'active' ? 'Cliente Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
                <span>{client.companyName || client.name}</span>
                <span>•</span>
                <span>Responsável: {client.contactPerson}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <div className="flex-1 md:flex-initial bg-slate-50 border border-slate-200/70 rounded-2xl px-5 py-3 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                QR Codes
              </span>
              <span className="text-xl font-bold text-slate-900">{qrcodes.length}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">{activeCount} ativos</span>
            </div>
            <div className="flex-1 md:flex-initial bg-indigo-50/60 border border-indigo-100 rounded-2xl px-5 py-3 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                Total Scans
              </span>
              <span className="text-xl font-bold text-indigo-700">{totalScans.toLocaleString('pt-BR')}</span>
              <span className="text-[10px] text-indigo-600 font-medium block">acessos acumulados</span>
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">E-mail</span>
              <span className="font-semibold text-slate-800">{client.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Telefone / Contato (Japão)</span>
              <span className="font-semibold text-slate-800">{client.phone || 'Não informado'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cadastrado em</span>
              <span className="font-semibold text-slate-800">
                {new Date(client.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Client Access Credentials Card */}
        <div className="mt-5 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Acesso à Área do Cliente (Portal)
                  </span>
                  {client.password ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Senha Personalizada
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                      Senha Padrão
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-600 flex-wrap">
                  <span>
                    Login: <strong className="text-slate-800 font-mono">{client.email}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    Senha:{' '}
                    <strong className="text-slate-800 font-mono">
                      {showClientPass ? (client.password || 'cliente123') : '••••••••'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setShowClientPass(!showClientPass)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer ml-0.5"
                      title={showClientPass ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showClientPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const p = client.password || 'cliente123';
                  navigator.clipboard.writeText(`Login: ${client.email}\nSenha: ${p}`);
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedPass ? 'Copiado!' : 'Copiar Dados de Acesso'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Japanese Address Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                〒
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Endereço
                </span>
                <span className="text-[11px] text-slate-500">
                  Formato: Código Postal 〒 → Província → Cidade/Distrito → Bairro/Número → Edifício/Sala
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Copiar endereço formatado"
              >
                {copiedAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar Endereço</span>
                  </>
                )}
              </button>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Abrir localização no Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Google Maps</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Código Postal (〒)</span>
              <span className="font-mono font-semibold text-slate-800">
                {client.postalCode ? `〒${formatJapanesePostalCode(client.postalCode)}` : 'Não informado'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Província</span>
              <span className="font-semibold text-slate-800">
                {client.prefecture || 'Não informado'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Cidade / Distrito</span>
              <span className="font-semibold text-slate-800">
                {client.city || 'Não informado'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">País</span>
              <span className="font-semibold text-slate-800">{client.country || 'Japão'}</span>
            </div>
          </div>

          {(client.address || client.building) && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              {client.address && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Bairro / Chome / Banchi / Número</span>
                  <span className="font-semibold text-slate-800">{client.address}</span>
                </div>
              )}
              {client.building && (
                <div className="sm:ml-6">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Edifício / Sala</span>
                  <span className="font-semibold text-slate-800">{client.building}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200/70 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Endereço Completo Formatado</span>
            <p className="font-medium text-slate-900 select-all">
              {fullJapaneseAddress || 'Nenhum endereço cadastrado'}
            </p>
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
            <span className="font-bold text-slate-700">Observações: </span>
            {client.notes}
          </div>
        )}
      </div>

      {/* Scans Chart for Client */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Desempenho de Acessos do Cliente</h3>
            <p className="text-xs text-slate-500">Métricas agregadas de todos os QR Codes vinculados</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            Total: {totalScans} scans
          </span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="clientGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#clientGradient)"
                name="Scans"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Linked QR Codes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">QR Codes Vinculados</h2>
            <p className="text-xs text-slate-500">
              Gerencie destinos e monitore os códigos específicos deste cliente
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {unassignedQRs.length > 0 && onAssignQR && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUnassignedQRId(unassignedQRs[0]?.id || '');
                  setIsAttachModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                title="Vincular um QR Code avulso a este cliente"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                <span>Vincular QR Avulso ({unassignedQRs.length})</span>
              </button>
            )}

            <button
              onClick={() => onCreateQR(client)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo QR Code</span>
            </button>
          </div>
        </div>

        {qrcodes.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <QrCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Nenhum QR Code vinculado</p>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              Crie o primeiro QR Code dinâmico para este cliente e configure a URL de destino.
            </p>
            <button
              onClick={() => onCreateQR(client)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
            >
              Criar QR Code Agora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qrcodes.map((qr) => (
              <div
                key={qr.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h4
                        onClick={() => onSelectQR(qr)}
                        className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer"
                      >
                        {qr.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          /r/{qr.shortCode}
                        </span>
                        <button
                          onClick={() => handleCopyLink(qr.shortCode, qr.id)}
                          title="Copiar link dinâmico"
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {copiedId === qr.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                        qr.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {qr.status === 'active' ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs mb-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Destino Atual</span>
                    <a
                      href={qr.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-700 hover:text-indigo-600 font-medium truncate block flex items-center gap-1 mt-0.5"
                    >
                      <span className="truncate">{qr.destinationUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>
                      Total Scans: <strong className="text-slate-800">{qr.scanCount}</strong>
                    </span>
                    <span>Tipo: <strong className="capitalize text-slate-700">{qr.type.replace('_', ' ')}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => onQuickChangeUrl(qr)}
                    className="flex-1 py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors text-center"
                  >
                    Alterar Destino
                  </button>
                  <button
                    onClick={() => onDownloadQR(qr)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                    title="Baixar QR Code"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToggleStatusQR(qr.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      qr.status === 'active'
                        ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                        : 'text-slate-400 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={qr.status === 'active' ? 'Pausar QR Code' : 'Ativar QR Code'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  {onAssignQR && (
                    <button
                      type="button"
                      onClick={() => onAssignQR(qr.id, null)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Desvincular deste cliente (Tornar Avulso)"
                    >
                      <Link2Off className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onDeleteQR && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteQR(qr.id, qr.name);
                      }}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Excluir este QR Code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to attach an existing unassigned QR code */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Vincular QR Code Avulso</h3>
                  <p className="text-xs text-slate-500">Para: {client.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Selecione um dos QR Codes independentes do seu acervo para direcionar e vincular a este cliente:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unassignedQRs.map((uqr) => (
                <label
                  key={uqr.id}
                  onClick={() => setSelectedUnassignedQRId(uqr.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedUnassignedQRId === uqr.id
                      ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <QrCode className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{uqr.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        /r/{uqr.shortCode} • {uqr.destinationUrl}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedUnassignedQRId === uqr.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {selectedUnassignedQRId === uqr.id && <Check className="w-2.5 h-2.5" />}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedUnassignedQRId || isAttaching}
                onClick={async () => {
                  if (!selectedUnassignedQRId || !onAssignQR) return;
                  try {
                    setIsAttaching(true);
                    await onAssignQR(selectedUnassignedQRId, client.id);
                    setIsAttachModalOpen(false);
                  } finally {
                    setIsAttaching(false);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isAttaching ? 'Vinculando...' : 'Vincular a Este Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
