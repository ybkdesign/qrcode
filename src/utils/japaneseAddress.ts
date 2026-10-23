import type { Client } from '../types';

export interface PrefectureOption {
  code: string;
  namePt: string;
  nameJp?: string;
  region: string;
}

export const JAPANESE_PREFECTURES: PrefectureOption[] = [
  // Kanto
  { code: 'tokyo', namePt: 'Tóquio', nameJp: '東京都', region: 'Kanto' },
  { code: 'kanagawa', namePt: 'Kanagawa', nameJp: '神奈川県', region: 'Kanto' },
  { code: 'saitama', namePt: 'Saitama', nameJp: '埼玉県', region: 'Kanto' },
  { code: 'chiba', namePt: 'Chiba', nameJp: '千葉県', region: 'Kanto' },
  { code: 'ibaraki', namePt: 'Ibaraki', nameJp: '茨城県', region: 'Kanto' },
  { code: 'tochigi', namePt: 'Tochigi', nameJp: '栃木県', region: 'Kanto' },
  { code: 'gunma', namePt: 'Gunma', nameJp: '群馬県', region: 'Kanto' },

  // Kansai
  { code: 'osaka', namePt: 'Osaka', nameJp: '大阪府', region: 'Kansai' },
  { code: 'kyoto', namePt: 'Kyoto', nameJp: '京都府', region: 'Kansai' },
  { code: 'hyogo', namePt: 'Hyogo (Kobe)', nameJp: '兵庫県', region: 'Kansai' },
  { code: 'nara', namePt: 'Nara', nameJp: '奈良県', region: 'Kansai' },
  { code: 'shiga', namePt: 'Shiga', nameJp: '滋賀県', region: 'Kansai' },
  { code: 'wakayama', namePt: 'Wakayama', nameJp: '和歌山県', region: 'Kansai' },
  { code: 'mie', namePt: 'Mie', nameJp: '三重県', region: 'Kansai' },

  // Chubu
  { code: 'aichi', namePt: 'Aichi (Nagoya)', nameJp: '愛知県', region: 'Chubu' },
  { code: 'shizuoka', namePt: 'Shizuoka', nameJp: '静岡県', region: 'Chubu' },
  { code: 'gifu', namePt: 'Gifu', nameJp: '岐阜県', region: 'Chubu' },
  { code: 'nagano', namePt: 'Nagano', nameJp: '長野県', region: 'Chubu' },
  { code: 'niigata', namePt: 'Niigata', nameJp: '新潟県', region: 'Chubu' },
  { code: 'yamanashi', namePt: 'Yamanashi', nameJp: '山梨県', region: 'Chubu' },
  { code: 'ishikawa', namePt: 'Ishikawa', nameJp: '石川県', region: 'Chubu' },
  { code: 'toyama', namePt: 'Toyama', nameJp: '富山県', region: 'Chubu' },
  { code: 'fukui', namePt: 'Fukui', nameJp: '福井県', region: 'Chubu' },

  // Kyushu & Okinawa
  { code: 'fukuoka', namePt: 'Fukuoka', nameJp: '福岡県', region: 'Kyushu & Okinawa' },
  { code: 'kumamoto', namePt: 'Kumamoto', nameJp: '熊本県', region: 'Kyushu & Okinawa' },
  { code: 'okinawa', namePt: 'Okinawa', nameJp: '沖縄県', region: 'Kyushu & Okinawa' },
  { code: 'nagasaki', namePt: 'Nagasaki', nameJp: '長崎県', region: 'Kyushu & Okinawa' },
  { code: 'kagoshima', namePt: 'Kagoshima', nameJp: '鹿児島県', region: 'Kyushu & Okinawa' },
  { code: 'oita', namePt: 'Oita', nameJp: '大分県', region: 'Kyushu & Okinawa' },
  { code: 'miyazaki', namePt: 'Miyazaki', nameJp: '宮崎県', region: 'Kyushu & Okinawa' },
  { code: 'saga', namePt: 'Saga', nameJp: '佐賀県', region: 'Kyushu & Okinawa' },

  // Hokkaido
  { code: 'hokkaido', namePt: 'Hokkaido', nameJp: '北海道', region: 'Hokkaido' },

  // Tohoku
  { code: 'miyagi', namePt: 'Miyagi (Sendai)', nameJp: '宮城県', region: 'Tohoku' },
  { code: 'fukushima', namePt: 'Fukushima', nameJp: '福島県', region: 'Tohoku' },
  { code: 'aomori', namePt: 'Aomori', nameJp: '青森県', region: 'Tohoku' },
  { code: 'iwate', namePt: 'Iwate', nameJp: '岩手県', region: 'Tohoku' },
  { code: 'yamagata', namePt: 'Yamagata', nameJp: '山形県', region: 'Tohoku' },
  { code: 'akita', namePt: 'Akita', nameJp: '秋田県', region: 'Tohoku' },

  // Chugoku
  { code: 'hiroshima', namePt: 'Hiroshima', nameJp: '広島県', region: 'Chugoku' },
  { code: 'okayama', namePt: 'Okayama', nameJp: '岡山県', region: 'Chugoku' },
  { code: 'yamaguchi', namePt: 'Yamaguchi', nameJp: '山口県', region: 'Chugoku' },
  { code: 'shimane', namePt: 'Shimane', nameJp: '島根県', region: 'Chugoku' },
  { code: 'tottori', namePt: 'Tottori', nameJp: '鳥取県', region: 'Chugoku' },

  // Shikoku
  { code: 'ehime', namePt: 'Ehime', nameJp: '愛媛県', region: 'Shikoku' },
  { code: 'kagawa', namePt: 'Kagawa', nameJp: '香川県', region: 'Shikoku' },
  { code: 'tokushima', namePt: 'Tokushima', nameJp: '徳島県', region: 'Shikoku' },
  { code: 'kochi', namePt: 'Kochi', nameJp: '高知県', region: 'Shikoku' },
];

/**
 * Normaliza e formata o código postal japonês (〒XXX-XXXX)
 */
export function formatJapanesePostalCode(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/[^\d]/g, '');
  if (cleaned.length <= 3) {
    return cleaned;
  }
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
}

/**
 * Monta o endereço completo no padrão japonês:
 * 〒[CEP] [Província] [Cidade/Distrito] [Bairro/Chome/Banchi] [Edifício/Sala]
 */
export function formatJapaneseAddress(
  client: Partial<Client>,
  options?: {
    includePostalCode?: boolean;
    includeCountry?: boolean;
  }
): string {
  const { includePostalCode = true, includeCountry = false } = options || {};

  const parts: string[] = [];

  const rawZip = client.postalCode ? client.postalCode.replace(/[^\d]/g, '') : '';
  const formattedZip = rawZip ? formatJapanesePostalCode(rawZip) : '';

  if (includePostalCode && formattedZip) {
    parts.push(`〒${formattedZip}`);
  }

  // Província (Prefecture)
  if (client.prefecture) {
    parts.push(client.prefecture);
  }

  // Cidade / Distrito / Município (City / Ward)
  if (client.city) {
    parts.push(client.city);
  }

  // Bairro / Chome / Banchi / Go (Address)
  if (client.address) {
    parts.push(client.address);
  }

  // Edifício / Sala (Building)
  if (client.building) {
    parts.push(client.building);
  }

  let result = parts.join(' ').trim();

  // Caso seja um cliente legado sem os novos campos
  if (!result && (client.city || client.address)) {
    result = [client.address, client.city].filter(Boolean).join(', ');
  }

  if (includeCountry && client.country) {
    result = result ? `${result}, ${client.country}` : client.country;
  }

  return result;
}

/**
 * Retorna resumo curto da localização para cards e listas (ex: "〒150-0001 Tóquio, Shibuya-ku")
 */
export function formatShortJapaneseLocation(client: Partial<Client>): string {
  const zip = client.postalCode ? client.postalCode.replace(/[^\d]/g, '') : '';
  const zipStr = zip ? `〒${formatJapanesePostalCode(zip)} ` : '';

  if (client.prefecture && client.city) {
    return `${zipStr}${client.prefecture} ${client.city}`;
  }

  if (client.prefecture) {
    return `${zipStr}${client.prefecture}`;
  }

  if (client.city) {
    return `${zipStr}${client.city}${client.country ? `, ${client.country}` : ''}`;
  }

  return client.country || 'Japão';
}

/**
 * Gera URL de busca no Google Maps para o endereço japonês
 */
export function getGoogleMapsSearchUrl(client: Partial<Client>): string {
  const fullAddress = formatJapaneseAddress(client, { includePostalCode: false, includeCountry: true });
  const query = encodeURIComponent(fullAddress || client.name || '');
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
