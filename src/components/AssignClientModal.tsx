import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  QrCode,
  UserCheck,
  UserX,
  Search,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { QRCodeItem, Client } from '../types';

interface AssignClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  qr: QRCodeItem | null;
  clients: Client[];
  onAssign: (qrId: string, clientId: string | null) => Promise<void>;
}

export const AssignClientModal: React.FC<AssignClientModalProps> = ({
  isOpen,
  onClose,
  qr,
  clients,
  onAssign,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [searchClient, setSearchClient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (qr) {
      setSelectedClientId(qr.clientId || '');
      setSearchClient('');
      setErrorMsg('');
    }
  }, [qr, isOpen]);

  if (!isOpen || !qr) return null;

  const currentClient = clients.find((c) => c.id === qr.clientId);
  const isUnassigned = !qr.clientId || qr.clientId.trim() === '';

  const filteredClients = clients.filter((c) => {
    const term = searchClient.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.contactPerson.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onAssign(qr.id, selectedClientId ? selectedClientId : null);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atribuir cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isUnassigned ? 'Direcionar QR Code para Cliente' : 'Alterar Cliente Responsável'}
              </h3>
              <p className="text-xs text-slate-500">
                Vincule este QR Code a um cliente parceiro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* QR Code summary card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 truncate">{qr.name}</p>
                <span className="text-[10px] font-mono bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded-md font-semibold">
                  /r/{qr.shortCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Destino: {qr.destinationUrl}
              </p>
            </div>
          </div>

          {/* Current Status banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-xs">
            <span className="text-slate-600">Status de Vínculo Atual:</span>
            {isUnassigned ? (
              <span className="font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <UserX className="w-3.5 h-3.5" />
                Avulso (Sem Cliente)
              </span>
            ) : (
              <span className="font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 truncate max-w-[200px]">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{currentClient?.name || qr.clientName}</span>
              </span>
            )}
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Selecione o Cliente Destino:
            </label>

            {/* Quick search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar clientes por nome ou cidade..."
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Radio options list */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
              {/* Option to keep or set as Unassigned */}
              <label
                onClick={() => setSelectedClientId('')}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  selectedClientId === ''
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-semibold shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-100/70 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedClientId === '' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {selectedClientId === '' && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5 text-amber-600" />
                      Manter como QR Code Avulso (Sem Cliente)
                    </p>
                    <p className="text-[11px] text-amber-700/80">
                      Disponível no acervo geral para vincular futuramente
                    </p>
                  </div>
                </div>
              </label>

              {/* Client items */}
              {filteredClients.map((c) => {
                const isSelected = selectedClientId === c.id;
                return (
                  <label
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                          isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {c.contactPerson} {c.city ? `• ${c.city}` : ''}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Reassurance note */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Impacto nos Códigos Impressos:</strong> O endereço do QR Code (<code>/r/{qr.shortCode}</code>) e o destino permanecem idênticos. O cliente receberá acesso imediato às métricas em sua respectiva Área do Cliente.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar Vínculo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
