import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, QrCode, BarChart3 } from 'lucide-react';
import type { QRCodeItem } from '../types';

interface ResetAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (qrCodeId?: string) => Promise<void>;
  qrcodes: QRCodeItem[];
  selectedQRId?: string;
  totalScansCount: number;
}

export const ResetAnalyticsModal: React.FC<ResetAnalyticsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  qrcodes,
  selectedQRId,
  totalScansCount,
}) => {
  const [scope, setScope] = useState<'all' | 'single'>(
    selectedQRId && selectedQRId !== 'all' ? 'single' : 'all'
  );
  const [targetQRId, setTargetQRId] = useState<string>(
    selectedQRId && selectedQRId !== 'all' ? selectedQRId : qrcodes[0]?.id || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const targetQR = qrcodes.find((q) => q.id === targetQRId);
  const affectedScans =
    scope === 'all'
      ? totalScansCount
      : targetQR?.scanCount || 0;

  const handleExecuteReset = async () => {
    try {
      setIsProcessing(true);
      await onConfirm(scope === 'all' ? undefined : targetQRId);
      onClose();
    } catch (err) {
      console.error('Falha ao resetar métricas:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="reset-analytics-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Resetar Dados de Análise</h3>
              <p className="text-xs text-slate-500">Zerar histórico e métricas de acessos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Alcance do Reset
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className={`w-4 h-4 ${scope === 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs sm:text-sm">Todo o Sistema</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Zerar estatísticas de todos os QR Codes e clientes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('single')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  scope === 'single'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <QrCode className={`w-4 h-4 ${scope === 'single' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs sm:text-sm">QR Code Específico</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Zerar apenas as métricas de um QR Code selecionado.
                </p>
              </button>
            </div>
          </div>

          {/* Single QR Picker if single scope */}
          {scope === 'single' && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-xs font-semibold text-slate-700">
                Selecione o QR Code para zerar:
              </label>
              <select
                value={targetQRId}
                onChange={(e) => setTargetQRId(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden font-medium text-slate-800"
              >
                {qrcodes.map((qr) => (
                  <option key={qr.id} value={qr.id}>
                    {qr.name} ({qr.clientName || 'Sem cliente'}) — {qr.scanCount} scans
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Information & Impact summary */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold">O que será resetado:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                  <li>
                    Aproximadamente{' '}
                    <strong className="font-semibold text-amber-950">
                      {affectedScans.toLocaleString('pt-BR')} registros de acessos (scans)
                    </strong>{' '}
                    serão apagados.
                  </li>
                  <li>
                    Os contadores de leituras por cidade, mapa GPS, dispositivos e navegadores voltarão a zero.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/50 text-[11px] text-emerald-800 font-medium">
              ✓ Seus QR Codes, links de destino, clientes e imagens continuam intactos e funcionando normalmente.
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-reset-analytics"
            type="button"
            onClick={handleExecuteReset}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-colors shadow-sm shadow-amber-600/20 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Resetando dados...' : 'Sim, Resetar Dados'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
