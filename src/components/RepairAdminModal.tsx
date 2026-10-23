import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Lock,
  User,
  KeyRound,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../api';

interface RepairAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string;
  currentName?: string;
  onSuccess?: (adminUser: { id: string; name: string; email: string }, newPassword?: string) => void;
}

export const RepairAdminModal: React.FC<RepairAdminModalProps> = ({
  isOpen,
  onClose,
  currentEmail = 'admin@qrdynamic.com',
  currentName = 'Administrador Master',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'default'>('custom');
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    name: string;
    email: string;
    password?: string;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCredentials = () => {
    if (!successInfo) return;
    const text = `Credenciais do Administrador:\nE-mail: ${successInfo.email}\nSenha: ${successInfo.password || 'admin123'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRepairCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setErrorMsg('Informe o e-mail do administrador.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMsg('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (cleanPass !== confirmPassword.trim()) {
      setErrorMsg('A confirmação da nova senha não coincide com a nova senha digitada.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.repairAdminCredentials({
        name: name.trim() || 'Administrador Master',
        email: cleanEmail,
        newPassword: cleanPass,
        resetToDefault: false,
      });

      setSuccessInfo({
        name: res.admin.name,
        email: res.admin.email,
        password: cleanPass,
        message: res.message || 'Novas credenciais de Administrador salvas com sucesso no servidor e no banco persistente!',
      });

      if (onSuccess) {
        onSuccess(res.admin, cleanPass);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao reparar credenciais de administrador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepairDefault = async () => {
    setErrorMsg(null);
    try {
      setIsSubmitting(true);
      const res = await api.repairAdminCredentials({
        resetToDefault: true,
      });

      setSuccessInfo({
        name: 'Administrador Master',
        email: 'admin@qrdynamic.com',
        password: 'admin123',
        message: 'Credenciais restauradas com sucesso para o padrão mestre (admin@qrdynamic.com / admin123)!',
      });

      if (onSuccess) {
        onSuccess(res.admin, 'admin123');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao restaurar credenciais para o padrão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onClose();
    setSuccessInfo(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Reparar Credenciais do Administrador
              </h3>
              <p className="text-xs text-slate-300">
                Redefinir e salvar novos dados de acesso sem bloqueios
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successInfo ? (
            /* Success confirmation screen */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">Credenciais Salvas com Sucesso!</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">{successInfo.message}</p>
                  </div>
                </div>

                <div className="bg-white/80 rounded-xl p-3 border border-emerald-200/60 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nome:</span>
                    <span className="font-bold text-slate-800">{successInfo.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">E-mail:</span>
                    <span className="font-bold text-indigo-700">{successInfo.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Senha:</span>
                    <span className="font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {successInfo.password || 'admin123'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Credenciais</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
              >
                Concluir & Fechar
              </button>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('custom');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'custom'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Definir Novos Dados</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('default');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'default'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão Master</span>
                </button>
              </div>

              {/* Error feedback */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeTab === 'custom' ? (
                <form onSubmit={handleRepairCustom} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-xs text-emerald-950 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-900">Garantia de Preservação Total</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Esta ferramenta repara e salva novas credenciais sem exigir a senha antiga. <strong>Nenhum cliente ou QR Code criado pelo administrador será alterado ou removido.</strong>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nome do Administrador
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Administrador Master ou seu Nome"
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Novo E-mail de Login
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nova Senha
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 4 caracteres"
                          className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <KeyRound className="w-4 h-4 text-amber-300" />
                      <span>{isSubmitting ? 'Salvando...' : 'Salvar Novas Credenciais'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      Restaurar Credenciais Padrão do Sistema
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      Esta ação redefine as credenciais do Administrador Master para os valores originais seguros:
                    </p>
                    <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80 font-mono text-[11px] space-y-1 text-slate-800">
                      <div>E-mail: <strong>admin@qrdynamic.com</strong></div>
                      <div>Senha: <strong>admin123</strong></div>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Nenhum cliente, QR Code ou link dinâmico é alterado durante este processo.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleRepairDefault}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isSubmitting ? 'Restaurando...' : 'Restaurar para Padrão (admin123)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
