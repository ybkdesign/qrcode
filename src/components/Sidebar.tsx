import React from 'react';
import {
  LayoutDashboard,
  Users,
  QrCode,
  BarChart3,
  History,
  Settings,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react';
import type { SystemSettings, UserSession } from '../types';

export type NavItem = 'dashboard' | 'clients' | 'qrcodes' | 'analytics' | 'history' | 'settings' | 'client_detail' | 'client_portal';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: any) => void;
  settings?: SystemSettings;
  user?: UserSession | null;
  onLogout: () => void;
  isMobileOpen?: boolean;
  mobileMenuOpen?: boolean;
  onCloseMobile?: () => void;
  onCloseMobileMenu?: () => void;
  totalActiveQRs?: number;
  activeQRCodesCount?: number;
  totalClientsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  settings,
  user,
  onLogout,
  isMobileOpen,
  mobileMenuOpen,
  onCloseMobile,
  onCloseMobileMenu,
  totalActiveQRs,
  activeQRCodesCount,
}) => {
  const isOpen = Boolean(isMobileOpen ?? mobileMenuOpen);
  const handleClose = onCloseMobile || onCloseMobileMenu || (() => {});
  const activeQRs = totalActiveQRs ?? activeQRCodesCount ?? 0;

  const navItems = [
    { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as NavItem, label: 'Clientes', icon: Users },
    { id: 'client_portal' as NavItem, label: 'Área do Cliente', icon: Building2 },
    { id: 'qrcodes' as NavItem, label: 'QR Codes', icon: QrCode, badge: activeQRs },
    { id: 'analytics' as NavItem, label: 'Analytics & Scans', icon: BarChart3 },
    { id: 'history' as NavItem, label: 'Histórico & Logs', icon: History },
    { id: 'settings' as NavItem, label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base leading-tight tracking-tight">
                {settings?.platformName || 'QR Dynamic'}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Plataforma SaaS Pro
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            id="btn-close-mobile-menu"
            type="button"
            onClick={handleClose}
            className="p-2 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl lg:hidden transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Engine Pill */}
        <div className="px-4 pt-4">
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-xs font-semibold text-slate-700">Roteamento Dinâmico</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              302 Ativo
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  handleClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Pro Tip Card */}
        <div className="p-4 mx-3 mb-3 bg-gradient-to-br from-indigo-50/80 to-violet-50/50 border border-indigo-100 rounded-2xl">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Sem Reimpressão</p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Altere o destino do QR Code em tempo real sem precisar gerar novo arquivo.
              </p>
            </div>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                onNavigate('settings');
                if (onCloseMobile) onCloseMobile();
                if (onCloseMobileMenu) onCloseMobileMenu();
              }}
              title="Clique para alterar credenciais de login e configurações"
              className="flex items-center gap-2.5 overflow-hidden text-left hover:opacity-80 transition-opacity cursor-pointer group flex-1 mr-1"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {user?.name || 'Administrador'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@qrdynamic.com'}</p>
              </div>
            </button>
            <button
              id="btn-sidebar-quick-logout"
              title="Sair do painel"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-logout"
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/70 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
            title="Encerrar sessão de acesso"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};
