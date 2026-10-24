import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import type { Client } from '../types';
import {
  JAPANESE_PREFECTURES,
  formatJapanesePostalCode,
  formatJapaneseAddress,
} from '../utils/japaneseAddress';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<Client>) => Promise<void>;
  editingClient: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingClient,
}) => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Endereço no formato japonês
  const [postalCode, setPostalCode] = useState('');
  const [prefecture, setPrefecture] = useState('Tóquio');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [building, setBuilding] = useState('');
  const [country, setCountry] = useState('Japão');

  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
      const reader = new FileReader();
      if (isSvg) {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo SVG'));
        reader.readAsDataURL(file);
        return;
      }

      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 512;
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
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType =
            file.type === 'image/png' || file.type === 'image/webp'
              ? 'image/png'
              : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, 0.95);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('A imagem é muito grande. O tamanho máximo permitido é 8MB.');
      return;
    }

    try {
      setIsProcessingLogo(true);
      setErrorMsg('');
      const dataUrl = await processImageFile(file);
      setLogoUrl(dataUrl);
    } catch {
      setErrorMsg('Erro ao processar imagem do logo.');
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const normalizePrefecture = (pref?: string) => {
    if (!pref) return 'Tóquio';
    // Remove qualquer tradução em japonês entre parênteses como (東京都) ou (群馬県)
    return pref.replace(/\s*\([^)]*[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF][^)]*\)/g, '').trim() || pref;
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editingClient) {
      setName(editingClient.name);
      setCompanyName(editingClient.companyName || editingClient.name);
      setContactPerson(editingClient.contactPerson);
      setEmail(editingClient.email);
      setPhone(editingClient.phone || '');
      setPassword(editingClient.password || '');

      // Dados de endereço japonês
      setPostalCode(editingClient.postalCode ? formatJapanesePostalCode(editingClient.postalCode) : '');
      setPrefecture(normalizePrefecture(editingClient.prefecture));
      setCity(editingClient.city || '');
      setAddress(editingClient.address || '');
      setBuilding(editingClient.building || '');
      setCountry(editingClient.country || 'Japão');

      setNotes(editingClient.notes || '');
      setStatus(editingClient.status);
      setLogoUrl(editingClient.logoUrl || '');
    } else {
      setName('');
      setCompanyName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setPassword('cliente123');
      setLogoUrl('');

      setPostalCode('');
      setPrefecture('Tóquio');
      setCity('');
      setAddress('');
      setBuilding('');
      setCountry('Japão');

      setNotes('');
      setStatus('active');
    }
    setErrorMsg('');
  }, [isOpen, editingClient]);

  if (!isOpen) return null;

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setPostalCode(formatJapanesePostalCode(raw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome da empresa ou cliente.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Informe o e-mail de contato.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave({
        name,
        companyName: companyName || name,
        contactPerson: contactPerson || name,
        email,
        phone,
        logoUrl: logoUrl.trim() !== '' ? logoUrl.trim() : '',
        password: password.trim() || undefined,
        postalCode: postalCode.replace(/[^\d]/g, ''),
        prefecture,
        city,
        address,
        building,
        country: country || 'Japão',
        notes,
        status,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Visualização ao vivo do endereço no formato japonês
  const previewAddress = formatJapaneseAddress(
    {
      postalCode,
      prefecture,
      city,
      address,
      building,
      country,
    },
    { includePostalCode: true, includeCountry: true }
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingClient ? 'Editar Cadastro do Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <p className="text-xs text-slate-500">
                Dados cadastrais e endereço no padrão japonês.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Dados Principais & Logotipo */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
              1. Identificação da Empresa & Logotipo
            </span>

            {/* Inserção de Logotipo da Empresa */}
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>Logo da Empresa / Marca</span>
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover Logo</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Visual Preview Box */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 group-hover:border-indigo-400 flex items-center justify-center overflow-hidden shadow-xs relative transition-all">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo da Empresa"
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <Building2 className="w-6 h-6 stroke-[1.5] mb-0.5 text-slate-300" />
                        <span className="text-[10px] font-medium leading-tight text-slate-400">
                          {name ? name.charAt(0).toUpperCase() : 'Sem logo'}
                        </span>
                      </div>
                    )}
                  </div>
                  {logoUrl && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Actions & Inputs */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      disabled={isProcessingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200/90 hover:border-indigo-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isProcessingLogo ? 'Processando imagem...' : 'Escolher Imagem (Upload)'}</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="Ou cole o link direto da imagem (https://...)"
                      value={logoUrl.startsWith('data:') ? '' : logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-hidden transition-colors"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    Formatos: PNG, SVG, JPG, WebP. O logo aparecerá nos cards da empresa, no painel e no Portal do Cliente.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Fantasia / Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nome da Empresa / Cliente"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razão Social (K.K. / Co., Ltd.)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Razão Social da Empresa"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-2">
              2. Contato & Comunicação
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Responsável / Contato *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kenji Sato"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  required
                  placeholder="contato@empresa.jp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone (Japão)
                </label>
                <input
                  type="tel"
                  placeholder="+81 3-1234-5678 ou 090-..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden transition-colors"
                />
              </div>
            </div>

            {/* Senha de Acesso do Cliente ao Portal */}
            <div className="pt-3 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Senha de Acesso à Área do Cliente</span>
                </label>
                <span className="text-[11px] text-slate-400">Padrão: cliente123</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="cliente123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Senha que o cliente usará para entrar na Área do Cliente. O cliente também pode alterá-la depois no portal.
              </p>
            </div>
          </div>

          {/* Endereço no Formato Japonês */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Endereço
                </span>
              </div>
            </div>

            {/* Linha 1: Código Postal e Província */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código Postal (〒)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">
                    〒
                  </span>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="150-0001"
                    value={postalCode}
                    onChange={handlePostalCodeChange}
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Ex: 150-0001 (formatação automática com hífen)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Província
                </label>
                <select
                  value={prefecture}
                  onChange={(e) => setPrefecture(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-hidden text-slate-800"
                >
                  {JAPANESE_PREFECTURES.map((p) => (
                    <option key={p.code} value={p.namePt}>
                      {p.namePt} ({p.region})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 2: Cidade/Distrito e Bairro/Chome/Banchi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cidade / Distrito / Município
                </label>
                <input
                  type="text"
                  placeholder="Ex: Shibuya-ku, Yokohama-shi, Minato-ku"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bairro / Chome / Banchi / Número
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jingumae 5-7-22, Roppongi 6-10-1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>

            {/* Linha 3: Edifício / Sala e País */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Edifício / Andar / Sala
                </label>
                <input
                  type="text"
                  placeholder="Ex: Omotesando Hills 3F, Mori Tower 18F"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Pré-visualização do Endereço Japonês montado */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1 font-semibold text-[11px]">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pré-visualização do Endereço Formatado:</span>
              </div>
              <p className="font-medium text-slate-900 leading-relaxed break-all">
                {previewAddress || <span className="text-slate-400 italic">Preencha os campos para visualizar...</span>}
              </p>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observações / Notas Internas
            </label>
            <textarea
              rows={2}
              placeholder="Detalhes sobre a empresa, idioma de preferência, contratos ou campanhas ativas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-hidden transition-colors"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status do Cliente
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="clientStatus"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-emerald-700 font-bold">Ativo</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="clientStatus"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-600">Inativo</span>
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-sm shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                'Salvando...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editingClient ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
