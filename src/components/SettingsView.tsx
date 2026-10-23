import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Globe,
  Mail,
  Shield,
  Palette,
  Bell,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  LogOut,
  BarChart3,
  Trash2,
  ShieldCheck,
  Users,
  QrCode,
  Wrench,
} from 'lucide-react';
import type { SystemSettings, UserSession, QRCodeItem, Client } from '../types';
import { ResetAnalyticsModal } from './ResetAnalyticsModal';
import { RestoreSystemModal } from './RestoreSystemModal';
import { RepairAdminModal } from './RepairAdminModal';

interface SettingsViewProps {
  settings: SystemSettings;
  user?: UserSession | null;
  onSaveSettings: (settings: SystemSettings) => Promise<void>;
  onUpdateAdminProfile?: (data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<any>;
  onRepairAdminCredentials?: (data: {
    name?: string;
    email?: string;
    password?: string;
    newPassword?: string;
    resetToDefault?: boolean;
  }) => Promise<any>;
  onLogout?: () => void;
  onResetAnalytics?: (qrCodeId?: string) => Promise<void>;
  onRestoreSystem?: (options: {
    restoreSettings?: boolean;
    clearScans?: boolean;
    clearHistory?: boolean;
  }) => Promise<void>;
  clients?: Client[];
  qrcodes?: QRCodeItem[];
  totalScans?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  user,
  onSaveSettings,
  onUpdateAdminProfile,
  onRepairAdminCredentials,
  onLogout,
  onResetAnalytics,
  onRestoreSystem,
  clients = [],
  qrcodes = [],
  totalScans = 0,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);

  // Admin Profile / Login state
  const [adminName, setAdminName] = useState(user?.name || 'Administrador Master');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin@qrdynamic.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setAdminName(user.name);
      setAdminEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveSettings(formData);

      // Sincroniza também as credenciais do administrador caso tenham sido alteradas no formulário
      const cleanEmail = adminEmail.trim().toLowerCase();
      const cleanName = adminName.trim();
      const hasCredChanges =
        (cleanEmail && cleanEmail !== user?.email?.toLowerCase()) ||
        (cleanName && cleanName !== user?.name) ||
        Boolean(newPassword.trim());

      if (hasCredChanges) {
        if (newPassword && newPassword.length >= 4 && newPassword === confirmPassword) {
          if (onUpdateAdminProfile) {
            await onUpdateAdminProfile({
              name: cleanName,
              email: cleanEmail,
              currentPassword: currentPassword || undefined,
              newPassword: newPassword.trim(),
            });
          }
          setProfileSuccessMsg(`Novas credenciais salvas com sucesso! E-mail de login: ${cleanEmail}`);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else if (!newPassword && (cleanEmail !== user?.email?.toLowerCase() || cleanName !== user?.name)) {
          if (onUpdateAdminProfile) {
            await onUpdateAdminProfile({
              name: cleanName,
              email: cleanEmail,
            });
          }
          setProfileSuccessMsg(`Perfil do Administrador atualizado: ${cleanEmail}`);
        }
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanName = adminName.trim();

    if (!cleanEmail) {
      setProfileErrorMsg('O e-mail de login é obrigatório.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setProfileErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 4) {
        setProfileErrorMsg('A nova senha deve ter no mínimo 4 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileErrorMsg('A confirmação da nova senha não confere com a nova senha digitada.');
        return;
      }
    }

    try {
      setIsUpdatingProfile(true);
      if (onUpdateAdminProfile) {
        await onUpdateAdminProfile({
          name: cleanName || 'Administrador Master',
          email: cleanEmail,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword ? newPassword.trim() : undefined,
        });
      } else {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName || 'Administrador Master',
            email: cleanEmail,
            currentPassword: currentPassword || undefined,
            newPassword: newPassword ? newPassword.trim() : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao atualizar dados de acesso.');
        }
      }

      setProfileSuccessMsg(`Credenciais do Administrador salvas com sucesso! E-mail de login: ${cleanEmail}`);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setProfileSuccessMsg(null), 5000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Erro ao atualizar credenciais.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Configurações do Sistema
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personalize a identidade da plataforma, domínio base de redirecionamento e preferências.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Salvo com Sucesso!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Platform Settings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Identidade da Plataforma</h2>
              <p className="text-[11px] text-slate-500">Nome e contato da sua agência ou empresa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nome da Plataforma
              </label>
              <input
                type="text"
                value={formData.platformName}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Razão Social / Nome da Empresa
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                E-mail de Suporte Administrativo
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Telefone / WhatsApp de Suporte
              </label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Redirect Domain Settings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Domínio Base de Redirecionamento</h2>
              <p className="text-[11px] text-slate-500">URL raiz gravada em todos os QR Codes gerados</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Base URL para Slugs (/r/:shortCode)
            </label>
            <input
              type="text"
              value={formData.baseDomain}
              onChange={(e) => setFormData({ ...formData, baseDomain: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-hidden"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Exemplo de link dinâmico: <span className="font-mono text-indigo-600 font-bold">{formData.baseDomain}/r/meu-slug</span>
            </p>
          </div>
        </div>

        {/* Default QR Code Appearance */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Padrões de Estilo para Novos QR Codes</h2>
              <p className="text-[11px] text-slate-500">Cores padrão aplicadas quando um novo código for iniciado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cor Padrão dos Módulos
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.defaultQrColor}
                  onChange={(e) => setFormData({ ...formData, defaultQrColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={formData.defaultQrColor}
                  onChange={(e) => setFormData({ ...formData, defaultQrColor: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cor Padrão do Fundo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.defaultBgColor}
                  onChange={(e) => setFormData({ ...formData, defaultBgColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={formData.defaultBgColor}
                  onChange={(e) => setFormData({ ...formData, defaultBgColor: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Administration & Security - Change Login & Password */}
        <div id="admin-credentials-card" className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Acesso & Credenciais do Administrador</h2>
                <p className="text-[11px] text-slate-500">
                  Altere o seu e-mail de login, nome de exibição e senha de acesso à plataforma
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="btn-open-repair-modal"
                onClick={() => setIsRepairModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Reparar / Redefinir Acesso</span>
              </button>
              <span className="self-start sm:self-auto px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Nível Master • Administrador
              </span>
            </div>
          </div>

          {/* Feedback messages */}
          {profileSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Credenciais Atualizadas!</p>
                <p className="mt-0.5">{profileSuccessMsg}</p>
              </div>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Atenção ao alterar dados</p>
                <p className="mt-0.5">{profileErrorMsg}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome do Administrador
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
                  />
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail de Login do Administrador
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Utilize este e-mail na tela de login para acessar o painel.
                </p>
              </div>
            </div>

            {/* Password modification block */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">Alterar Senha de Acesso (Opcional)</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  — deixe em branco para manter a senha atual
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Senha atual (ex: admin123)"
                      className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Credenciais salvas de forma persistente. <strong>Clientes e QR codes criados nunca são alterados nem removidos por reparos.</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsRepairModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reparar sem Senha Antiga</span>
                </button>

                <button
                  id="btn-save-admin-credentials"
                  type="button"
                  onClick={handleUpdateCredentials}
                  disabled={isUpdatingProfile}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isUpdatingProfile ? 'Salvando...' : 'Salvar Novas Credenciais'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sessão Ativa & Logout */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Sessão Ativa no Sistema</h3>
                <p className="text-xs text-slate-500">
                  Gerencie o acesso atual e encerre a sessão com segurança
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                id="btn-settings-logout"
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all border border-rose-200/70 shadow-2xs cursor-pointer active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sair do Sistema</span>
              </button>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{user?.name || 'Administrador Master'}</p>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Ativo Agora
                  </span>
                </div>
                <p className="text-xs text-slate-500">{user?.email || 'admin@qrdynamic.com'}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-xs sm:text-right">
              Ao sair, seu token de autenticação local será excluído e você será redirecionado para a tela de login.
            </p>
          </div>
        </div>

        {/* Zona de Restauração do Sistema com Preservação de Dados */}
        <div className="bg-white rounded-3xl p-6 border border-indigo-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Restauração do Sistema</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] tracking-wide uppercase inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Proteção Ativa
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Restaurar configurações da plataforma com preservação integral de clientes e QR codes
                </p>
              </div>
            </div>

            {onRestoreSystem && (
              <button
                id="btn-settings-restore-system"
                type="button"
                onClick={() => setIsRestoreModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-[0.99]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Sistema</span>
              </button>
            )}
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-emerald-950 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950">
                  Regra de segurança do sistema:
                </p>
                <p className="text-emerald-800 mt-0.5">
                  <strong>Clientes, logotipos e QR Codes criados NÃO são alterados quando o sistema for restaurado.</strong> Todos os cadastros legítimos ({clients.length} clientes reais), seus respectivos logos, senhas e códigos dinâmicos ({qrcodes.length} QR Codes) continuam intactos. Nenhum cliente fictício é incluído.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Zona de Manutenção & Reset de Dados de Análise */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Manutenção & Dados de Análise</h3>
                <p className="text-xs text-slate-500">
                  Zerar estatísticas, histórico de leituras e métricas geográficas
                </p>
              </div>
            </div>

            {onResetAnalytics && (
              <button
                id="btn-settings-reset-analytics"
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-amber-600/20 cursor-pointer active:scale-[0.99]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resetar Dados de Análise</span>
              </button>
            )}
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
              <BarChart3 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">
                  Atenção sobre a limpeza de métricas:
                </p>
                <p className="text-amber-800 mt-0.5">
                  Esta opção limpa permanentemente todos os registros de acessos coletados (scans, cidades, dispositivos e navegadores). Seus clientes, QR codes cadastrados, configurações visuais e links de redirecionamento continuarão funcionando normalmente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Modal de restauração segura do sistema */}
      <RestoreSystemModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={async (options) => {
          if (onRestoreSystem) {
            await onRestoreSystem(options);
          }
        }}
        clientsCount={clients.length}
        qrcodesCount={qrcodes.length}
      />

      {/* Modal de confirmação de reset de dados de análise */}
      <ResetAnalyticsModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={async (qrCodeId) => {
          if (onResetAnalytics) {
            await onResetAnalytics(qrCodeId);
          }
        }}
        qrcodes={qrcodes}
        selectedQRId="all"
        totalScansCount={totalScans}
      />

      {/* Modal de reparação e definição de novas credenciais do administrador */}
      <RepairAdminModal
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
        currentEmail={adminEmail}
        currentName={adminName}
        onSuccess={(updatedAdmin, newPass) => {
          setAdminName(updatedAdmin.name);
          setAdminEmail(updatedAdmin.email);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setProfileSuccessMsg(
            `Novas credenciais salvas com sucesso! E-mail: ${updatedAdmin.email}${newPass ? ` | Nova senha definida` : ''}`
          );
        }}
      />
    </div>
  );
};
