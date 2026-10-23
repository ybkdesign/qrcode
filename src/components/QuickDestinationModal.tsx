import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Sparkles, ExternalLink, Link as LinkIcon, Check, Lock, Unlock } from 'lucide-react';
import type { QRCodeItem } from '../types';

interface QuickDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  qr: QRCodeItem | null;
  onSave: (id: string, newDestinationUrl: string) => Promise<void>;
}

export const QuickDestinationModal: React.FC<QuickDestinationModalProps> = ({
  isOpen,
  onClose,
  qr,
  onSave,
}) => {
  const [protocol, setProtocol] = useState<'https://' | 'http://'>('https://');
  const [rawUrl, setRawUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (qr && isOpen) {
      const dest = qr.destinationUrl || '';
      if (dest.startsWith('http://')) {
        setProtocol('http://');
        setRawUrl(dest.slice(7));
      } else if (dest.startsWith('https://')) {
        setProtocol('https://');
        setRawUrl(dest.slice(8));
      } else {
        setProtocol('https://');
        setRawUrl(dest);
      }
      setErrorMsg('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [qr, isOpen]);

  if (!isOpen || !qr) return null;

  const handleUrlChange = (val: string) => {
    let clean = val;
    let newProto = protocol;
    if (clean.startsWith('http://')) {
      newProto = 'http://';
      clean = clean.slice(7);
      setProtocol('http://');
    } else if (clean.startsWith('https://')) {
      newProto = 'https://';
      clean = clean.slice(8);
      setProtocol('https://');
    }
    setRawUrl(clean);
  };

  const handleProtocolToggle = (newProto: 'https://' | 'http://') => {
    setProtocol(newProto);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = rawUrl.trim();

    if (!finalUrl) {
      setErrorMsg('Informe a nova URL de destino.');
      inputRef.current?.focus();
      return;
    }

    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `${protocol}${finalUrl}`;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave(qr.id, finalUrl);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar destino.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Alterar Destino Dinâmico
              </h2>
              <p className="text-xs text-slate-500">
                Altere o destino instantaneamente sem precisar reimprimir o QR Code.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-bold text-indigo-950">QR Code: {qr.name}</p>
              <p className="text-slate-600">
                Cliente: <span className="font-semibold">{qr.clientName || 'Cliente'}</span> • Slug: <span className="font-mono text-indigo-700 font-bold">/r/{qr.shortCode}</span>
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nova URL de Destino
              </label>
              {/* Protocol Quick Switch */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleProtocolToggle('https://')}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-bold transition-all border ${
                    protocol === 'https://'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Usar protocolo seguro HTTPS"
                >
                  https://
                </button>
                <button
                  type="button"
                  onClick={() => handleProtocolToggle('http://')}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-bold transition-all border ${
                    protocol === 'http://'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Usar protocolo HTTP"
                >
                  http://
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Todas as próximas leituras serão encaminhadas para este novo endereço (o protocolo https:// é editável).
            </p>

            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
              {/* Protocol Button */}
              <button
                type="button"
                onClick={() => handleProtocolToggle(protocol === 'https://' ? 'http://' : 'https://')}
                className={`px-3 py-2.5 text-xs font-mono font-bold select-none border-r border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  protocol === 'https://'
                    ? 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/80'
                    : 'bg-amber-50/80 text-amber-800 hover:bg-amber-100/80'
                }`}
                title="Clique para alternar entre HTTPS e HTTP"
              >
                {protocol === 'https://' ? (
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{protocol}</span>
              </button>

              <input
                ref={inputRef}
                type="text"
                inputMode="url"
                required
                placeholder="exemplo.com.br/novo-link"
                value={rawUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-transparent outline-hidden font-mono text-slate-800 placeholder:text-slate-400"
              />

              {rawUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setRawUrl('');
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 text-slate-400 hover:text-slate-600 text-xs transition-colors shrink-0"
                  title="Limpar link"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
              <span className="truncate">
                Destino final: <strong className="font-mono text-indigo-600 font-semibold">{protocol}{rawUrl || '...'}</strong>
              </span>
              <span className="shrink-0 text-slate-400">
                {protocol === 'https://' ? '🔒 HTTPS Seguro' : '⚠️ HTTP'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span>Redirecionamento HTTP 302 com atualização imediata sem reimpressão.</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Atualizando...' : 'Salvar Novo Destino'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
