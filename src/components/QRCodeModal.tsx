import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Globe,
  Instagram,
  Phone,
  Facebook,
  Video,
  Youtube,
  MapPin,
  Link as LinkIcon,
  FileText,
  Utensils,
  Palette,
  Sliders,
  Sparkles,
  Check,
  Smartphone,
  ExternalLink,
  Lock,
  Unlock,
  Edit2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import type { QRCodeItem, Client, QRCodeType, QRStyleConfig } from '../types';
import { renderQRCodeToCanvas } from '../utils/qrGenerator';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (qrData: Partial<QRCodeItem>) => Promise<void>;
  onDeleteQR?: (id: string, name: string) => void;
  editingQR: QRCodeItem | null;
  clients: Client[];
  initialClientId?: string;
}

const QR_TYPES: { id: QRCodeType; label: string; icon: any; placeholder: string; prefix?: string }[] = [
  { id: 'website', label: 'Website', icon: Globe, placeholder: 'https://seusite.com.br' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/perfil' },
  { id: 'whatsapp', label: 'WhatsApp', icon: Phone, placeholder: 'https://wa.me/5511999999999' },
  { id: 'digital_menu', label: 'Menu Digital', icon: Utensils, placeholder: 'https://menu.restaurante.com/cardapio' },
  { id: 'google_maps', label: 'Google Maps', icon: MapPin, placeholder: 'https://maps.google.com/?q=local' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/watch?v=video' },
  { id: 'tiktok', label: 'TikTok', icon: Video, placeholder: 'https://tiktok.com/@usuario' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/pagina' },
  { id: 'link_page', label: 'Página de Links', icon: LinkIcon, placeholder: 'https://linktree.com/seulink' },
  { id: 'pdf', label: 'PDF / Documento', icon: FileText, placeholder: 'https://documento.drive.com/arquivo.pdf' },
  { id: 'custom_link', label: 'Link Personalizado', icon: LinkIcon, placeholder: 'https://qualquer-url.com' },
];

const PRESET_COLORS = [
  { name: 'Preto Slate', fg: '#0f172a', bg: '#ffffff' },
  { name: 'Índigo Real', fg: '#4338ca', bg: '#ffffff' },
  { name: 'Esmeralda Pro', fg: '#047857', bg: '#ffffff' },
  { name: 'Rosa Instagram', fg: '#be185d', bg: '#ffffff' },
  { name: 'Azul Marinho', fg: '#1e3a8a', bg: '#ffffff' },
  { name: 'Âmbar Premium', fg: '#78350f', bg: '#fef3c7' },
];

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDeleteQR,
  editingQR,
  clients,
  initialClientId,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'client' | 'style'>('content');
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [type, setType] = useState<QRCodeType>('website');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [protocol, setProtocol] = useState<'https://' | 'http://'>('https://');
  const [rawUrl, setRawUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const urlInputRef = useRef<HTMLInputElement>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp specific helper fields
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');

  // Style state
  const [style, setStyle] = useState<QRStyleConfig>({
    foregroundColor: '#0f172a',
    backgroundColor: '#ffffff',
    dotType: 'rounded',
    eyeFrame: 'rounded',
    eyeBall: 'rounded',
    margin: 2,
    size: 512,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrLogoInputRef = useRef<HTMLInputElement>(null);

  const handleQRLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
      if (isSvg) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const res = ev.target?.result as string;
          setStyle((prev) => ({ ...prev, logoUrl: res, logoSize: prev.logoSize || 22 }));
        };
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/png', 0.95);
            setStyle((prev) => ({ ...prev, logoUrl: dataUrl, logoSize: prev.logoSize || 22 }));
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Erro ao processar imagem para QR:', err);
    }
  };

  // Sync state when modal opens or editingQR changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingQR) {
      setName(editingQR.name);
      setClientId(editingQR.clientId);
      setType(editingQR.type);
      setDestinationUrl(editingQR.destinationUrl);
      
      const dest = editingQR.destinationUrl || '';
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

      setShortCode(editingQR.shortCode);
      setNotes(editingQR.notes || '');
      setStatus(editingQR.status);
      const baseStyle = editingQR.style || {
        foregroundColor: '#0f172a',
        backgroundColor: '#ffffff',
        dotType: 'rounded',
        eyeFrame: 'rounded',
        eyeBall: 'rounded',
        margin: 2,
        size: 512,
      };
      // Não colocar logo nos QR codes por padrão
      const cleanStyle = { ...baseStyle };
      delete cleanStyle.logoUrl;
      delete cleanStyle.logoSize;
      setStyle(cleanStyle);
    } else {
      setName('');
      setClientId(initialClientId || '');
      setType('website');
      setProtocol('https://');
      setRawUrl('');
      setDestinationUrl('https://');
      const randomSlug = Math.random().toString(36).substring(2, 8);
      setShortCode(randomSlug);
      setNotes('');
      setStatus('active');
      setStyle({
        foregroundColor: '#0f172a',
        backgroundColor: '#ffffff',
        dotType: 'rounded',
        eyeFrame: 'rounded',
        eyeBall: 'rounded',
        margin: 2,
        size: 512,
      });
      setWaPhone('');
      setWaMessage('');
    }
    setActiveTab('content');
    setErrorMsg('');
  }, [isOpen, editingQR, initialClientId, clients]);

  // Handle URL input changes cleanly
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
    setDestinationUrl(clean.trim() ? `${newProto}${clean.trim()}` : '');
  };

  const handleProtocolToggle = (newProto: 'https://' | 'http://') => {
    setProtocol(newProto);
    setDestinationUrl(rawUrl.trim() ? `${newProto}${rawUrl.trim()}` : newProto);
  };

  // If type is WhatsApp, assemble destination URL automatically
  const handleWaPhoneChange = (val: string) => {
    setWaPhone(val);
    const cleanPhone = val.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(waMessage);
    const sub = `wa.me/${cleanPhone}${waMessage ? `?text=${encodedMsg}` : ''}`;
    setProtocol('https://');
    setRawUrl(sub);
    setDestinationUrl(`https://${sub}`);
  };

  const handleWaMsgChange = (val: string) => {
    setWaMessage(val);
    const cleanPhone = waPhone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(val);
    const sub = `wa.me/${cleanPhone}${val ? `?text=${encodedMsg}` : ''}`;
    setProtocol('https://');
    setRawUrl(sub);
    setDestinationUrl(`https://${sub}`);
  };

  // Preview dynamic URL text to render in QR
  const livePreviewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${shortCode || 'exemplo'}`
    : `https://qrdynamic.app/r/${shortCode || 'exemplo'}`;

  // Update canvas preview
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    renderQRCodeToCanvas({
      text: livePreviewUrl,
      style,
      canvas: canvasRef.current,
      targetSize: 280,
    });
  }, [isOpen, livePreviewUrl, style]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Resolve final destination URL cleanly
    let cleanUrl = rawUrl.trim();
    if (!cleanUrl) {
      cleanUrl = destinationUrl.trim();
    }
    // Clean redundant protocol prefixes
    cleanUrl = cleanUrl.replace(/^https?:\/\//i, '').trim();

    if (!cleanUrl) {
      setErrorMsg('Informe a URL de destino (ex: seusite.com.br).');
      setActiveTab('content');
      setTimeout(() => urlInputRef.current?.focus(), 100);
      return;
    }

    const finalUrl = `${protocol}${cleanUrl}`;

    // 2. Intelligent name fallback if empty
    let finalName = name.trim();
    if (!finalName) {
      if (type === 'whatsapp') {
        finalName = waPhone ? `WhatsApp (${waPhone})` : 'QR Code WhatsApp';
      } else if (type === 'instagram') {
        const handle = cleanUrl.replace(/^instagram\.com\/?/i, '').replace(/\/$/, '');
        finalName = handle ? `Instagram @${handle}` : 'Instagram';
      } else if (cleanUrl) {
        const domain = cleanUrl.split('/')[0].replace(/^www\./, '');
        finalName = `Link ${domain}`;
      } else {
        finalName = `QR Code ${new Date().toLocaleDateString('pt-BR')}`;
      }
    }

    // 3. Client selection (optional - can be created unassigned / avulso)
    const finalClientId = clientId ? clientId.trim() : '';

    // 4. Safe fallback slug / shortCode
    let finalShortCode = shortCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (!finalShortCode) {
      finalShortCode = (editingQR?.shortCode || Math.random().toString(36).substring(2, 8))
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-');
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave({
        name: finalName,
        clientId: finalClientId,
        type,
        destinationUrl: finalUrl,
        shortCode: finalShortCode,
        style,
        notes,
        status,
      });
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar QR Code:', err);
      setErrorMsg(err.message || 'Erro ao salvar QR Code. Verifique os dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingQR ? 'Editar QR Code Dinâmico' : 'Criar Novo QR Code Dinâmico'}
              </h2>
              <p className="text-xs text-slate-500">
                O destino pode ser alterado a qualquer momento sem trocar o QR Code impresso.
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

        {/* Modal Body: Left Wizard & Right Preview */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
          {/* Left Form Area (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-1.5 px-1 text-center rounded-lg transition-all ${
                  activeTab === 'content'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="hidden sm:inline">1. Tipo & Conteúdo</span>
                <span className="sm:hidden">1. Conteúdo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('client')}
                className={`flex-1 py-1.5 px-1 text-center rounded-lg transition-all ${
                  activeTab === 'client'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="hidden sm:inline">2. Cliente & Link</span>
                <span className="sm:hidden">2. Link / Slug</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`flex-1 py-1.5 px-1 text-center rounded-lg transition-all ${
                  activeTab === 'style'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="hidden sm:inline">3. Personalização Visual</span>
                <span className="sm:hidden">3. Visual</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* TAB 1: TYPE & CONTENT */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tipo de Destino
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {QR_TYPES.map((t) => {
                      const Icon = t.icon;
                      const isSelected = type === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setType(t.id);
                            if (t.id === 'instagram') {
                              setProtocol('https://');
                              setRawUrl('instagram.com/');
                              setDestinationUrl('https://instagram.com/');
                            } else if (t.id === 'digital_menu') {
                              setProtocol('https://');
                              setRawUrl('menu.');
                              setDestinationUrl('https://menu.');
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold truncate">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific WhatsApp Helper */}
                {type === 'whatsapp' ? (
                  <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-900">Configuração WhatsApp</p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Número com DDD (ex: 5511999998888)
                      </label>
                      <input
                        type="text"
                        placeholder="5511998765432"
                        value={waPhone}
                        onChange={(e) => handleWaPhoneChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl outline-hidden focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mensagem Pré-definida (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Olá, gostaria de informações sobre os serviços!"
                        value={waMessage}
                        onChange={(e) => handleWaMsgChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ) : null}

                {/* Primary Destination URL with Protocol Switcher */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      URL de Destino
                    </label>
                    {/* Fast protocol switch pills */}
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
                    Para onde a pessoa será redirecionada. Digite ou cole o link (o protocolo https:// é editável).
                  </p>

                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                    {/* Clickable Protocol Selector Button */}
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

                    {/* URL Input */}
                    <input
                      ref={urlInputRef}
                      type="text"
                      inputMode="url"
                      placeholder="exemplo.com.br/meu-link"
                      value={rawUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs sm:text-sm bg-transparent outline-hidden font-mono text-slate-800 placeholder:text-slate-400"
                    />

                    {/* Clear Button */}
                    {rawUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setRawUrl('');
                          setDestinationUrl(protocol);
                          urlInputRef.current?.focus();
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
                      Link completo: <strong className="font-mono text-indigo-600 font-semibold">{protocol}{rawUrl || 'seusite.com.br'}</strong>
                    </span>
                    <span className="shrink-0 text-slate-400">
                      {protocol === 'https://' ? '🔒 Seguro (Recomendado)' : '⚠️ Sem criptografia'}
                    </span>
                  </div>
                </div>

                {/* QR Code Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome / Título do QR Code
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cardápio Salão Principal - Mesas 01 a 20 (opcional)"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingQR && !shortCode) {
                        const slug = e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]/g, '-')
                          .replace(/-+/g, '-');
                        setShortCode(slug.slice(0, 20));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CLIENT & LINK */}
            {activeTab === 'client' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Vínculo com Cliente (Opcional)
                    </label>
                    {clientId ? (
                      <button
                        type="button"
                        onClick={() => setClientId('')}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Desvincular (Tornar Avulso)
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Modo Avulso (Sem Cliente)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Você pode criar o QR Code agora sem vínculo com nenhum cliente e direcioná-lo a um cliente depois.
                  </p>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden font-medium"
                  >
                    <option value="">-- Sem cliente vinculado (Criar QR Code Avulso / Atribuir depois) --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.contactPerson})
                      </option>
                    ))}
                  </select>

                  {!clientId ? (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                      💡 <strong>QR Code Independente:</strong> O QR Code será criado com seu link dinâmico pronto para uso. Mais tarde, você poderá atribuí-lo a qualquer cliente a partir da lista de QR Codes ou da tela do cliente.
                    </div>
                  ) : (
                    <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                      ✅ <strong>Vinculado ao Cliente:</strong> Este QR Code estará associado à empresa {clients.find((c) => c.id === clientId)?.name || 'selecionada'}.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Slug / URL Dinâmica Exclusiva
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    O link permanente gravado no QR Code que realiza o redirecionamento dinâmico.
                  </p>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
                    <span className="px-3 text-xs text-slate-400 font-mono select-none bg-slate-100 border-r border-slate-200 py-2.5">
                      /r/
                    </span>
                    <input
                      ref={slugInputRef}
                      type="text"
                      value={shortCode}
                      onChange={(e) =>
                        setShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent outline-hidden font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Inicial
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'active'}
                        onChange={() => setStatus('active')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Ativo (Redirecionamento Liberado)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'inactive'}
                        onChange={() => setStatus('inactive')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Pausado (Exibe tela de manutenção)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Observações Internas (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Instalado na fachada de entrada da loja."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: VISUAL CUSTOMIZATION */}
            {activeTab === 'style' && (
              <div className="space-y-5">
                {/* Color Palettes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Paletas Rápidas
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_COLORS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() =>
                          setStyle((prev) => ({ ...prev, foregroundColor: p.fg, backgroundColor: p.bg }))
                        }
                        className="p-2 rounded-xl border border-slate-200 hover:border-indigo-500 flex items-center gap-2 text-left text-xs text-slate-700 transition-colors"
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: p.fg }}
                        />
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cor Principal (QR)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={style.foregroundColor}
                        onChange={(e) =>
                          setStyle((prev) => ({ ...prev, foregroundColor: e.target.value }))
                        }
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={style.foregroundColor}
                        onChange={(e) =>
                          setStyle((prev) => ({ ...prev, foregroundColor: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cor de Fundo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={style.backgroundColor}
                        onChange={(e) =>
                          setStyle((prev) => ({ ...prev, backgroundColor: e.target.value }))
                        }
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={style.backgroundColor}
                        onChange={(e) =>
                          setStyle((prev) => ({ ...prev, backgroundColor: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Dot Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Formato dos Módulos
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['square', 'rounded', 'dots', 'classy'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setStyle((prev) => ({ ...prev, dotType: mode }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                          style.dotType === mode
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mode === 'square' ? 'Quadrado' : mode === 'rounded' ? 'Arredondado' : mode === 'dots' ? 'Pontos' : 'Classy'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Eye Frame & Ball */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Moldura dos Olhos
                    </label>
                    <select
                      value={style.eyeFrame}
                      onChange={(e) =>
                        setStyle((prev) => ({ ...prev, eyeFrame: e.target.value as any }))
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="square">Quadrada Clássica</option>
                      <option value="rounded">Arredondada Moderna</option>
                      <option value="circle">Circular Suave</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pupila dos Olhos
                    </label>
                    <select
                      value={style.eyeBall}
                      onChange={(e) =>
                        setStyle((prev) => ({ ...prev, eyeBall: e.target.value as any }))
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="square">Quadrada</option>
                      <option value="rounded">Arredondada</option>
                      <option value="circle">Círculo</option>
                    </select>
                  </div>
                </div>

                {/* Margin */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Margem de Segurança (Quiet Zone)</span>
                    <span className="font-bold text-indigo-600">{style.margin} blocos</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={style.margin}
                    onChange={(e) => setStyle((prev) => ({ ...prev, margin: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Logo Customization */}
                <div className="pt-2 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Logotipo Central no QR Code
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Insira a marca ou logotipo no centro com badge de proteção e correção de erro avançada.
                      </p>
                    </div>
                    {style.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setStyle((prev) => ({ ...prev, logoUrl: undefined }))}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover Logo
                      </button>
                    )}
                  </div>

                  {/* Logo Options */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* If a client is selected and has logo */}
                    {clientId && clients.find((c) => c.id === clientId)?.logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          const cl = clients.find((c) => c.id === clientId);
                          if (cl?.logoUrl) {
                            setStyle((prev) => ({ ...prev, logoUrl: cl.logoUrl, logoSize: prev.logoSize || 22 }));
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                          style.logoUrl === clients.find((c) => c.id === clientId)?.logoUrl
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-md bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          <img
                            src={clients.find((c) => c.id === clientId)?.logoUrl}
                            alt="Logo Cliente"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span>Usar Logo do Cliente</span>
                      </button>
                    )}

                    {/* Upload custom logo */}
                    <button
                      type="button"
                      onClick={() => qrLogoInputRef.current?.click()}
                      className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{style.logoUrl ? 'Trocar Logotipo' : 'Upload Imagem (PNG/SVG/JPG)'}</span>
                    </button>

                    <input
                      ref={qrLogoInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                      onChange={handleQRLogoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Logo Preview & Size Control when logo is active */}
                  {style.logoUrl && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                        <img
                          src={style.logoUrl}
                          alt="Logo do QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 w-full space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Tamanho da Logo Central</span>
                          <span className="font-bold text-indigo-600">{style.logoSize || 22}%</span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="28"
                          step="2"
                          value={style.logoSize || 22}
                          onChange={(e) => setStyle((prev) => ({ ...prev, logoSize: parseInt(e.target.value) }))}
                          className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>16% (Discreto)</span>
                          <span>22% (Equilibrado)</span>
                          <span>28% (Destaque)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Area (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-50/80 flex flex-col justify-between items-center text-center">
            <div className="w-full space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Pré-visualização em Alta Resolução
              </div>

              {/* Canvas Box */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 inline-block mx-auto max-w-[280px]">
                <canvas
                  ref={canvasRef}
                  className="rounded-2xl w-full h-auto aspect-square block"
                />
              </div>

              {/* Dynamic Link Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-left space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>URL Dinâmica Permanente</span>
                  <span className="text-emerald-600 font-semibold">Sem Reimpressão</span>
                </div>

                {/* Permanent /r/ Short Link */}
                <div className="flex items-center justify-between gap-1.5">
                  <p className="font-mono text-xs text-indigo-600 font-bold truncate">
                    {livePreviewUrl}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('client');
                      setTimeout(() => slugInputRef.current?.focus(), 100);
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold px-2 py-0.5 rounded-md hover:bg-indigo-50 border border-indigo-100/60 shrink-0 transition-colors"
                    title="Editar slug da URL dinâmica"
                  >
                    Editar Slug
                  </button>
                </div>

                {/* Real Destination URL with Direct Edit Button */}
                <p className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="truncate">
                    <span className="font-semibold text-slate-700">Redireciona para: </span>
                    <span className="font-mono font-medium text-slate-900 truncate">
                      {destinationUrl || 'Destino não definido'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('content');
                      setTimeout(() => urlInputRef.current?.focus(), 100);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 transition-colors"
                    title="Editar URL de destino e protocolo"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                </p>

                {/* Direct Status Toggle in Preview */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">Status do QR Code:</span>
                  <button
                    type="button"
                    onClick={() => setStatus((prev) => (prev === 'active' ? 'inactive' : 'active'))}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                      status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                    title="Alternar Ativo/Pausado"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>{status === 'active' ? 'Ativo (Liberado)' : 'Pausado'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Direct error banner above action buttons */}
            {errorMsg && (
              <div className="w-full mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200 shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-800">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="w-full pt-4 flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              {editingQR && onDeleteQR && (
                <button
                  type="button"
                  onClick={() => {
                    const qrId = editingQR.id;
                    const qrName = editingQR.name;
                    onClose();
                    onDeleteQR(qrId, qrName);
                  }}
                  className="py-2.5 px-3 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  title="Excluir este QR Code"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              )}
              <button
                id="btn-cancel-qrcode"
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                id="btn-submit-qrcode"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2 text-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : editingQR ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Atualizar QR Code</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Gerar QR Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
