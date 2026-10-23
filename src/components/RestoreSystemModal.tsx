import React, { useState } from 'react';
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertCircle,
  Users,
  QrCode,
  Settings,
  Sparkles,
} from 'lucide-react';
import type { Client, QRCodeItem } from '../types';

interface RestoreSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {
    restoreSettings?: boolean;
    clearScans?: boolean;
    clearHistory?: boolean;
  }) => Promise<void>;
  clientsCount: number;
  qrcodesCount: number;
}

export const RestoreSystemModal: React.FC<RestoreSystemModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  clientsCount,
  qrcodesCount,
}) => {
  const [restoreSettings, setRestoreSettings] = useState(true);
  const [clearHistory, setClearHistory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExecuteRestore = async () => {
    try {
      setIsProcessing(true);
      await onConfirm({
        restoreSettings,
        clearScans: false,
        clearHistory,
      });
      onClose();
    } catch (err) {
      console.error('Falha ao restaurar sistema:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="restore-system-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Restaurar Sistema</h3>
              <p className="text-xs text-slate-500">
                Redefinir configurações mantendo seus clientes e QR codes protegidos
              </p>
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
          {/* Main Guarantee Banner */}
          <div className="p-4 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl space-y-2.5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Garantia de Preservação Total
                </h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  <strong>Clientes, logotipos e QR Codes criados NÃO serão alterados quando o sistema for restaurado.</strong> Todas as contas reais, logos das empresas, senhas personalizadas, URLs de destino e personalizações continuarão intactos. <strong>Nenhum cliente fictício é inserido no sistema.</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{clientsCount} Clientes Reais Intactos</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>{qrcodesCount} QR Codes Intactos</span>
              </div>
            </div>
          </div>

          {/* Detailed Items What Will NOT be changed */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Garantia de integridade (NÃO sofrerá alteração):
            </label>
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs space-y-2 text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Logotipos & Cadastros:</strong> Logos de clientes, empresas, e-mails, senhas e contatos permanecem 100% preservados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Sem clientes fictícios:</strong> Apenas os clientes reais criados pelo administrador são mantidos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>QR Codes criados:</strong> Nomes, URLs de destino, códigos curtos, contadores e estilos permanecem inalterados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Redirecionamento dinâmico:</strong> Continua ativo e funcional sem qualquer interrupção de serviço</span>
              </div>
            </div>
          </div>

          {/* Options of restoration */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              O que pode ser restaurado (Configurações da Plataforma):
            </label>

            {/* Option 1: System platform settings */}
            <label className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-2xl hover:bg-slate-50/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={restoreSettings}
                onChange={(e) => setRestoreSettings(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">
                  Restaurar configurações visuais e preferências da plataforma
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Restaura o tema, margem padrão, cor de destaque e parâmetros da plataforma para o padrão de fábrica (sem afetar clientes ou QR codes).
                </span>
              </div>
            </label>

            {/* Option 2: Reset history logs */}
            <label className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-2xl hover:bg-slate-50/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={clearHistory}
                onChange={(e) => setClearHistory(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">
                  Reiniciar logs do histórico de auditoria (Opcional)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Inicia um registro de auditoria limpo após a restauração, registrando o marco de restauração segura.
                </span>
              </div>
            </label>
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
            id="btn-confirm-restore-system"
            type="button"
            onClick={handleExecuteRestore}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Restaurando...' : 'Confirmar Restauração'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
