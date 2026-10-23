export type QRCodeType =
  | 'website'
  | 'instagram'
  | 'whatsapp'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'google_maps'
  | 'custom_link'
  | 'link_page'
  | 'pdf'
  | 'digital_menu';

export interface QRStyleConfig {
  foregroundColor: string;
  backgroundColor: string;
  dotType: 'square' | 'rounded' | 'dots' | 'classy';
  eyeFrame: 'square' | 'rounded' | 'circle';
  eyeBall: 'square' | 'rounded' | 'circle';
  margin: number;
  size: number;
  logoUrl?: string;
  logoSize?: number;
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  contactPerson: string;
  email: string;
  phone: string;
  // Campos de endereço no formato japonês (日本の住所形式)
  postalCode?: string; // 郵便番号 - Código Postal (ex: 〒150-0001 ou 150-0001)
  prefecture?: string; // 都道府県 - Província (ex: Tóquio / 東京都)
  city?: string; // 市区町村 - Cidade/Distrito/Bairro (ex: Shibuya-ku / 渋谷区)
  address?: string; // 丁目・番地・号 - Número/Chome/Banchi/Go (ex: Jingumae 5-7-22)
  building?: string; // 建物名・部屋番号 - Edifício, Andar e Sala (ex: Omotesando Hills 3F)
  country: string; // 国 - País (padrão: Japão)
  notes?: string;
  logoUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  password?: string;
  accessPin?: string;
  qrCodeCount?: number;
  totalScans?: number;
}

export interface QRCodeItem {
  id: string;
  shortCode: string; // The unique short slug for /r/:shortCode
  name: string;
  clientId?: string; // Optional: can be unassigned / independent
  clientName?: string;
  type: QRCodeType;
  destinationUrl: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastScannedAt?: string;
  scanCount: number;
  style: QRStyleConfig;
  notes?: string;
}

export interface ScanRecord {
  id: string;
  qrCodeId: string;
  qrCodeName: string;
  clientId: string;
  clientName: string;
  timestamp: string;
  ip: string;
  country: string;
  city: string;
  region?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  device: 'Mobile' | 'Desktop' | 'Tablet';
  os: string;
  browser: string;
  referrer: string;
}

export interface HistoryLog {
  id: string;
  timestamp: string;
  action:
    | 'qr_created'
    | 'qr_updated'
    | 'qr_url_changed'
    | 'qr_activated'
    | 'qr_deactivated'
    | 'qr_duplicated'
    | 'qr_deleted'
    | 'qr_assigned'
    | 'qr_unassigned'
    | 'client_created'
    | 'client_updated'
    | 'client_deleted'
    | 'settings_updated'
    | 'analytics_reset';
  title: string;
  description: string;
  userId: string;
  userName: string;
  targetId?: string;
  targetType?: 'qrcode' | 'client' | 'settings' | 'analytics';
}

export interface SystemSettings {
  companyName: string;
  platformName: string;
  contactEmail?: string;
  supportEmail?: string;
  supportPhone?: string;
  systemLogoUrl?: string;
  accentColor?: string;
  themeMode?: 'light' | 'dark' | 'system';
  defaultQrMargin?: number;
  defaultQrColor?: string;
  defaultQrBg?: string;
  defaultBgColor?: string;
  enableGeoTracking?: boolean;
  domainName?: string;
  baseDomain?: string;
  allowPublicRegistration?: boolean;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'client';
  clientId?: string;
  token: string;
}

export interface ClientPortalData {
  client: Client;
  qrcodes: QRCodeItem[];
  stats: {
    totalQRCodes: number;
    activeQRCodes: number;
    inactiveQRCodes: number;
    totalScans: number;
    scansLast24h: number;
    scansLast7d: number;
    scansLast30d: number;
  };
  dailyScans: { date: string; scans: number }[];
  devicesData: { name: string; value: number }[];
  operatingSystems: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
  citiesData: { name: string; value: number }[];
  peakHoursData: { hour: string; scans: number }[];
  recentScans: ScanRecord[];
}

export interface DashboardStats {
  totalClients: number;
  totalQRCodes: number;
  activeQRCodes: number;
  inactiveQRCodes: number;
  totalScans: number;
  scansLast24h?: number;
  scansLast7d?: number;
  scansLast30d?: number;
  scans24h?: number;
  scans7d?: number;
  scans30d?: number;
}

export interface OverviewAnalytics {
  stats: DashboardStats;
  topQRCodes: QRCodeItem[];
  topClients: Client[];
  dailyScans: { date: string; scans: number }[];
  devicesData: { name: string; value: number }[];
  operatingSystems?: { name: string; value: number }[];
  browsers?: { name: string; value: number }[];
  peakHoursData?: { hour: string; scans: number }[];
  citiesData?: { name: string; value: number }[];
  recentScans?: ScanRecord[];
}
