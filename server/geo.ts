import type { Request } from 'express';

export interface ResolvedGeo {
  country: string;
  countryCode?: string;
  region?: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
}

// In-memory cache with 24-hour expiration
interface CacheEntry {
  geo: ResolvedGeo;
  timestamp: number;
}

const geoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const COUNTRY_NAMES_PT: Record<string, string> = {
  JP: 'Japão',
  BR: 'Brasil',
  US: 'Estados Unidos',
  PT: 'Portugal',
  ES: 'Espanha',
  DE: 'Alemanha',
  FR: 'França',
  IT: 'Itália',
  GB: 'Reino Unido',
  CA: 'Canadá',
  AU: 'Austrália',
  AR: 'Argentina',
  PY: 'Paraguai',
  UY: 'Uruguai',
  CL: 'Chile',
  CO: 'Colômbia',
  PE: 'Peru',
  MX: 'México',
  CN: 'China',
  KR: 'Coreia do Sul',
  IN: 'Índia',
  RU: 'Rússia',
  ZA: 'África do Sul',
  CH: 'Suíça',
  SE: 'Suécia',
  NO: 'Noruega',
  NL: 'Holanda',
  BE: 'Bélgica',
  IE: 'Irlanda',
  NZ: 'Nova Zelândia',
  SG: 'Cingapura',
  AE: 'Emirados Árabes Unidos',
  Japan: 'Japão',
  Brazil: 'Brasil',
  'United States': 'Estados Unidos',
  'United Kingdom': 'Reino Unido',
  Germany: 'Alemanha',
  France: 'França',
  Italy: 'Itália',
  Spain: 'Espanha',
  Canada: 'Canadá',
};

export function localizeCountry(nameOrCode: string): string {
  if (!nameOrCode) return 'Não Identificado';
  return COUNTRY_NAMES_PT[nameOrCode] || COUNTRY_NAMES_PT[nameOrCode.toUpperCase()] || nameOrCode;
}

/**
 * Extracts real client IP from Express request, respecting reverse proxies and CDNs.
 */
export function extractClientIp(req: Request): string {
  const cfIp = req.headers['cf-connecting-ip'] as string;
  if (cfIp) return cleanIp(cfIp);

  const realIp = req.headers['x-real-ip'] as string;
  if (realIp) return cleanIp(realIp);

  const forwarded = req.headers['x-forwarded-for'] as string;
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return cleanIp(first);
  }

  const clientIpHeader = req.headers['x-client-ip'] as string;
  if (clientIpHeader) return cleanIp(clientIpHeader);

  return cleanIp(req.socket.remoteAddress || '127.0.0.1');
}

function cleanIp(ip: string): string {
  let cleaned = ip.trim();
  // Strip IPv4-mapped IPv6 (::ffff:192.168.1.1)
  if (cleaned.startsWith('::ffff:')) {
    cleaned = cleaned.substring(7);
  }
  return cleaned;
}

export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;

  // IPv4 Private subnets
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;

  // IPv6 Private / Link-Local
  if (/^fe80:/i.test(ip)) return true;
  if (/^fc00:/i.test(ip) || /^fd00:/i.test(ip)) return true;

  return false;
}

/**
 * Checks for Cloud Run, Google App Engine or Cloudflare geolocation headers
 */
export function extractHeaderGeo(req: Request): ResolvedGeo | null {
  const countryHeader =
    (req.headers['x-appengine-country'] as string) ||
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['x-client-country'] as string);

  const cityHeader =
    (req.headers['x-appengine-city'] as string) ||
    (req.headers['cf-ipcity'] as string) ||
    (req.headers['x-client-city'] as string);

  const regionHeader =
    (req.headers['x-appengine-region'] as string) ||
    (req.headers['cf-region'] as string) ||
    (req.headers['x-client-region'] as string);

  const latLongHeader = req.headers['x-appengine-citylatlong'] as string;

  if (countryHeader && cityHeader) {
    let lat: number | undefined;
    let lon: number | undefined;
    if (latLongHeader) {
      const parts = latLongHeader.split(',');
      if (parts.length === 2) {
        lat = parseFloat(parts[0]);
        lon = parseFloat(parts[1]);
      }
    }

    try {
      const cityDecoded = decodeURIComponent(cityHeader);
      const regionDecoded = regionHeader ? decodeURIComponent(regionHeader) : undefined;
      return {
        country: localizeCountry(countryHeader),
        countryCode: countryHeader.toUpperCase(),
        region: regionDecoded,
        city: cityDecoded,
        latitude: lat,
        longitude: lon,
      };
    } catch {
      return {
        country: localizeCountry(countryHeader),
        countryCode: countryHeader.toUpperCase(),
        region: regionHeader,
        city: cityHeader,
        latitude: lat,
        longitude: lon,
      };
    }
  }

  return null;
}

export function getCachedGeo(ip: string): ResolvedGeo | null {
  const entry = geoCache.get(ip);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    geoCache.delete(ip);
    return null;
  }
  return entry.geo;
}

/**
 * Resolves precise geolocation for an IP address with high availability and fallback
 */
export async function resolveGeo(ip: string): Promise<ResolvedGeo> {
  const clean = cleanIp(ip);

  // 1. Check cache
  const cached = getCachedGeo(clean);
  if (cached) return cached;

  // 2. Check if private or local
  if (isPrivateIp(clean)) {
    const localGeo: ResolvedGeo = {
      country: 'Ambiente Local',
      countryCode: 'LOC',
      region: 'Rede Interna',
      city: 'Localhost / Dev',
    };
    geoCache.set(clean, { geo: localGeo, timestamp: Date.now() });
    return localGeo;
  }

  // 3. Primary provider: ip-api.com (Fast, highly accurate worldwide, JSON endpoint)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(clean)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        const geo: ResolvedGeo = {
          country: localizeCountry(data.countryCode || data.country),
          countryCode: data.countryCode,
          region: data.regionName || data.region || undefined,
          city: data.city || 'Desconhecida',
          postalCode: data.zip || undefined,
          latitude: typeof data.lat === 'number' ? data.lat : undefined,
          longitude: typeof data.lon === 'number' ? data.lon : undefined,
          isp: data.isp || undefined,
        };
        geoCache.set(clean, { geo, timestamp: Date.now() });
        return geo;
      }
    }
  } catch (err) {
    // Timeout or network error, proceed to fallback
  }

  // 4. Fallback provider: ipwho.is
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://ipwho.is/${encodeURIComponent(clean)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const geo: ResolvedGeo = {
          country: localizeCountry(data.country_code || data.country),
          countryCode: data.country_code,
          region: data.region || undefined,
          city: data.city || 'Desconhecida',
          postalCode: data.postal || undefined,
          latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
          longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
          isp: data.connection?.isp || undefined,
        };
        geoCache.set(clean, { geo, timestamp: Date.now() });
        return geo;
      }
    }
  } catch (err) {
    // Both failed
  }

  // Fallback if lookup completely fails
  const fallbackGeo: ResolvedGeo = {
    country: 'Não Identificado',
    city: 'Localização Desconhecida',
  };
  return fallbackGeo;
}
