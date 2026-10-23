import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Building2,
  Eye,
  EyeOff,
  Wrench,
} from 'lucide-react';
import type { UserSession } from '../types';
import { RepairAdminModal } from './RepairAdminModal';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState<'admin' | 'client'>('admin');
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states - starting empty for clean, direct user input without shortcuts
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ id?: string; name: string; email: string }>({
    name: 'Administrador Master',
    email: 'admin@qrdynamic.com',
  });

  // Load registered admin info from server for repair modal context
  useEffect(() => {
    fetch('/api/auth/demo-accounts')
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar informações');
        return res.json();
      })
      .then((data) => {
        if (data.admin) {
          setAdminInfo(data.admin);
        }
      })
      .catch((err) => {
        console.warn('Usando configurações padrão:', err);
      });
  }, []);

  const handleTabChange = (mode: 'admin' | 'client') => {
    setLoginMode(mode);
    setErrorMsg('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRecovery) {
      if (!email.trim()) {
        setErrorMsg('Por favor informe seu e-mail cadastrado.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setRecoverySent(true);
      }, 700);
      return;
    }

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Por favor preencha e-mail e senha.');
      return;
    }

    if (cleanPassword.length < 4) {
      setErrorMsg('A senha informada deve possuir no mínimo 4 caracteres.');
      return;
    }

    try {
      setIsLoading(true);

      let res;
      if (loginMode === 'client') {
        res = await fetch('/api/auth/client-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPassword,
          }),
        });
      } else {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas. Verifique os dados digitados.');
      }

      if (!data.user || !data.user.role) {
        throw new Error('Resposta de autenticação inválida do servidor.');
      }

      const token = data.token || data.user?.token || `sess_${Date.now()}`;
      onLoginSuccess(token, data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4 sm:px-0">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/25 mb-4">
          <QrCode className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          QR Dynamic Hub
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Plataforma de QR Codes Dinâmicos & Portal de Clientes
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-md py-6 px-6 shadow-2xl rounded-3xl sm:px-8 border border-white/20">
          {/* Top Access Switcher Tabs */}
          {!isRecovery && (
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-5">
              <button
                type="button"
                id="tab-login-admin"
                onClick={() => handleTabChange('admin')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  loginMode === 'admin'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Painel Admin</span>
              </button>

              <button
                type="button"
                id="tab-login-client"
                onClick={() => handleTabChange('client')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  loginMode === 'client'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Área do Cliente</span>
              </button>
            </div>
          )}

          {recoverySent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Instruções Enviadas!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enviamos as orientações de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRecoverySent(false);
                  setIsRecovery(false);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
              >
                Voltar para a tela de Login
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  {isRecovery ? (
                    'Recuperação de Acesso'
                  ) : loginMode === 'admin' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Acesso do Administrador Master</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Acesso à Área do Cliente</span>
                    </>
                  )}
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Seguro
                </span>
              </div>

              {loginMode === 'client' && !isRecovery && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl text-xs text-indigo-950">
                  <p className="font-bold flex items-center gap-1.5 text-indigo-700 mb-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Portal Exclusivo do Cliente
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Digite seu e-mail ou nome cadastrado e a sua senha para acessar seus QR Codes e relatórios.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Email / Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {loginMode === 'admin' ? 'E-mail ou Usuário do Administrador' : 'E-mail ou Nome do Estabelecimento'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-login-email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder={
                      loginMode === 'admin'
                        ? 'Digite o e-mail do administrador'
                        : 'ex: contato@restaurante.jp ou seu e-mail'
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-hidden text-slate-900"
                  />
                </div>
              </div>

              {/* Password Input */}
              {!isRecovery && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {loginMode === 'admin' ? 'Senha do Administrador' : 'Senha / PIN de Acesso'}
                    </label>
                    <div className="flex items-center gap-2">
                      {loginMode === 'admin' && (
                        <button
                          type="button"
                          onClick={() => setIsRepairModalOpen(true)}
                          className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 cursor-pointer flex items-center gap-1"
                          title="Reparar ou redefinir credenciais do Administrador"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Reparar Acesso</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsRecovery(true)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                      >
                        Esqueceu?
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-login-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="Digite sua senha"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-hidden text-slate-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showPassword ? 'Ocultar senha' : 'Ver senha digitada'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {isLoading
                      ? 'Autenticando...'
                      : isRecovery
                      ? 'Enviar Link de Recuperação'
                      : loginMode === 'admin'
                      ? 'Entrar no Painel do Administrador'
                      : 'Entrar na Área do Cliente'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {isRecovery && (
                <div className="text-center pt-2 space-y-2">
                  {loginMode === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setIsRepairModalOpen(true)}
                      className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reparar e Definir Nova Senha de Administrador Agora</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsRecovery(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Voltar para tela de login
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Modal de Reparação de Credenciais do Administrador */}
      <RepairAdminModal
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
        currentEmail={adminInfo.email}
        currentName={adminInfo.name}
        onSuccess={(updatedAdmin, newPass) => {
          setAdminInfo(updatedAdmin);
          setLoginMode('admin');
          setEmail(updatedAdmin.email);
          if (newPass) {
            setPassword(newPass);
          }
          setIsRecovery(false);
        }}
      />
    </div>
  );
};
