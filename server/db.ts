import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  Client,
  QRCodeItem,
  ScanRecord,
  HistoryLog,
  SystemSettings,
  QRCodeType,
  ClientPortalData,
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const BACKUP_FILE = path.join(DATA_DIR, 'store.backup.json');
const PERSISTENT_SNAPSHOT_FILE = path.join(DATA_DIR, 'store.persistent.json');
const CREATED_REGISTRY_FILE = path.join(DATA_DIR, 'created_registry.json');
const MASTER_SNAPSHOT_FILE = path.join(DATA_DIR, 'master_snapshot.json');
const DELETED_REGISTRY_FILE = path.join(DATA_DIR, 'deleted_registry.json');

export interface CreatedRegistry {
  clients: Record<string, Client>;
  qrcodes: Record<string, QRCodeItem>;
  adminUser?: AdminUser;
  lastUpdated: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
  updatedAt?: string;
}

export interface DatabaseSchema {
  clients: Client[];
  qrcodes: QRCodeItem[];
  scans: ScanRecord[];
  history: HistoryLog[];
  settings: SystemSettings;
  adminUser?: AdminUser;
}

const defaultSettings: SystemSettings = {
  companyName: 'QR Dynamic Studio Inc.',
  platformName: 'QR Dynamic Hub',
  contactEmail: 'admin@qrdynamic.io',
  supportPhone: '+55 (11) 98765-4321',
  systemLogoUrl: '',
  accentColor: '#4f46e5',
  themeMode: 'light',
  defaultQrMargin: 2,
  defaultQrColor: '#0f172a',
  defaultQrBg: '#ffffff',
  enableGeoTracking: true,
  domainName: 'qrdynamic.app',
  allowPublicRegistration: false,
};

// MASTER BASELINE: Entidades legítimas criadas pelo administrador (sem clientes fictícios)
export const MASTER_ADMIN_CREATED_ENTITIES: {
  clients: Client[];
  qrcodes: QRCodeItem[];
  adminUser: AdminUser;
} = {
  clients: [
    {
      name: 'Wanka Interia',
      companyName: 'Wanka Interia',
      contactPerson: 'Joel',
      email: 'joel@joel.com',
      phone: '',
      postalCode: '',
      prefecture: 'Tóquio',
      city: '',
      address: '',
      building: '',
      country: 'Japão',
      notes: '',
      logoUrl: '/uploads/logos/wanka_interia_logo.svg',
      status: 'active',
      password: 'Wanka123',
      id: 'cli_1791613024858_1a7802',
      createdAt: '2026-10-10T06:17:04.859Z',
      updatedAt: '2026-10-10T06:17:04.859Z',
    },
    {
      name: 'Vilma Baia',
      companyName: 'Vilma Baia',
      contactPerson: 'Vilma',
      email: 'vilmabaia@icloud.com',
      phone: '+8108069248133',
      postalCode: '3700523',
      prefecture: 'Gunma',
      city: '',
      address: '',
      building: '',
      country: 'Japão',
      notes: '',
      logoUrl: '/uploads/logos/vilma_baia_logo.svg',
      status: 'active',
      password: 'Manu@10091994',
      id: 'cli_1791609452016_b7f6cb',
      createdAt: '2026-10-10T05:17:32.017Z',
      updatedAt: '2026-10-10T09:04:33.890Z',
    },
    {
      name: 'YBK Design',
      companyName: 'YBK Design Co., Ltd.',
      contactPerson: 'Yabiko Alexandre',
      email: 'contact@linksybk.com',
      phone: '+81-070-7549-5217',
      postalCode: '',
      prefecture: 'Gunma',
      city: 'Oura-Gun Oizumi-Machi Yoshida ',
      address: '1506-4',
      building: '',
      country: 'Japão',
      notes: '',
      logoUrl: '/uploads/logos/ybk_design_logo.svg',
      status: 'active',
      id: 'cli_1789823299416_8573c0',
      createdAt: '2026-09-19T13:08:19.417Z',
      updatedAt: '2026-09-27T06:54:26.970Z',
      password: 'minhaNovaSenha2026!',
    },
  ],
  qrcodes: [
    {
      name: 'Link vilmabaia@linksybk.com',
      clientId: 'cli_1791609452016_b7f6cb',
      type: 'website',
      destinationUrl: 'https://vilmabaia.linksybk.com',
      shortCode: 'vb',
      status: 'active',
      notes: '',
      style: {
        foregroundColor: '#0f172a',
        backgroundColor: '#ffffff',
        dotType: 'square',
        eyeFrame: 'rounded',
        eyeBall: 'rounded',
        margin: 2,
        size: 512,
      },
      id: 'qr_1791609958322_34d4b6',
      clientName: 'Vilma Baia',
      scanCount: 0,
      createdAt: '2026-10-10T05:25:58.322Z',
      updatedAt: '2026-10-10T05:26:34.609Z',
      lastScannedAt: '2026-10-10T05:27:06.987Z',
    },
    {
      name: 'Link ybkdesign.linksybk.com',
      clientId: 'cli_1789823299416_8573c0',
      type: 'website',
      destinationUrl: 'https://ybkdesign.linksybk.com',
      shortCode: 'egfgva',
      status: 'active',
      notes: '',
      style: {
        foregroundColor: '#0f172a',
        backgroundColor: '#ffffff',
        dotType: 'rounded',
        eyeFrame: 'rounded',
        eyeBall: 'rounded',
        margin: 2,
        size: 512,
      },
      id: 'qr_1789824943670_381b99',
      clientName: 'YBK Design',
      scanCount: 2,
      createdAt: '2026-09-19T13:35:43.670Z',
      updatedAt: '2026-09-19T13:35:43.670Z',
      lastScannedAt: '2026-09-19T13:43:06.340Z',
    },
  ],
  adminUser: {
    id: 'usr_admin_1',
    name: 'Alexandre Yabiko',
    email: 'ybkdesign@icloud.com',
    password: 'Manu@QR@10091994',
    updatedAt: '2026-10-10T06:45:11.833Z',
  },
};

function generateInitialData(): DatabaseSchema {
  // 1. Tentar carregar do registro persistente
  try {
    if (fs.existsSync(CREATED_REGISTRY_FILE)) {
      const content = fs.readFileSync(CREATED_REGISTRY_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.clients === 'object' && typeof parsed.qrcodes === 'object') {
        const clientList = Object.values(parsed.clients) as Client[];
        const qrList = Object.values(parsed.qrcodes) as QRCodeItem[];
        if (clientList.length > 0) {
          return {
            clients: clientList,
            qrcodes: qrList,
            scans: [],
            history: [],
            settings: defaultSettings,
            adminUser: parsed.adminUser || MASTER_ADMIN_CREATED_ENTITIES.adminUser,
          };
        }
      }
    }
  } catch (err) {
    console.error('Error generating data from registry:', err);
  }

  // 2. Tentar carregar do snapshot mestre
  try {
    if (fs.existsSync(MASTER_SNAPSHOT_FILE)) {
      const content = fs.readFileSync(MASTER_SNAPSHOT_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.clients) && parsed.clients.length > 0) {
        return {
          clients: parsed.clients,
          qrcodes: Array.isArray(parsed.qrcodes) ? parsed.qrcodes : [],
          scans: [],
          history: [],
          settings: defaultSettings,
          adminUser: parsed.adminUser || MASTER_ADMIN_CREATED_ENTITIES.adminUser,
        };
      }
    }
  } catch (err) {
    console.error('Error generating data from master snapshot:', err);
  }

  // 3. Fallback seguro com entidades mestre criadas pelo administrador
  return {
    clients: MASTER_ADMIN_CREATED_ENTITIES.clients.map((c) => ({ ...c })),
    qrcodes: MASTER_ADMIN_CREATED_ENTITIES.qrcodes.map((q) => ({ ...q })),
    scans: [],
    history: [],
    settings: defaultSettings,
    adminUser: { ...MASTER_ADMIN_CREATED_ENTITIES.adminUser },
  };
}

export const ACTION_LABELS: Record<string, string> = {
  qr_url_changed: 'URL Alterada',
  qr_created: 'QR Criado',
  qr_activated: 'QR Ativado',
  qr_deactivated: 'QR Pausado',
  qr_duplicated: 'QR Duplicado',
  qr_deleted: 'QR Excluído',
  qr_assigned: 'QR Atribuído',
  qr_unassigned: 'QR Desvinculado',
  client_created: 'Cliente Cadastrado',
  client_updated: 'Cliente Atualizado',
  client_deleted: 'Cliente Excluído',
  settings_updated: 'Configurações',
  analytics_reset: 'Análise Resetada',
};

export function normalizeSearchTerm(str?: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  // --- REGISTRO PERSISTENTE DE ENTIDADES CRIADAS ---
  // Garante que clientes e QR codes criados pelo administrador NUNCA sejam alterados ou removidos em reparos ou atualizações.
  public loadRegistry(): CreatedRegistry {
    // 1. Tentar CREATED_REGISTRY_FILE
    try {
      if (fs.existsSync(CREATED_REGISTRY_FILE)) {
        const content = fs.readFileSync(CREATED_REGISTRY_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed.clients === 'object' && typeof parsed.qrcodes === 'object') {
          const clientCount = Object.keys(parsed.clients).length;
          if (clientCount > 0) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.error('Error reading created registry file:', err);
    }

    // 2. Tentar MASTER_SNAPSHOT_FILE
    try {
      if (fs.existsSync(MASTER_SNAPSHOT_FILE)) {
        const content = fs.readFileSync(MASTER_SNAPSHOT_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && (Array.isArray(parsed.clients) || typeof parsed.clients === 'object')) {
          const clientList: Client[] = Array.isArray(parsed.clients)
            ? parsed.clients
            : Object.values(parsed.clients);
          const qrList: QRCodeItem[] = Array.isArray(parsed.qrcodes)
            ? parsed.qrcodes
            : Object.values(parsed.qrcodes || {});

          if (clientList.length > 0) {
            const regClients: Record<string, Client> = {};
            const regQRs: Record<string, QRCodeItem> = {};
            clientList.forEach((c) => {
              if (c?.id) regClients[c.id] = c;
            });
            qrList.forEach((q) => {
              if (q?.id) regQRs[q.id] = q;
            });
            return {
              clients: regClients,
              qrcodes: regQRs,
              adminUser: parsed.adminUser || MASTER_ADMIN_CREATED_ENTITIES.adminUser,
              lastUpdated: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err) {
      console.error('Error reading master snapshot file:', err);
    }

    // 3. Fallback inviolável às entidades mestre
    const fallbackClients: Record<string, Client> = {};
    const fallbackQRs: Record<string, QRCodeItem> = {};
    MASTER_ADMIN_CREATED_ENTITIES.clients.forEach((c) => {
      fallbackClients[c.id] = { ...c };
    });
    MASTER_ADMIN_CREATED_ENTITIES.qrcodes.forEach((q) => {
      fallbackQRs[q.id] = { ...q };
    });

    return {
      clients: fallbackClients,
      qrcodes: fallbackQRs,
      adminUser: { ...MASTER_ADMIN_CREATED_ENTITIES.adminUser },
      lastUpdated: new Date().toISOString(),
    };
  }

  public loadDeletedRegistry(): { clients: string[]; qrcodes: string[] } {
    try {
      if (fs.existsSync(DELETED_REGISTRY_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(DELETED_REGISTRY_FILE, 'utf-8'));
        return {
          clients: Array.isArray(parsed?.clients) ? parsed.clients : [],
          qrcodes: Array.isArray(parsed?.qrcodes) ? parsed.qrcodes : [],
        };
      }
    } catch (err) {
      console.warn('Error reading deleted registry:', err);
    }
    return { clients: [], qrcodes: [] };
  }

  public saveDeletedRegistry(reg: { clients: string[]; qrcodes: string[] }) {
    try {
      fs.writeFileSync(DELETED_REGISTRY_FILE, JSON.stringify(reg, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Error saving deleted registry:', err);
    }
  }

  public addDeletedQRCode(id: string) {
    const reg = this.loadDeletedRegistry();
    if (!reg.qrcodes.includes(id)) {
      reg.qrcodes.push(id);
      this.saveDeletedRegistry(reg);
    }
  }

  public removeDeletedQRCode(id: string) {
    const reg = this.loadDeletedRegistry();
    if (reg.qrcodes.includes(id)) {
      reg.qrcodes = reg.qrcodes.filter((qid) => qid !== id);
      this.saveDeletedRegistry(reg);
    }
  }

  public generateClientLogoSvg(clientName: string, companyName?: string): string {
    const displayName = (companyName || clientName || 'Empresa').trim();
    const words = displayName.split(/\s+/).filter(Boolean);
    let initials = 'QR';
    if (words.length === 1) {
      initials = words[0].slice(0, 2).toUpperCase();
    } else if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    }

    const gradients = [
      { id: 'grad_ind', start: '#4f46e5', end: '#7c3aed', shadow: '#4f46e5' },
      { id: 'grad_eme', start: '#059669', end: '#0d9488', shadow: '#059669' },
      { id: 'grad_sky', start: '#0284c7', end: '#2563eb', shadow: '#0284c7' },
      { id: 'grad_ora', start: '#ea580c', end: '#db2777', shadow: '#ea580c' },
      { id: 'grad_sla', start: '#0f172a', end: '#334155', shadow: '#0f172a' },
    ];
    let hash = 0;
    for (let i = 0; i < displayName.length; i++) {
      hash = (hash * 31 + displayName.charCodeAt(i)) % gradients.length;
    }
    const theme = gradients[Math.abs(hash)];
    const label = displayName.toUpperCase().slice(0, 16);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="${theme.id}_${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.start}" />
      <stop offset="100%" stop-color="${theme.end}" />
    </linearGradient>
    <filter id="shadow_${initials}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="${theme.shadow}" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="44" fill="url(#${theme.id}_${initials})" filter="url(#shadow_${initials})"/>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
  <g transform="translate(100, 85)" text-anchor="middle">
    <text font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-weight="900" font-size="52" fill="#ffffff" letter-spacing="-1">${initials}</text>
  </g>
  <g transform="translate(100, 132)" text-anchor="middle">
    <rect x="-65" y="-14" width="130" height="20" rx="10" fill="#ffffff" fill-opacity="0.22"/>
    <text font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-weight="800" font-size="10.5" fill="#ffffff" letter-spacing="2" dy="0.5">${label}</text>
  </g>
</svg>`;
  }

  public ensureClientHasLogo(client: Client): string {
    const uploadDir = path.join(process.cwd(), 'data', 'uploads', 'logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 1. Check MASTER_ADMIN_CREATED_ENTITIES first for designated logos
    const master = MASTER_ADMIN_CREATED_ENTITIES.clients.find(
      (m) => m.id === client.id || m.name.toLowerCase() === client.name.toLowerCase()
    );
    if (master && master.logoUrl) {
      const masterPath = path.join(process.cwd(), 'data', master.logoUrl.replace(/^\//, ''));
      if (fs.existsSync(masterPath)) {
        if (!client.logoUrl || client.logoUrl.trim() === '' || client.logoUrl.includes('cli_cli_')) {
          return master.logoUrl;
        }
      }
    }

    // 2. If client already has a valid logoUrl:
    if (client.logoUrl && client.logoUrl.trim() !== '') {
      const url = client.logoUrl.trim();
      if (url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), 'data', url.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          return url;
        }
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      } else if (url.startsWith('data:') || url.startsWith('<svg')) {
        return this.saveImageToUploads(url, `cli_${client.id}`);
      }
    }

    if (master && master.logoUrl) {
      const masterPath = path.join(process.cwd(), 'data', master.logoUrl.replace(/^\//, ''));
      if (fs.existsSync(masterPath)) {
        return master.logoUrl;
      }
    }

    // 3. Check if matching SVG file exists in uploads/logos
    const cleanId = client.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const specificFile = path.join(uploadDir, `cli_${cleanId}_logo.svg`);
    if (fs.existsSync(specificFile)) {
      return `/uploads/logos/cli_${cleanId}_logo.svg`;
    }

    const cleanName = client.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const nameFile = path.join(uploadDir, `${cleanName}_logo.svg`);
    if (fs.existsSync(nameFile)) {
      return `/uploads/logos/${cleanName}_logo.svg`;
    }

    // 4. Generate SVG logo and save to disk
    const svgContent = this.generateClientLogoSvg(client.name, client.companyName);
    fs.writeFileSync(specificFile, svgContent, 'utf-8');
    return `/uploads/logos/cli_${cleanId}_logo.svg`;
  }

  public saveImageToUploads(dataUrlOrBuffer: string, prefix = 'logo'): string {
    try {
      if (!dataUrlOrBuffer) return '';
      const trimmed = dataUrlOrBuffer.trim();
      if (!trimmed) return '';
      // Se já for uma URL estática de uploads ou URL web externa, mantém diretamente
      if (trimmed.startsWith('/uploads/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }

      const uploadDir = path.join(process.cwd(), 'data', 'uploads', 'logos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      let ext = 'png';
      let buffer: Buffer;

      if (trimmed.startsWith('data:image/')) {
        const matches = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (matches) {
          ext = matches[1].toLowerCase();
          if (ext === 'jpeg') ext = 'jpg';
          if (ext === 'svg+xml') ext = 'svg';
          buffer = Buffer.from(matches[2], 'base64');
        } else if (trimmed.includes('svg')) {
          ext = 'svg';
          let svgContent = trimmed.replace(/^data:image\/svg\+xml;?(utf8)?,?/i, '');
          try {
            svgContent = decodeURIComponent(svgContent);
          } catch {
            // Keep raw if decodeURIComponent fails
          }
          buffer = Buffer.from(svgContent, 'utf-8');
        } else {
          return trimmed;
        }
      } else if (trimmed.startsWith('<svg')) {
        ext = 'svg';
        buffer = Buffer.from(trimmed, 'utf-8');
      } else {
        return trimmed;
      }

      const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanPrefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}.${ext}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/logos/${filename}`;
    } catch (err) {
      console.error('Error saving image to uploads:', err);
      return dataUrlOrBuffer;
    }
  }

  public saveRegistry(reg: CreatedRegistry) {
    try {
      reg.lastUpdated = new Date().toISOString();
      fs.writeFileSync(CREATED_REGISTRY_FILE, JSON.stringify(reg, null, 2), 'utf-8');

      // Sempre manter o snapshot mestre sincronizado e protegido
      try {
        const snapshot = {
          clients: Object.values(reg.clients || {}),
          qrcodes: Object.values(reg.qrcodes || {}),
          adminUser: reg.adminUser,
          lastUpdated: reg.lastUpdated,
          protectedGuarantee:
            'Clientes e QR Codes criados pelo administrador são protegidos contra remoção ou alteração acidental em reparos e atualizações do sistema.',
        };
        fs.writeFileSync(MASTER_SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
      } catch (err) {
        console.error('Error saving master snapshot file:', err);
      }
    } catch (err) {
      console.error('Error saving created registry file:', err);
    }
  }

  public registerClient(client: Client) {
    const reg = this.loadRegistry();
    reg.clients[client.id] = { ...client };
    this.saveRegistry(reg);
  }

  public unregisterClient(clientId: string) {
    const reg = this.loadRegistry();
    let modified = false;
    if (reg.clients && reg.clients[clientId]) {
      delete reg.clients[clientId];
      modified = true;
    }
    // Clean up any associated QR codes in registry
    if (reg.qrcodes) {
      Object.keys(reg.qrcodes).forEach((qrId) => {
        if (reg.qrcodes[qrId]?.clientId === clientId) {
          delete reg.qrcodes[qrId];
          modified = true;
        }
      });
    }
    if (modified) {
      this.saveRegistry(reg);
    }
  }

  public registerQRCode(qr: QRCodeItem) {
    const reg = this.loadRegistry();
    reg.qrcodes[qr.id] = { ...qr };
    this.saveRegistry(reg);
  }

  public unregisterQRCode(qrId: string) {
    const reg = this.loadRegistry();
    if (reg.qrcodes && reg.qrcodes[qrId]) {
      delete reg.qrcodes[qrId];
      this.saveRegistry(reg);
    }
  }

  private loadData(): DatabaseSchema {
    let baseData: DatabaseSchema | null = null;

    // 1. Try reading primary DATA_FILE (store.json)
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.clients)) {
          baseData = parsed;
        }
      }
    } catch (err) {
      console.error('Error reading primary data file, trying backup:', err);
    }

    // 2. Try reading BACKUP_FILE (store.backup.json) if primary failed
    if (!baseData) {
      try {
        if (fs.existsSync(BACKUP_FILE)) {
          const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.clients)) {
            baseData = parsed;
          }
        }
      } catch (err) {
        console.error('Error reading backup data file:', err);
      }
    }

    // 3. Try reading PERSISTENT_SNAPSHOT_FILE (store.persistent.json) if both failed
    if (!baseData) {
      try {
        if (fs.existsSync(PERSISTENT_SNAPSHOT_FILE)) {
          const content = fs.readFileSync(PERSISTENT_SNAPSHOT_FILE, 'utf-8');
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.clients)) {
            baseData = parsed;
          }
        }
      } catch (err) {
        console.error('Error reading persistent snapshot file:', err);
      }
    }

    if (!baseData) {
      baseData = generateInitialData();
    }

    const registry = this.loadRegistry();
    const deletedRegistry = this.loadDeletedRegistry();

    // Ensure array structures
    if (!Array.isArray(baseData.clients)) baseData.clients = [];
    if (!Array.isArray(baseData.qrcodes)) baseData.qrcodes = [];
    if (!Array.isArray(baseData.scans)) baseData.scans = [];
    if (!Array.isArray(baseData.history)) baseData.history = [];
    if (!baseData.settings) baseData.settings = { ...defaultSettings };

    // Purga imediata de clientes fictícios ou de teste (ex: Tokyo Coffee Lab)
    const isFictional = (id?: string, name?: string) =>
      id === 'cli_1791623610427_47d40b' ||
      name === 'Tokyo Coffee Lab' ||
      name === 'Restaurante Sabor & Arte Tokyo';

    // Regra estrita: NUNCA inserir ou tolerar QR codes de teste
    const isTestQR = (q?: any) =>
      !q ||
      q.id === 'qr_1791791581792_f83bb1' ||
      q.id === 'qr_1791970083519_347d8f' ||
      q.shortCode === 'teste-persistencia' ||
      q.shortCode === 'teste-wanka' ||
      q.name === 'QR Teste Persistencia' ||
      q.name === 'QR Teste Integridade' ||
      (typeof q.name === 'string' && q.name.toLowerCase().startsWith('qr teste'));

    baseData.clients = baseData.clients.filter((c) => !isFictional(c.id, c.name));
    baseData.qrcodes = baseData.qrcodes.filter((q) => !isTestQR(q));
    if (registry.clients) {
      Object.keys(registry.clients).forEach((k) => {
        if (isFictional(k, registry.clients[k]?.name)) {
          delete registry.clients[k];
        }
      });
    }
    if (registry.qrcodes) {
      Object.keys(registry.qrcodes).forEach((k) => {
        if (isTestQR(registry.qrcodes[k])) {
          delete registry.qrcodes[k];
        }
      });
    }

    // MULTI-SOURCE HARVESTING: Collect any QR code or client from secondary backup & snapshot files
    const secondarySources = [BACKUP_FILE, PERSISTENT_SNAPSHOT_FILE, MASTER_SNAPSHOT_FILE];
    secondarySources.forEach((srcFile) => {
      try {
        if (fs.existsSync(srcFile)) {
          const content = fs.readFileSync(srcFile, 'utf-8');
          const parsed = JSON.parse(content);
          const candidateClients: Client[] = parsed?.clients
            ? Array.isArray(parsed.clients)
              ? parsed.clients
              : Object.values(parsed.clients)
            : [];
          const candidateQRs: QRCodeItem[] = parsed?.qrcodes
            ? Array.isArray(parsed.qrcodes)
              ? parsed.qrcodes
              : Object.values(parsed.qrcodes)
            : [];

          candidateClients.forEach((c) => {
            if (c?.id && !isFictional(c.id, c.name) && !registry.clients[c.id]) {
              registry.clients[c.id] = { ...c };
            }
          });

          candidateQRs.forEach((q) => {
            if (q?.id && !isTestQR(q) && !deletedRegistry.qrcodes.includes(q.id) && !registry.qrcodes[q.id]) {
              registry.qrcodes[q.id] = { ...q };
            }
          });
        }
      } catch {
        // Ignore read errors for secondary backups
      }
    });

    // A. Bootstrap registry from baseData
    baseData.clients.forEach((c) => {
      if (!registry.clients[c.id]) {
        registry.clients[c.id] = { ...c };
      }
    });

    baseData.qrcodes.forEach((q) => {
      if (!isTestQR(q) && !deletedRegistry.qrcodes.includes(q.id) && !registry.qrcodes[q.id]) {
        registry.qrcodes[q.id] = { ...q };
      }
    });

    // Master baseline entities guarantee
    MASTER_ADMIN_CREATED_ENTITIES.clients.forEach((masterClient) => {
      if (!registry.clients[masterClient.id]) {
        registry.clients[masterClient.id] = { ...masterClient };
      }
    });

    MASTER_ADMIN_CREATED_ENTITIES.qrcodes.forEach((masterQR) => {
      if (!isTestQR(masterQR) && !deletedRegistry.qrcodes.includes(masterQR.id) && !registry.qrcodes[masterQR.id]) {
        registry.qrcodes[masterQR.id] = { ...masterQR };
      }
    });

    // B. Reconcile registered clients: ENSURE ABSOLUTE LOGO RETENTION
    Object.values(registry.clients).forEach((regClient) => {
      if (isFictional(regClient.id, regClient.name)) return;
      const idx = baseData!.clients.findIndex((c) => c.id === regClient.id);
      let merged: Client;
      if (idx >= 0) {
        const existing = baseData!.clients[idx];
        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const regTime = regClient.updatedAt ? new Date(regClient.updatedAt).getTime() : 0;
        const primary = existingTime >= regTime ? existing : regClient;
        const secondary = existingTime >= regTime ? regClient : existing;

        merged = {
          ...secondary,
          ...primary,
        };

        // Resolução absoluta de logotipo: verifica dados existentes, entidades mestre ou gera SVG de alta qualidade
        const currentLogo =
          (primary.logoUrl && primary.logoUrl.trim() !== '')
            ? primary.logoUrl
            : (secondary.logoUrl && secondary.logoUrl.trim() !== '' ? secondary.logoUrl : '');
        merged.logoUrl = currentLogo;
        merged.logoUrl = this.ensureClientHasLogo(merged);

        if (!merged.password && (secondary.password || primary.password)) {
          merged.password = primary.password || secondary.password;
        }

        baseData!.clients[idx] = merged;
      } else {
        merged = { ...regClient };
        merged.logoUrl = this.ensureClientHasLogo(merged);
        baseData!.clients.push(merged);
      }
      registry.clients[regClient.id] = { ...merged };
    });

    // C. Reconcile registered QR codes: PRESERVE EVERYTHING CREATED BY ADMINISTRATOR
    Object.values(registry.qrcodes).forEach((regQR) => {
      if (isTestQR(regQR)) return;
      if (deletedRegistry.qrcodes.includes(regQR.id)) {
        return; // Nunca ressuscitar código explicitamente excluído
      }

      const idx = baseData!.qrcodes.findIndex((q) => q.id === regQR.id);
      if (idx >= 0) {
        const existing = baseData!.qrcodes[idx];
        const masterQR = MASTER_ADMIN_CREATED_ENTITIES.qrcodes.find((mq) => mq.id === regQR.id);

        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const regTime = regQR.updatedAt ? new Date(regQR.updatedAt).getTime() : 0;
        const primary = regTime >= existingTime ? regQR : existing;
        const secondary = regTime >= existingTime ? existing : regQR;

        // PRESERVAÇÃO TOTAL DE SLUGS DO ADMINISTRADOR:
        // Se houver uma slug customizada (diferente da inicial master default), ela nunca é substituída
        let chosenShortCode = (primary.shortCode || secondary.shortCode || existing.shortCode || regQR.shortCode || '').trim();
        if (regQR.shortCode && regQR.shortCode.trim() !== '' && regQR.shortCode !== masterQR?.shortCode) {
          chosenShortCode = regQR.shortCode.trim();
        } else if (existing.shortCode && existing.shortCode.trim() !== '' && existing.shortCode !== masterQR?.shortCode) {
          chosenShortCode = existing.shortCode.trim();
        }

        const merged: QRCodeItem = {
          ...secondary,
          ...primary,
          shortCode: chosenShortCode,
          destinationUrl: primary.destinationUrl || secondary.destinationUrl,
          name: primary.name || secondary.name,
          scanCount: Math.max(existing.scanCount || 0, regQR.scanCount || 0),
          status: primary.status || secondary.status || 'active',
          style: {
            ...secondary.style,
            ...primary.style,
          },
          notes: primary.notes !== undefined ? primary.notes : secondary.notes,
          clientId: primary.clientId !== undefined ? primary.clientId : secondary.clientId,
          clientName: primary.clientName || secondary.clientName,
          updatedAt:
            existing.updatedAt && regQR.updatedAt
              ? (regTime >= existingTime ? regQR.updatedAt : existing.updatedAt)
              : existing.updatedAt || regQR.updatedAt || new Date().toISOString(),
        };

        if (merged.style) {
          delete merged.style.logoUrl;
          delete merged.style.logoSize;
        }

        baseData!.qrcodes[idx] = merged;
        registry.qrcodes[regQR.id] = { ...merged };
        if (masterQR) {
          masterQR.shortCode = merged.shortCode;
          masterQR.name = merged.name;
          masterQR.destinationUrl = merged.destinationUrl;
        }
      } else {
        const masterQR = MASTER_ADMIN_CREATED_ENTITIES.qrcodes.find((mq) => mq.id === regQR.id);
        const cleanQR: QRCodeItem = {
          ...regQR,
          style: {
            ...regQR.style,
          },
        };
        if (cleanQR.style) {
          delete cleanQR.style.logoUrl;
          delete cleanQR.style.logoSize;
        }
        baseData!.qrcodes.push(cleanQR);
        registry.qrcodes[regQR.id] = { ...cleanQR };
        if (masterQR) {
          masterQR.shortCode = cleanQR.shortCode;
          masterQR.name = cleanQR.name;
          masterQR.destinationUrl = cleanQR.destinationUrl;
        }
      }
    });

    // D. Reconcile admin credentials
    if (registry.adminUser) {
      baseData.adminUser = {
        ...(baseData.adminUser || {}),
        ...registry.adminUser,
      };
    } else if (baseData.adminUser) {
      registry.adminUser = { ...baseData.adminUser };
    }

    this.saveRegistry(registry);
    this.saveData(baseData);
    return baseData;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      if (Array.isArray(data?.qrcodes)) {
        data.qrcodes.forEach((q) => {
          const master = MASTER_ADMIN_CREATED_ENTITIES.qrcodes.find((mq) => mq.id === q.id);
          if (master) {
            master.shortCode = q.shortCode;
            master.destinationUrl = q.destinationUrl;
            master.name = q.name;
            master.status = q.status;
          }
        });
      }

      const content = JSON.stringify(data, null, 2);
      fs.writeFileSync(DATA_FILE, content, 'utf-8');
      try {
        fs.writeFileSync(BACKUP_FILE, content, 'utf-8');
      } catch (err) {
        console.error('Error saving backup file:', err);
      }
      try {
        fs.writeFileSync(PERSISTENT_SNAPSHOT_FILE, content, 'utf-8');
      } catch (err) {
        console.error('Error saving persistent snapshot file:', err);
      }
      try {
        const masterSnapshotContent = JSON.stringify({
          clients: data.clients || [],
          qrcodes: data.qrcodes || [],
          adminUser: data.adminUser,
          lastUpdated: new Date().toISOString(),
          protectedGuarantee: 'Slugs e entidades alteradas pelo administrador master preservadas com segurança total.',
        }, null, 2);
        fs.writeFileSync(MASTER_SNAPSHOT_FILE, masterSnapshotContent, 'utf-8');
      } catch (err) {
        console.error('Error saving master snapshot file:', err);
      }
    } catch (err) {
      console.error('Error saving data to file:', err);
    }
  }

  // --- RESTAURAR SISTEMA (PRESERVAÇÃO TOTAL DE CLIENTES E QR CODES CRIADOS) ---
  // Restaura configurações padrão e preferências da plataforma sem alterar clientes e QR codes criados.
  public restoreSystem(options?: {
    restoreSettings?: boolean;
    clearScans?: boolean;
    clearHistory?: boolean;
    userName?: string;
  }): {
    success: boolean;
    message: string;
    preservedClientsCount: number;
    preservedQRCodesCount: number;
  } {
    const {
      restoreSettings = true,
      clearScans = false,
      clearHistory = false,
      userName = 'Administrador',
    } = options || {};

    // 1. GARANTIA ABSOLUTA: Sincronizar clientes reais com preservação de LOGOS e sem clientes fictícios
    const registry = this.loadRegistry();

    // Eliminar qualquer cliente fictício ou de teste (ex: Tokyo Coffee Lab)
    const isFictional = (id?: string, name?: string) =>
      id === 'cli_1791623610427_47d40b' ||
      name === 'Tokyo Coffee Lab' ||
      name === 'Restaurante Sabor & Arte Tokyo';

    this.data.clients = this.data.clients.filter((c) => !isFictional(c.id, c.name));
    if (registry.clients) {
      Object.keys(registry.clients).forEach((k) => {
        if (isFictional(k, registry.clients[k]?.name)) {
          delete registry.clients[k];
        }
      });
    }

    // Garantir que todos os clientes registrados estão presentes em this.data.clients sem perder logos
    Object.values(registry.clients).forEach((regClient) => {
      if (isFictional(regClient.id, regClient.name)) return;
      const idx = this.data.clients.findIndex((c) => c.id === regClient.id);
      if (idx === -1) {
        const clientWithLogo = { ...regClient };
        clientWithLogo.logoUrl = this.ensureClientHasLogo(clientWithLogo);
        this.data.clients.push(clientWithLogo);
        registry.clients[regClient.id] = { ...clientWithLogo };
      } else {
        const c = this.data.clients[idx];
        c.logoUrl = this.ensureClientHasLogo(c);
        registry.clients[c.id] = { ...c };
      }
    });

    // Preservar estritamente todos os dados e logos dos clientes legítimos exatamente como inseridos pelo admin
    this.data.clients.forEach((c) => {
      c.logoUrl = this.ensureClientHasLogo(c);
      registry.clients[c.id] = {
        ...(registry.clients[c.id] || {}),
        ...c,
        logoUrl: c.logoUrl,
      };
    });

    // Garantir que todos os QR codes registrados estão presentes em this.data.qrcodes com preservação estrita de slugs
    Object.values(registry.qrcodes).forEach((regQR) => {
      const idx = this.data.qrcodes.findIndex((q) => q.id === regQR.id);
      if (idx === -1) {
        this.data.qrcodes.push({ ...regQR });
      } else {
        const q = this.data.qrcodes[idx];
        const existingTime = q.updatedAt ? new Date(q.updatedAt).getTime() : 0;
        const regTime = regQR.updatedAt ? new Date(regQR.updatedAt).getTime() : 0;
        const primary = regTime >= existingTime ? regQR : q;
        const secondary = regTime >= existingTime ? q : regQR;

        // PRESERVAÇÃO TOTAL: a slug alterada pelo admin master é sagrada
        if (primary.shortCode && primary.shortCode.trim() !== '') {
          q.shortCode = primary.shortCode.trim();
        } else if (secondary.shortCode) {
          q.shortCode = secondary.shortCode.trim();
        }
        q.destinationUrl = primary.destinationUrl || secondary.destinationUrl;
        q.name = primary.name || secondary.name;

        if (q.style) {
          delete q.style.logoUrl;
          delete q.style.logoSize;
        }
      }
    });

    this.data.qrcodes.forEach((q) => {
      registry.qrcodes[q.id] = { ...q };
      const masterQR = MASTER_ADMIN_CREATED_ENTITIES.qrcodes.find((mq) => mq.id === q.id);
      if (masterQR) {
        masterQR.shortCode = q.shortCode;
        masterQR.name = q.name;
        masterQR.destinationUrl = q.destinationUrl;
      }
    });
    this.saveRegistry(registry);

    // 2. Restaurar apenas as configurações visuais e preferências da plataforma (SEM tocar em clientes ou QR codes)
    if (restoreSettings) {
      this.data.settings = { ...defaultSettings };
    }

    // 3. Regra de ouro: CLIENTES E QR CODES CRIADOS NUNCA SÃO ALTERADOS NA RESTAURAÇÃO DO SISTEMA
    // Preservação rigorosa de todos os atributos: IDs, nomes, links de destino, slugs dinâmicos,
    // métricas de leitura (scanCount), senhas, e-mails, telefones, status ativo/pausado e estilos.
    // Opcionalmente, apenas logs de eventos de acessos brutos (scans) podem ser limpos se solicitado,
    // sem jamais alterar as propriedades dos QR codes criados.
    if (clearScans) {
      this.data.scans = [];
    }

    // 4. Opcional: Reiniciar histórico de auditoria se solicitado
    if (clearHistory) {
      this.data.history = [];
    }

    const preservedClientsCount = this.data.clients.length;
    const preservedQRCodesCount = this.data.qrcodes.length;

    // 5. Registro de auditoria documentando a integridade dos dados e logotipos
    this.logHistory({
      action: 'settings_updated',
      title: 'Sistema restaurado (clientes, logos e QR codes intactos)',
      description: `O sistema foi restaurado com sucesso. Todos os ${preservedClientsCount} clientes reais, seus logotipos e os ${preservedQRCodesCount} QR Codes criados foram integralmente mantidos sem clientes fictícios.`,
      userName,
      targetType: 'settings',
    });

    this.saveData();

    return {
      success: true,
      message: `Sistema restaurado com sucesso! ${preservedClientsCount} clientes reais, logotipos cadastrados e ${preservedQRCodesCount} QR Codes foram preservados intactos. Nenhum cliente fictício incluído.`,
      preservedClientsCount,
      preservedQRCodesCount,
    };
  }

  public getSystemBackupStatus() {
    const registry = this.loadRegistry();
    return {
      protectedClientsCount: Object.keys(registry.clients).length || this.data.clients.length,
      protectedQRCodesCount: Object.keys(registry.qrcodes).length || this.data.qrcodes.length,
      totalClients: this.data.clients.length,
      totalQRCodes: this.data.qrcodes.length,
      lastRegistrySync: registry.lastUpdated || new Date().toISOString(),
      storageStatus: 'protected',
      guarantee: 'Clientes e QR codes criados são mantidos intactos e nunca alterados na restauração do sistema.',
    };
  }

  public syncCreatedEntities(clients?: Client[], qrcodes?: QRCodeItem[]) {
    let syncedClients = 0;
    let syncedQRCodes = 0;

    const isFictional = (id?: string, name?: string) =>
      id === 'cli_1791623610427_47d40b' ||
      name === 'Tokyo Coffee Lab' ||
      name === 'Restaurante Sabor & Arte Tokyo';

    if (Array.isArray(clients) && clients.length > 0) {
      clients.forEach((c) => {
        if (!c || !c.id || isFictional(c.id, c.name)) return;
        const existingIdx = this.data.clients.findIndex((item) => item.id === c.id);
        if (existingIdx === -1) {
          this.data.clients.push({ ...c });
          this.registerClient(c);
          syncedClients++;
        } else {
          const existing = this.data.clients[existingIdx];
          let updated = false;

          // Preservar/atualizar logotipo do cliente
          if (c.logoUrl && c.logoUrl.trim() !== '' && c.logoUrl !== existing.logoUrl) {
            existing.logoUrl = c.logoUrl;
            updated = true;
          }

          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const incomingTime = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
          if (incomingTime >= existingTime) {
            const currentPassword = existing.password;
            const currentLogo = existing.logoUrl;
            Object.assign(existing, c);
            if (!existing.password && currentPassword) {
              existing.password = currentPassword;
            }
            if ((!existing.logoUrl || existing.logoUrl.trim() === '') && currentLogo) {
              existing.logoUrl = currentLogo;
            }
            existing.logoUrl = this.ensureClientHasLogo(existing);
            updated = true;
          }

          if (updated) {
            this.registerClient(existing);
            syncedClients++;
          }
        }
      });
    }

    const isTestQR = (q?: any) =>
      !q ||
      q.id === 'qr_1791791581792_f83bb1' ||
      q.id === 'qr_1791970083519_347d8f' ||
      q.shortCode === 'teste-persistencia' ||
      q.shortCode === 'teste-wanka' ||
      q.name === 'QR Teste Persistencia' ||
      q.name === 'QR Teste Integridade' ||
      (typeof q.name === 'string' && q.name.toLowerCase().startsWith('qr teste'));

    const deletedRegistry = this.loadDeletedRegistry();

    if (Array.isArray(qrcodes) && qrcodes.length > 0) {
      qrcodes.forEach((q) => {
        if (!q || !q.id || !q.name || isTestQR(q)) return;
        if (deletedRegistry.qrcodes.includes(q.id)) return;
        const existingIdx = this.data.qrcodes.findIndex((item) => item.id === q.id);
        if (existingIdx === -1) {
          const newQRItem = { ...q };
          if (newQRItem.shortCode) {
            newQRItem.shortCode = newQRItem.shortCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
          }
          this.data.qrcodes.unshift(newQRItem);
          this.registerQRCode(newQRItem);
          syncedQRCodes++;
        } else {
          const existing = this.data.qrcodes[existingIdx];
          let qrUpdated = false;

          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const incomingTime = q.updatedAt ? new Date(q.updatedAt).getTime() : 0;
          if (incomingTime >= existingTime) {
            existing.name = q.name || existing.name;
            existing.destinationUrl = q.destinationUrl || existing.destinationUrl;
            existing.status = q.status || existing.status;
            if (q.shortCode && q.shortCode.trim() !== '') {
              existing.shortCode = q.shortCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
            }
            existing.style = {
              ...existing.style,
              ...(q.style || {}),
            };
            if (existing.style) {
              delete existing.style.logoUrl;
              delete existing.style.logoSize;
            }
            existing.notes = q.notes || existing.notes;
            existing.clientId = q.clientId !== undefined ? q.clientId : existing.clientId;
            existing.clientName = q.clientName || existing.clientName;
            existing.updatedAt = q.updatedAt || new Date().toISOString();
            qrUpdated = true;
          }

          // If incoming shortCode is present and different from existing, always preserve the explicit slug
          if (q.shortCode && q.shortCode.trim() !== '' && q.shortCode.trim().toLowerCase() !== (existing.shortCode || '').toLowerCase()) {
            existing.shortCode = q.shortCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
            qrUpdated = true;
          }

          existing.scanCount = Math.max(existing.scanCount || 0, q.scanCount || 0);
          if (qrUpdated) {
            const masterQR = MASTER_ADMIN_CREATED_ENTITIES.qrcodes.find((mq) => mq.id === existing.id);
            if (masterQR) {
              masterQR.shortCode = existing.shortCode;
              masterQR.name = existing.name;
              masterQR.destinationUrl = existing.destinationUrl;
            }
            this.registerQRCode(existing);
            syncedQRCodes++;
          }
        }
      });
    }

    if (syncedClients > 0 || syncedQRCodes > 0) {
      this.saveData();
    }

    return {
      success: true,
      syncedClients,
      syncedQRCodes,
      totalClients: this.data.clients.length,
      totalQRCodes: this.data.qrcodes.length,
    };
  }

  // --- CLIENTS ---
  public getClients(): Client[] {
    return this.data.clients;
  }

  public getClientById(id: string): Client | undefined {
    return this.data.clients.find((c) => c.id === id);
  }

  public getClientByEmail(email: string): Client | undefined {
    const clean = email.trim().toLowerCase();
    return this.data.clients.find((c) => c.email.trim().toLowerCase() === clean);
  }

  public getClientPortalData(clientId: string): ClientPortalData | null {
    if (!clientId) return null;
    let client = this.getClientById(clientId);
    if (!client) {
      client = this.getClientByEmail(clientId);
    }
    if (!client) {
      const clean = clientId.trim().toLowerCase();
      client = this.data.clients.find(
        (c) =>
          c.id.toLowerCase() === clean ||
          c.email.trim().toLowerCase() === clean ||
          c.name.trim().toLowerCase() === clean ||
          (c.companyName && c.companyName.trim().toLowerCase() === clean)
      );
    }
    if (!client) return null;

    const actualId = client.id;
    const qrcodes = this.data.qrcodes.filter((qr) => qr.clientId === actualId);
    const qrIds = new Set(qrcodes.map((q) => q.id));
    const scans = this.data.scans.filter((s) => s.clientId === actualId || qrIds.has(s.qrCodeId));

    const totalQRCodes = qrcodes.length;
    const activeQRCodes = qrcodes.filter((q) => q.status === 'active').length;
    const inactiveQRCodes = totalQRCodes - activeQRCodes;
    const totalScans = qrcodes.reduce((acc, q) => acc + (q.scanCount || 0), 0);

    const now = Date.now();
    const h24 = 24 * 3600 * 1000;
    const d7 = 7 * h24;
    const d30 = 30 * h24;

    const scansLast24h = scans.filter((s) => now - new Date(s.timestamp).getTime() <= h24).length;
    const scansLast7d = scans.filter((s) => now - new Date(s.timestamp).getTime() <= d7).length;
    const scansLast30d = scans.filter((s) => now - new Date(s.timestamp).getTime() <= d30).length;

    // Daily breakdown for last 14 days
    const dailyScansMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * h24);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      dailyScansMap[key] = 0;
    }

    scans.forEach((s) => {
      const d = new Date(s.timestamp);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (dailyScansMap[key] !== undefined) {
        dailyScansMap[key]++;
      }
    });

    const dailyScans = Object.entries(dailyScansMap).map(([date, scans]) => ({ date, scans }));

    // Devices distribution
    const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
    const osCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const hourCounts: Record<string, number> = {};

    for (let h = 0; h < 24; h++) {
      hourCounts[`${h.toString().padStart(2, '0')}h`] = 0;
    }

    scans.forEach((s) => {
      deviceCounts[s.device] = (deviceCounts[s.device] || 0) + 1;
      osCounts[s.os] = (osCounts[s.os] || 0) + 1;
      browserCounts[s.browser] = (browserCounts[s.browser] || 0) + 1;
      const cityLabel = s.city && s.city !== 'Localização em Análise'
        ? (s.region ? `${s.city} (${s.region})` : s.city)
        : (s.country || 'Não Identificado');
      cityCounts[cityLabel] = (cityCounts[cityLabel] || 0) + 1;

      const hour = new Date(s.timestamp).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}h`;
      if (hourCounts[hourKey] !== undefined) {
        hourCounts[hourKey]++;
      }
    });

    const devicesData = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));
    const operatingSystems = Object.entries(osCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const browsers = Object.entries(browserCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const citiesData = Object.entries(cityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const peakHoursData = Object.entries(hourCounts).map(([hour, scans]) => ({ hour, scans }));

    return {
      client,
      qrcodes,
      stats: {
        totalQRCodes,
        activeQRCodes,
        inactiveQRCodes,
        totalScans,
        scansLast24h,
        scansLast7d,
        scansLast30d,
      },
      dailyScans,
      devicesData,
      operatingSystems,
      browsers,
      citiesData,
      peakHoursData,
      recentScans: scans.slice(0, 30),
    };
  }

  public createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>, userName = 'Administrador'): Client {
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (clientData.password) {
      newClient.password = String(clientData.password).trim();
    }
    if (clientData.accessPin) {
      newClient.accessPin = String(clientData.accessPin).trim();
    }
    if (newClient.logoUrl) {
      newClient.logoUrl = this.saveImageToUploads(newClient.logoUrl, `cli_${newClient.id}`);
    }
    newClient.logoUrl = this.ensureClientHasLogo(newClient);
    this.data.clients.unshift(newClient);
    this.registerClient(newClient);
    this.logHistory({
      action: 'client_created',
      title: 'Novo cliente cadastrado',
      description: `Cliente "${newClient.name}" cadastrado com sucesso.`,
      userName,
      targetId: newClient.id,
      targetType: 'client',
    });
    this.saveData();
    return newClient;
  }

  public updateClient(id: string, updates: Partial<Client>, userName = 'Administrador'): Client | null {
    const index = this.data.clients.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = this.data.clients[index];
    let resolvedLogo = existing.logoUrl;
    if (updates.logoUrl !== undefined && updates.logoUrl.trim() !== '') {
      resolvedLogo = this.saveImageToUploads(updates.logoUrl, `cli_${id}`);
    }

    const updated: Client = {
      ...existing,
      ...updates,
      logoUrl: resolvedLogo || existing.logoUrl || '',
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    updated.logoUrl = this.ensureClientHasLogo(updated);

    if (updates.password !== undefined && updates.password !== null) {
      const p = String(updates.password).trim();
      if (p !== '') {
        updated.password = p;
      }
    }
    if (updates.accessPin !== undefined && updates.accessPin !== null) {
      const pin = String(updates.accessPin).trim();
      if (pin !== '') {
        updated.accessPin = pin;
      }
    }

    this.data.clients[index] = updated;
    this.registerClient(updated);

    // Update client name inside qrcodes if name changed
    if (updates.name && updates.name !== existing.name) {
      this.data.qrcodes.forEach((qr) => {
        if (qr.clientId === id) {
          qr.clientName = updates.name;
          this.registerQRCode(qr);
        }
      });
    }

    this.logHistory({
      action: 'client_updated',
      title: 'Cliente atualizado',
      description: `Dados cadastrais de "${updated.name}" foram modificados.`,
      userName,
      targetId: id,
      targetType: 'client',
    });
    this.saveData();
    return updated;
  }

  public deleteClient(id: string, userName = 'Administrador'): boolean {
    const index = this.data.clients.findIndex((c) => c.id === id);
    if (index === -1) {
      this.unregisterClient(id);
      return false;
    }

    const client = this.data.clients[index];
    this.data.clients.splice(index, 1);
    this.unregisterClient(id);

    // Delete associated qrcodes from memory and from registry
    const associatedQRs = this.data.qrcodes.filter((qr) => qr.clientId === id);
    associatedQRs.forEach((qr) => {
      this.unregisterQRCode(qr.id);
      this.data.scans = this.data.scans.filter((s) => s.qrCodeId !== qr.id);
    });
    this.data.qrcodes = this.data.qrcodes.filter((qr) => qr.clientId !== id);
    this.data.scans = this.data.scans.filter((s) => s.clientId !== id);

    this.logHistory({
      action: 'client_deleted',
      title: 'Cliente excluído',
      description: `Cliente "${client.name}" e seus QR Codes foram removidos do sistema.`,
      userName,
      targetId: id,
      targetType: 'client',
    });
    this.saveData();
    return true;
  }

  // --- QR CODES ---
  public getQRCodes(clientId?: string): QRCodeItem[] {
    if (clientId) {
      return this.data.qrcodes.filter((qr) => qr.clientId === clientId);
    }
    return this.data.qrcodes;
  }

  public getQRCodeById(id: string): QRCodeItem | undefined {
    return this.data.qrcodes.find((qr) => qr.id === id);
  }

  public getQRCodeByShortCode(shortCode: string): QRCodeItem | undefined {
    return this.data.qrcodes.find((qr) => qr.shortCode.toLowerCase() === shortCode.toLowerCase());
  }

  public createQRCode(
    qrData: Omit<QRCodeItem, 'id' | 'createdAt' | 'updatedAt' | 'scanCount' | 'lastScannedAt'>,
    userName = 'Administrador'
  ): QRCodeItem {
    const client = qrData.clientId ? this.getClientById(qrData.clientId) : undefined;
    // Ensure clean slug
    let shortCode = (qrData.shortCode || crypto.randomBytes(4).toString('hex'))
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '-');

    // Ensure uniqueness
    if (this.data.qrcodes.some((q) => q.shortCode === shortCode)) {
      shortCode = `${shortCode}-${crypto.randomBytes(2).toString('hex')}`;
    }

    const newQR: QRCodeItem = {
      ...qrData,
      id: `qr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      shortCode,
      clientId: qrData.clientId || '',
      clientName: client?.name || 'Não vinculado',
      scanCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (newQR.style?.logoUrl) {
      newQR.style.logoUrl = this.saveImageToUploads(newQR.style.logoUrl, `qr_${newQR.id}`);
    }

    this.removeDeletedQRCode(newQR.id);
    this.data.qrcodes.unshift(newQR);
    this.registerQRCode(newQR);
    this.logHistory({
      action: 'qr_created',
      title: 'QR Code dinâmico criado',
      description: client
        ? `QR Code "${newQR.name}" criado para o cliente "${client.name}". Destino: ${newQR.destinationUrl}`
        : `QR Code avulso "${newQR.name}" criado sem cliente vinculado. Destino: ${newQR.destinationUrl}`,
      userName,
      targetId: newQR.id,
      targetType: 'qrcode',
    });
    this.saveData();
    return newQR;
  }

  public updateQRCode(id: string, updates: Partial<QRCodeItem>, userName = 'Administrador'): QRCodeItem | null {
    const index = this.data.qrcodes.findIndex((q) => q.id === id);
    if (index === -1) return null;

    const existing = this.data.qrcodes[index];
    const isUrlChanged = updates.destinationUrl && updates.destinationUrl !== existing.destinationUrl;
    const isStatusChanged = updates.status && updates.status !== existing.status;

    let clientName = existing.clientName;
    if (updates.clientId !== undefined) {
      if (updates.clientId && updates.clientId.trim() !== '') {
        const cl = this.getClientById(updates.clientId);
        clientName = cl ? cl.name : 'Cliente';
      } else {
        clientName = 'Não vinculado';
      }
    }

    const resolvedStyle = updates.style ? { ...updates.style } : { ...existing.style };
    if (resolvedStyle?.logoUrl) {
      resolvedStyle.logoUrl = this.saveImageToUploads(resolvedStyle.logoUrl, `qr_${id}`);
    }

    const isShortCodeChanged =
      updates.shortCode !== undefined &&
      updates.shortCode.trim() !== '' &&
      updates.shortCode.trim().toLowerCase() !== existing.shortCode.toLowerCase();

    let finalShortCode = existing.shortCode;
    if (updates.shortCode !== undefined && updates.shortCode.trim() !== '') {
      finalShortCode = updates.shortCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    }

    const updated: QRCodeItem = {
      ...existing,
      ...updates,
      shortCode: finalShortCode,
      style: resolvedStyle,
      clientId: updates.clientId !== undefined ? updates.clientId : existing.clientId,
      clientName,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    this.data.qrcodes[index] = updated;
    this.registerQRCode(updated);

    // Também manter MASTER_ADMIN_CREATED_ENTITIES sincronizado em memória para nunca resetar slugs
    const masterEntity = MASTER_ADMIN_CREATED_ENTITIES.qrcodes.find((mq) => mq.id === id);
    if (masterEntity) {
      masterEntity.shortCode = updated.shortCode;
      masterEntity.name = updated.name;
      masterEntity.destinationUrl = updated.destinationUrl;
    }

    if (isShortCodeChanged) {
      this.logHistory({
        action: 'qr_updated',
        title: 'Slug do QR Code alterada',
        description: `Slug / URL dinâmica alterada de "/r/${existing.shortCode}" para "/r/${updated.shortCode}".`,
        userName,
        targetId: id,
        targetType: 'qrcode',
      });
    }

    if (isUrlChanged) {
      this.logHistory({
        action: 'qr_url_changed',
        title: 'Destino do QR Code alterado',
        description: `Nova URL de destino configurada para "${updated.name}": ${updated.destinationUrl} (sem necessidade de reimpressão)`,
        userName,
        targetId: id,
        targetType: 'qrcode',
      });
    } else if (isStatusChanged) {
      this.logHistory({
        action: updated.status === 'active' ? 'qr_activated' : 'qr_deactivated',
        title: updated.status === 'active' ? 'QR Code ativado' : 'QR Code pausado',
        description: `QR Code "${updated.name}" agora está ${updated.status === 'active' ? 'ativo' : 'pausado'}.`,
        userName,
        targetId: id,
        targetType: 'qrcode',
      });
    }

    this.saveData();
    return updated;
  }

  public assignQRCodeToClient(
    id: string,
    clientId: string | null | undefined,
    userName = 'Administrador'
  ): QRCodeItem | null {
    const index = this.data.qrcodes.findIndex((q) => q.id === id);
    if (index === -1) return null;

    const existing = this.data.qrcodes[index];
    const cleanClientId = (clientId || '').trim();

    if (!cleanClientId) {
      // Unassign / unlink
      existing.clientId = '';
      existing.clientName = 'Não vinculado';
      existing.updatedAt = new Date().toISOString();
      this.registerQRCode(existing);
      this.logHistory({
        action: 'qr_unassigned',
        title: 'QR Code desvinculado de cliente',
        description: `QR Code "${existing.name}" foi desvinculado e agora está avulso.`,
        userName,
        targetId: existing.id,
        targetType: 'qrcode',
      });
    } else {
      const client = this.getClientById(cleanClientId);
      existing.clientId = cleanClientId;
      existing.clientName = client ? client.name : 'Cliente';
      existing.updatedAt = new Date().toISOString();
      this.registerQRCode(existing);
      this.logHistory({
        action: 'qr_assigned',
        title: 'QR Code atribuído a cliente',
        description: `QR Code "${existing.name}" foi atribuído ao cliente "${existing.clientName}".`,
        userName,
        targetId: existing.id,
        targetType: 'qrcode',
      });
    }

    this.saveData();
    return existing;
  }

  public duplicateQRCode(id: string, userName = 'Administrador'): QRCodeItem | null {
    const original = this.getQRCodeById(id);
    if (!original) return null;

    const newCode = `${original.shortCode}-copy-${crypto.randomBytes(2).toString('hex')}`;
    const duplicated: QRCodeItem = {
      ...original,
      id: `qr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      name: `${original.name} (Cópia)`,
      shortCode: newCode,
      scanCount: 0,
      lastScannedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.qrcodes.unshift(duplicated);
    this.registerQRCode(duplicated);
    this.logHistory({
      action: 'qr_duplicated',
      title: 'QR Code duplicado',
      description: `Criada cópia de "${original.name}" com novo código dinâmico "${newCode}".`,
      userName,
      targetId: duplicated.id,
      targetType: 'qrcode',
    });
    this.saveData();
    return duplicated;
  }

  public deleteQRCode(id: string, userName = 'Administrador'): boolean {
    const cleanId = (id || '').trim();
    const index = this.data.qrcodes.findIndex((q) => q.id === cleanId);
    let itemName = cleanId;
    let shortCode = '';

    if (index !== -1) {
      const item = this.data.qrcodes[index];
      itemName = item.name;
      shortCode = item.shortCode;
      this.data.qrcodes.splice(index, 1);
    }

    this.unregisterQRCode(cleanId);
    this.addDeletedQRCode(cleanId);
    this.data.scans = this.data.scans.filter((s) => s.qrCodeId !== cleanId);

    // Also remove from MASTER_ADMIN_CREATED_ENTITIES if present in memory
    const masterIdx = MASTER_ADMIN_CREATED_ENTITIES.qrcodes.findIndex((mq) => mq.id === cleanId);
    if (masterIdx !== -1) {
      MASTER_ADMIN_CREATED_ENTITIES.qrcodes.splice(masterIdx, 1);
    }

    this.logHistory({
      action: 'qr_deleted',
      title: 'QR Code excluído',
      description: `QR Code "${itemName}"${shortCode ? ` (slug: ${shortCode})` : ''} foi removido com sucesso.`,
      userName,
      targetId: cleanId,
      targetType: 'qrcode',
    });
    this.saveData();
    return true;
  }

  // --- SCANS ---
  public recordScan(
    qr: QRCodeItem,
    meta: {
      ip: string;
      userAgent: string;
      referrer?: string;
      geo?: {
        country?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        latitude?: number;
        longitude?: number;
        isp?: string;
      };
    }
  ): ScanRecord {
    // Parse user agent
    const ua = meta.userAgent || '';
    let device: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
    if (/iPad|Tablet|PlayBook/i.test(ua)) {
      device = 'Tablet';
    } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
      device = 'Mobile';
    }

    let os = 'Outro';
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Windows NT/i.test(ua)) os = 'Windows';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Navegador';
    if (/Chrome|CriOS/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = device === 'Mobile' ? 'Chrome Mobile' : 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
    else if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';

    const country = meta.geo?.country || 'Não Identificado';
    const city = meta.geo?.city || 'Localização em Análise';
    const region = meta.geo?.region;
    const postalCode = meta.geo?.postalCode;
    const latitude = meta.geo?.latitude;
    const longitude = meta.geo?.longitude;
    const isp = meta.geo?.isp;

    const scan: ScanRecord = {
      id: `scan_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      qrCodeId: qr.id,
      qrCodeName: qr.name,
      clientId: qr.clientId,
      clientName: qr.clientName || 'Cliente',
      timestamp: new Date().toISOString(),
      ip: meta.ip || '127.0.0.1',
      country,
      city,
      region,
      postalCode,
      latitude,
      longitude,
      isp,
      device,
      os,
      browser,
      referrer: meta.referrer || 'Câmera Nativa',
    };

    // Update QRCode counter & lastScannedAt
    qr.scanCount = (qr.scanCount || 0) + 1;
    qr.lastScannedAt = scan.timestamp;

    this.data.scans.unshift(scan);
    // Keep max 5000 scans in memory/file
    if (this.data.scans.length > 5000) {
      this.data.scans = this.data.scans.slice(0, 5000);
    }
    this.saveData();
    return scan;
  }

  public updateScanLocation(
    scanId: string,
    geo: {
      country?: string;
      city?: string;
      region?: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
      isp?: string;
    }
  ): boolean {
    const scan = this.data.scans.find((s) => s.id === scanId);
    if (!scan) return false;

    if (geo.country) scan.country = geo.country;
    if (geo.city) scan.city = geo.city;
    if (geo.region !== undefined) scan.region = geo.region;
    if (geo.postalCode !== undefined) scan.postalCode = geo.postalCode;
    if (geo.latitude !== undefined) scan.latitude = geo.latitude;
    if (geo.longitude !== undefined) scan.longitude = geo.longitude;
    if (geo.isp !== undefined) scan.isp = geo.isp;

    this.saveData();
    return true;
  }

  public getScans(qrCodeId?: string, clientId?: string, limit = 100): ScanRecord[] {
    let filtered = this.data.scans;
    if (qrCodeId) {
      filtered = filtered.filter((s) => s.qrCodeId === qrCodeId);
    } else if (clientId) {
      filtered = filtered.filter((s) => s.clientId === clientId);
    }
    return filtered.slice(0, limit);
  }

  public resetAnalytics(options?: { qrCodeId?: string; userName?: string }): {
    success: boolean;
    scansCleared: number;
    qrcodesReset: number;
    message: string;
  } {
    const { qrCodeId, userName = 'Administrador' } = options || {};
    let scansCleared = 0;
    let qrcodesReset = 0;

    if (qrCodeId) {
      const qr = this.data.qrcodes.find((q) => q.id === qrCodeId);
      const initialCount = this.data.scans.length;
      this.data.scans = this.data.scans.filter((s) => s.qrCodeId !== qrCodeId);
      scansCleared = initialCount - this.data.scans.length;

      if (qr) {
        if (qr.scanCount > 0) qrcodesReset = 1;
        qr.scanCount = 0;
        delete qr.lastScannedAt;
      }

      this.logHistory({
        action: 'analytics_reset',
        title: 'Métricas de QR Code resetadas',
        description: `Dados de leitura do QR Code "${qr?.name || qrCodeId}" foram zerados (${scansCleared} acessos removidos).`,
        userName,
        targetId: qrCodeId,
        targetType: 'qrcode',
      });
    } else {
      scansCleared = this.data.scans.length;
      this.data.scans = [];

      this.data.qrcodes.forEach((q) => {
        if (q.scanCount > 0) qrcodesReset++;
        q.scanCount = 0;
        delete q.lastScannedAt;
      });

      this.logHistory({
        action: 'analytics_reset',
        title: 'Todos os dados de análise resetados',
        description: `Reset geral de análise: todos os ${scansCleared} registros de scans e estatísticas de todos os QR Codes foram zerados.`,
        userName,
        targetType: 'qrcode',
      });
    }

    this.saveData();
    return {
      success: true,
      scansCleared,
      qrcodesReset,
      message: qrCodeId
        ? `Métricas do QR Code zeradas com sucesso (${scansCleared} acessos removidos).`
        : `Todos os dados de análise foram resetados com sucesso (${scansCleared} acessos removidos).`,
    };
  }

  public insertManualScans(options: {
    qrCodeId: string;
    count?: number;
    device?: 'Mobile' | 'Desktop' | 'Tablet';
    os?: string;
    browser?: string;
    city?: string;
    country?: string;
    timestamp?: string;
    userName?: string;
  }): { success: boolean; insertedCount: number; message: string } {
    const {
      qrCodeId,
      count = 1,
      device = 'Mobile',
      os = 'iOS',
      browser = 'Safari Mobile',
      city = 'Tóquio',
      country = 'Japão',
      timestamp,
      userName = 'Administrador',
    } = options;

    const qr = this.data.qrcodes.find((q) => q.id === qrCodeId);
    if (!qr) {
      throw new Error('QR Code não encontrado.');
    }

    const baseTime = timestamp ? new Date(timestamp).getTime() : Date.now();
    const actualCount = Math.max(1, Math.min(count, 500));

    for (let i = 0; i < actualCount; i++) {
      const timeOffset = actualCount > 1 ? Math.floor(Math.random() * 3600000 * 12) : 0;
      const scanTime = new Date(baseTime - timeOffset).toISOString();
      const scan: ScanRecord = {
        id: `scan_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
        qrCodeId: qr.id,
        qrCodeName: qr.name,
        clientId: qr.clientId || '',
        clientName: qr.clientName || 'Cliente Geral',
        timestamp: scanTime,
        ip: `192.168.1.${Math.floor(Math.random() * 200 + 10)}`,
        country,
        city,
        region: 'Kanto',
        device: device as any,
        os,
        browser,
        referrer: 'Inserção Manual / Dashboard',
      };
      this.data.scans.unshift(scan);
    }

    qr.scanCount = (qr.scanCount || 0) + actualCount;
    qr.lastScannedAt = new Date().toISOString();

    if (this.data.scans.length > 5000) {
      this.data.scans = this.data.scans.slice(0, 5000);
    }

    this.logHistory({
      action: 'qr_updated',
      title: `${actualCount} scan(s) inserido(s) no Dashboard`,
      description: `Foram inseridos manualmente ${actualCount} registro(s) de scan no QR Code "${qr.name}" (${city}, ${device}).`,
      userName,
      targetId: qr.id,
      targetType: 'qrcode',
    });

    this.saveData();
    return {
      success: true,
      insertedCount: actualCount,
      message: `${actualCount} registro(s) de scan inserido(s) com sucesso no QR Code "${qr.name}".`,
    };
  }

  public deleteScansBatch(options: {
    qrCodeId?: string;
    count?: number;
    period?: '24h' | '7d' | '30d' | 'all';
    userName?: string;
  }): { success: boolean; deletedCount: number; message: string } {
    const { qrCodeId, count, period, userName = 'Administrador' } = options;
    let deletedCount = 0;

    if (period === '24h') {
      const cutoff = Date.now() - 24 * 3600 * 1000;
      const before = this.data.scans.length;
      this.data.scans = this.data.scans.filter((s) => {
        if (qrCodeId && s.qrCodeId !== qrCodeId) return true;
        return new Date(s.timestamp).getTime() < cutoff;
      });
      deletedCount = before - this.data.scans.length;
    } else if (period === '7d') {
      const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
      const before = this.data.scans.length;
      this.data.scans = this.data.scans.filter((s) => {
        if (qrCodeId && s.qrCodeId !== qrCodeId) return true;
        return new Date(s.timestamp).getTime() < cutoff;
      });
      deletedCount = before - this.data.scans.length;
    } else if (period === '30d') {
      const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
      const before = this.data.scans.length;
      this.data.scans = this.data.scans.filter((s) => {
        if (qrCodeId && s.qrCodeId !== qrCodeId) return true;
        return new Date(s.timestamp).getTime() < cutoff;
      });
      deletedCount = before - this.data.scans.length;
    } else if (count && count > 0) {
      let removed = 0;
      this.data.scans = this.data.scans.filter((s) => {
        if (removed >= count) return true;
        if (qrCodeId && s.qrCodeId !== qrCodeId) return true;
        removed++;
        return false;
      });
      deletedCount = removed;
    } else if (qrCodeId) {
      const before = this.data.scans.length;
      this.data.scans = this.data.scans.filter((s) => s.qrCodeId !== qrCodeId);
      deletedCount = before - this.data.scans.length;
    } else {
      deletedCount = this.data.scans.length;
      this.data.scans = [];
    }

    // Recalculate scan counts for affected QR codes
    this.data.qrcodes.forEach((qr) => {
      if (!qrCodeId || qr.id === qrCodeId) {
        const qrScans = this.data.scans.filter((s) => s.qrCodeId === qr.id);
        qr.scanCount = qrScans.length;
        if (qrScans.length > 0) {
          qr.lastScannedAt = qrScans[0].timestamp;
        } else {
          delete qr.lastScannedAt;
        }
      }
    });

    this.logHistory({
      action: 'analytics_reset',
      title: `${deletedCount} scan(s) retirado(s) do Dashboard`,
      description: `Foram retirados ${deletedCount} registro(s) de scan do sistema.`,
      userName,
      targetType: 'qrcode',
    });

    this.saveData();
    return {
      success: true,
      deletedCount,
      message: `${deletedCount} registro(s) de scan retirado(s) com sucesso.`,
    };
  }

  // --- STATS & ANALYTICS ---
  public getOverviewStats() {
    const totalClients = this.data.clients.length;
    const totalQRCodes = this.data.qrcodes.length;
    const activeQRCodes = this.data.qrcodes.filter((q) => q.status === 'active').length;
    const inactiveQRCodes = totalQRCodes - activeQRCodes;
    const totalScans = this.data.qrcodes.reduce((acc, q) => acc + (q.scanCount || 0), 0);

    const now = Date.now();
    const h24 = 24 * 3600 * 1000;
    const d7 = 7 * h24;
    const d30 = 30 * h24;

    const scansLast24h = this.data.scans.filter((s) => now - new Date(s.timestamp).getTime() <= h24).length;
    const scansLast7d = this.data.scans.filter((s) => now - new Date(s.timestamp).getTime() <= d7).length;
    const scansLast30d = this.data.scans.filter((s) => now - new Date(s.timestamp).getTime() <= d30).length;

    // Daily breakdown for last 14 days
    const dailyScansMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * h24);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      dailyScansMap[key] = 0;
    }

    this.data.scans.forEach((s) => {
      const d = new Date(s.timestamp);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (dailyScansMap[key] !== undefined) {
        dailyScansMap[key]++;
      }
    });

    const dailyScans = Object.entries(dailyScansMap).map(([date, scans]) => ({ date, scans }));

    // Top QR Codes
    const topQRCodes = [...this.data.qrcodes]
      .sort((a, b) => (b.scanCount || 0) - (a.scanCount || 0))
      .slice(0, 5)
      .map((q) => ({
        id: q.id,
        name: q.name,
        clientName: q.clientName,
        type: q.type,
        scans: q.scanCount,
        status: q.status,
      }));

    // Top Clients by scan sum
    const clientScansMap: Record<string, { client: Client; scans: number; qrCount: number }> = {};
    this.data.clients.forEach((c) => {
      clientScansMap[c.id] = { client: c, scans: 0, qrCount: 0 };
    });
    this.data.qrcodes.forEach((q) => {
      if (clientScansMap[q.clientId]) {
        clientScansMap[q.clientId].scans += q.scanCount || 0;
        clientScansMap[q.clientId].qrCount++;
      }
    });
    const topClients = Object.values(clientScansMap)
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 5)
      .map((item) => ({
        id: item.client.id,
        name: item.client.name,
        scans: item.scans,
        qrCount: item.qrCount,
      }));

    // Devices distribution
    const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
    const osCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const hourCounts: Record<string, number> = {};

    for (let h = 0; h < 24; h++) {
      hourCounts[`${h.toString().padStart(2, '0')}h`] = 0;
    }

    this.data.scans.forEach((s) => {
      deviceCounts[s.device] = (deviceCounts[s.device] || 0) + 1;
      osCounts[s.os] = (osCounts[s.os] || 0) + 1;
      browserCounts[s.browser] = (browserCounts[s.browser] || 0) + 1;
      const cityLabel = s.city && s.city !== 'Localização em Análise'
        ? (s.region ? `${s.city} (${s.region})` : s.city)
        : (s.country || 'Não Identificado');
      cityCounts[cityLabel] = (cityCounts[cityLabel] || 0) + 1;

      const hour = new Date(s.timestamp).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}h`;
      if (hourCounts[hourKey] !== undefined) {
        hourCounts[hourKey]++;
      }
    });

    const devicesData = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));
    const osData = Object.entries(osCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const browsersData = Object.entries(browserCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const citiesData = Object.entries(cityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const peakHoursData = Object.entries(hourCounts).map(([hour, scans]) => ({ hour, scans }));

    return {
      stats: {
        totalClients,
        totalQRCodes,
        activeQRCodes,
        inactiveQRCodes,
        totalScans,
        scansLast24h,
        scansLast7d,
        scansLast30d,
      },
      dailyScans,
      topQRCodes,
      topClients,
      devicesData,
      osData,
      browsersData,
      citiesData,
      peakHoursData,
    };
  }

  // Analytics for a specific QR Code
  public getQRCodeAnalytics(qrCodeId: string) {
    const qr = this.getQRCodeById(qrCodeId);
    if (!qr) return null;

    const scans = this.data.scans.filter((s) => s.qrCodeId === qrCodeId);
    const now = Date.now();
    const h24 = 24 * 3600 * 1000;

    const dailyScansMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * h24);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      dailyScansMap[key] = 0;
    }
    scans.forEach((s) => {
      const d = new Date(s.timestamp);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (dailyScansMap[key] !== undefined) dailyScansMap[key]++;
    });

    const devicesCount: Record<string, number> = {};
    const osCount: Record<string, number> = {};
    const browserCount: Record<string, number> = {};
    const cityCount: Record<string, number> = {};
    const hourCount: Record<string, number> = {};

    for (let h = 0; h < 24; h++) hourCount[`${h.toString().padStart(2, '0')}h`] = 0;

    scans.forEach((s) => {
      devicesCount[s.device] = (devicesCount[s.device] || 0) + 1;
      osCount[s.os] = (osCount[s.os] || 0) + 1;
      browserCount[s.browser] = (browserCount[s.browser] || 0) + 1;
      const cityLabel = s.city && s.city !== 'Localização em Análise'
        ? (s.region ? `${s.city} (${s.region})` : s.city)
        : (s.country || 'Não Identificado');
      cityCount[cityLabel] = (cityCount[cityLabel] || 0) + 1;

      const hour = new Date(s.timestamp).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}h`;
      if (hourCount[hourKey] !== undefined) hourCount[hourKey]++;
    });

    return {
      qr,
      totalScans: qr.scanCount,
      recentScans: scans.slice(0, 30),
      dailyScans: Object.entries(dailyScansMap).map(([date, scans]) => ({ date, scans })),
      devices: Object.entries(devicesCount).map(([name, value]) => ({ name, value })),
      operatingSystems: Object.entries(osCount).map(([name, value]) => ({ name, value })),
      browsers: Object.entries(browserCount).map(([name, value]) => ({ name, value })),
      cities: Object.entries(cityCount).map(([name, value]) => ({ name, value })),
      peakHours: Object.entries(hourCount).map(([hour, scans]) => ({ hour, scans })),
    };
  }

  // --- HISTORY ---
  public getHistory(options?: { search?: string; action?: string; limit?: number } | number): HistoryLog[] {
    let limit = 200;
    let search = '';
    let actionFilter = '';

    if (typeof options === 'number') {
      limit = options;
    } else if (options) {
      limit = options.limit || 200;
      search = options.search ? normalizeSearchTerm(options.search) : '';
      actionFilter = options.action && options.action !== 'all' ? options.action.trim() : '';
    }

    let list = this.data.history || [];

    if (actionFilter) {
      list = list.filter((item) => item.action === actionFilter);
    }

    if (search) {
      list = list.filter((item) => {
        const rawAction = normalizeSearchTerm(item.action);
        const actionLabel = normalizeSearchTerm(ACTION_LABELS[item.action] || '');
        const title = normalizeSearchTerm(item.title);
        const description = normalizeSearchTerm(item.description);
        const userName = normalizeSearchTerm(item.userName);
        const targetId = normalizeSearchTerm(item.targetId || '');
        const targetType = normalizeSearchTerm(item.targetType || '');

        return (
          rawAction.includes(search) ||
          actionLabel.includes(search) ||
          title.includes(search) ||
          description.includes(search) ||
          userName.includes(search) ||
          targetId.includes(search) ||
          targetType.includes(search)
        );
      });
    }

    return list.slice(0, limit);
  }

  public logHistory(entry: Omit<HistoryLog, 'id' | 'timestamp' | 'userId'> & { userId?: string }) {
    const log: HistoryLog = {
      id: `hist_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      userId: entry.userId || 'usr_admin',
      ...entry,
    };
    this.data.history.unshift(log);
    if (this.data.history.length > 500) {
      this.data.history = this.data.history.slice(0, 500);
    }
    this.saveData();
  }

  // --- SETTINGS ---
  public getSettings(): SystemSettings {
    return this.data.settings || defaultSettings;
  }

  public updateSettings(newSettings: Partial<SystemSettings>, userName = 'Administrador'): SystemSettings {
    this.data.settings = {
      ...(this.data.settings || defaultSettings),
      ...newSettings,
    };
    this.logHistory({
      action: 'settings_updated',
      title: 'Configurações do sistema alteradas',
      description: 'As configurações gerais da plataforma foram atualizadas.',
      userName,
      targetType: 'settings',
    });
    this.saveData();
    return this.data.settings;
  }

  // --- ADMIN AUTH & PROFILE ---
  public getAdminUser(): AdminUser {
    if (!this.data.adminUser) {
      this.data.adminUser = {
        id: 'usr_admin_1',
        name: 'Administrador Master',
        email: 'admin@qrdynamic.com',
        password: 'admin123',
      };
      this.saveData();
    }
    return this.data.adminUser;
  }

  public updateAdminUser(updates: { name?: string; email?: string; password?: string }): AdminUser {
    const current = this.getAdminUser();
    const updatedName = updates.name !== undefined && updates.name.trim() !== '' ? updates.name.trim() : current.name;
    const updatedEmail = updates.email !== undefined && updates.email.trim() !== '' ? updates.email.trim().toLowerCase() : current.email;
    const updatedPassword = updates.password !== undefined && updates.password.trim() !== '' ? updates.password.trim() : current.password;

    this.data.adminUser = {
      ...current,
      name: updatedName,
      email: updatedEmail,
      password: updatedPassword,
      updatedAt: new Date().toISOString(),
    };

    this.logHistory({
      action: 'settings_updated',
      title: 'Credenciais de Administrador alteradas',
      description: `E-mail de login atualizado para "${updatedEmail}" e perfil renovado.`,
      userName: updatedName,
      targetType: 'settings',
    });
    const reg = this.loadRegistry();
    reg.adminUser = { ...this.data.adminUser };
    this.saveRegistry(reg);
    this.saveData();
    return this.data.adminUser;
  }

  // --- REPARAR CREDENCIAIS DE ADMINISTRADOR E SALVAR NOVOS ---
  public repairAdminUser(options?: {
    name?: string;
    email?: string;
    password?: string;
    resetToDefault?: boolean;
    userName?: string;
  }): { admin: AdminUser; message: string } {
    if (options?.resetToDefault) {
      this.data.adminUser = {
        id: 'usr_admin_1',
        name: 'Administrador Master',
        email: 'admin@qrdynamic.com',
        password: 'admin123',
        updatedAt: new Date().toISOString(),
      };
      const reg = this.loadRegistry();
      reg.adminUser = { ...this.data.adminUser };
      this.saveRegistry(reg);
      this.saveData();

      this.logHistory({
        action: 'settings_updated',
        title: 'Credenciais de Administrador restauradas ao padrão',
        description: 'Credenciais de login redefinidas com sucesso para o padrão de segurança (admin@qrdynamic.com / admin123).',
        userName: options.userName || 'Administrador Master',
        targetType: 'settings',
      });

      return {
        admin: this.data.adminUser,
        message: 'Credenciais do Administrador restauradas ao padrão com sucesso (admin@qrdynamic.com / admin123).',
      };
    }

    // 1. GARANTIA ABSOLUTA: Assegurar que nenhum cliente ou QR code é alterado durante o reparo de credenciais
    const preservedClientsCount = this.data.clients.length;
    const preservedQRCodesCount = this.data.qrcodes.length;

    const current = this.getAdminUser();
    const targetName = options?.name !== undefined && options.name.trim() !== '' ? options.name.trim() : current.name;
    const targetEmail = options?.email !== undefined && options.email.trim() !== '' ? options.email.trim().toLowerCase() : current.email;
    const targetPass = options?.password !== undefined && options.password.trim() !== '' ? options.password.trim() : current.password;

    this.data.adminUser = {
      ...current,
      name: targetName,
      email: targetEmail,
      password: targetPass,
      updatedAt: new Date().toISOString(),
    };

    const reg = this.loadRegistry();
    reg.adminUser = { ...this.data.adminUser };
    this.saveRegistry(reg);
    this.saveData();

    this.logHistory({
      action: 'settings_updated',
      title: 'Credenciais de Administrador reparadas e salvas',
      description: `Novas credenciais de login do Administrador salvas com sucesso (E-mail: ${targetEmail}). Todos os ${preservedClientsCount} clientes e ${preservedQRCodesCount} QR Codes criados foram 100% preservados e NÃO sofreram qualquer alteração.`,
      userName: targetName,
      targetType: 'settings',
    });

    return {
      admin: this.data.adminUser,
      message: `Novas credenciais salvas com sucesso! E-mail de acesso: ${targetEmail}. Todos os ${preservedClientsCount} clientes e ${preservedQRCodesCount} QR Codes permanecem intactos.`,
    };
  }
}

export const db = new Database();
