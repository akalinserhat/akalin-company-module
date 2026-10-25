/**
 * @akalin/company_module - Varsayılan ve Örnek Veriler (defaultCompanies.ts)
 */

import { FirmaDTO, FirmaKullaniciDTO, FirmaDavetDTO, PasswordPolicyDTO, FirmaPolicyDTO } from '../types';

export const DEFAULT_PASSWORD_POLICY: PasswordPolicyDTO = {
  expiryDays: 90,
  sessionTimeoutMinutes: 30,
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: false,
};

export const DEFAULT_COMPANY_POLICIES: FirmaPolicyDTO = {
  davetExpiryHours: 48,
  sifreSifirlamaExpiryMinutes: 60,
  varsayilanRol: 'Kullanıcı',
  passwordPolicy: DEFAULT_PASSWORD_POLICY,
};

export const DEFAULT_SEKTOREL_SEED_DATA = {
  paraBirimleri: [
    { kod: 'TRY', ad: 'Türk Lirası', sembol: '₺', varsayilanMi: true, aktifMi: true },
    { kod: 'EUR', ad: 'Euro', sembol: '€', varsayilanMi: false, aktifMi: false },
    { kod: 'USD', ad: 'Amerikan Doları', sembol: '$', varsayilanMi: false, aktifMi: false },
  ],
  kdvGruplari: [
    { kod: 'KDV-20', ad: 'Genel KDV (%20)', varsayilanMi: true, aktifMi: true, oran: 20, oranlar: [{ oran: 20, baslangicTarihi: '2023-07-10' }] },
    { kod: 'KDV-10', ad: 'Gıda & Temel İhtiyaç KDV (%10)', varsayilanMi: false, aktifMi: true, oran: 10, oranlar: [{ oran: 10, baslangicTarihi: '2023-07-10' }] },
    { kod: 'KDV-01', ad: 'Temel Tarım & Tohum KDV (%1)', varsayilanMi: false, aktifMi: true, oran: 1, oranlar: [{ oran: 1, baslangicTarihi: '2022-02-14' }] },
    { kod: 'KDV-00', ad: 'İhracat & İstisna KDV (%0)', varsayilanMi: false, aktifMi: true, oran: 0, oranlar: [{ oran: 0, baslangicTarihi: '2020-01-01' }] },
  ],
  birimler: [
    { id: 1, ad: 'Adet', sembol: 'ad', tip: 1, carpan: 1, anaBirimMi: true, aktifMi: true },
    { id: 2, ad: 'Kilogram', sembol: 'kg', tip: 2, carpan: 1, anaBirimMi: true, aktifMi: true },
    { id: 3, ad: 'Gram', sembol: 'gr', tip: 2, carpan: 0.001, anaBirimMi: false, aktifMi: true },
    { id: 4, ad: 'Metre', sembol: 'm', tip: 4, carpan: 1, anaBirimMi: true, aktifMi: true },
    { id: 5, ad: 'Litre', sembol: 'lt', tip: 3, carpan: 1, anaBirimMi: true, aktifMi: true },
    { id: 6, ad: 'Koli', sembol: 'kl', tip: 1, carpan: 12, anaBirimMi: false, aktifMi: true },
    { id: 7, ad: 'Paket', sembol: 'pkt', tip: 1, carpan: 1, anaBirimMi: false, aktifMi: true },
  ],
  moduller: [],
  modulAyarlari: {},
  genelAyarlar: {
    metinHarfDonusumu: 'basHarflerBuyuk',
    varsayilanDil: 'tr',
  },
  metinHarfDonusumu: 'basHarflerBuyuk',
  varsayilanDil: 'tr',
};

export const DEFAULT_SEED_DATA = {
  depolarVeSubeler: [
    { id: 1, kod: 'DEP-01', ad: 'Merkez Depo', tur: 1, seriTakibiYapilirMi: true, aktifMi: true, adres: '', acikAdres: '', adresIlId: null, ilId: null, adresIlceId: null, ilceId: null },
    { id: 2, kod: 'SUB-01', ad: 'Merkez Şube', tur: 3, telefon: '0212 111 22 33', aktifMi: true, adres: '', acikAdres: '', adresIlId: null, ilId: null, adresIlceId: null, ilceId: null },
  ],
};

export const SYSTEM_CORE_MODULE_CODES = [
  'MOD_AUTH',
  'MOD_DASHBOARD',
  'MOD_SISTEM_AYARLARI',
  'MOD_BILDIRIMLER',
  'MOD_YARDIM',
];

export const DEFAULT_CORE_MODULE_CODES = SYSTEM_CORE_MODULE_CODES;

export const DEFAULT_SECTOR_MODULES_BY_PARENT_ID: Record<string, string> = {
  '1': 'RET',
  '2': 'FNB',
  '3': 'MFG',
  '4': 'SRV',
  '5': 'CON',
  '6': 'ECM',
  '7': 'WHL',
  '8': 'HLT',
  '9': 'AUT',
  '10': 'LOG',
  '11': 'AGR',
  '12': 'TRZ',
  '13': 'TEX',
  '14': 'NRG',
  '15': 'EDU',
  '16': 'OTH',
};

export const DEFAULT_SAMPLE_COMPANIES: FirmaDTO[] = [
  {
    id: 1,
    ad: 'Webakus Teknoloji ve Yazılım A.Ş.',
    firmaAdi: 'Webakus Teknoloji ve Yazılım A.Ş.',
    kisaAd: 'Webakus A.Ş.',
    vergiDairesi: 'Beşiktaş',
    vergiNo: '9876543210',
    email: 'info@webakus.com',
    telefon: '0212 555 10 20',
    webSitesi: 'https://webakus.com',
    durum: 'Aktif',
    aktifMi: true,
    lisansliMi: true,
    olusturulmaTarihi: '2026-01-15T10:00:00Z',
    kullaniciSayisi: 8,
  },
  {
    id: 2,
    ad: 'Akdeniz Lojistik ve Ticaret Ltd. Şti.',
    firmaAdi: 'Akdeniz Lojistik ve Ticaret Ltd. Şti.',
    kisaAd: 'Akdeniz Lojistik',
    vergiDairesi: 'Muratpaşa',
    vergiNo: '1234567890',
    email: 'iletisim@akdenizlojistik.com.tr',
    telefon: '0242 333 44 55',
    durum: 'Demo',
    aktifMi: true,
    lisansliMi: false,
    demoBitisTarihi: '2026-11-30T23:59:59Z',
    olusturulmaTarihi: '2026-10-01T12:30:00Z',
    kullaniciSayisi: 3,
  },
];

export const DEFAULT_SAMPLE_USERS: FirmaKullaniciDTO[] = [
  {
    id: 1,
    ad: 'Serhat',
    soyad: 'Akalın',
    adSoyad: 'Serhat Akalın',
    email: 'serhat@webakus.com',
    telefon: '0532 111 22 33',
    aktifMi: true,
    firmalar: [{ firmaId: 1, firmaAdi: 'Webakus Teknoloji ve Yazılım A.Ş.', rol: 'Admin' }],
  },
  {
    id: 2,
    ad: 'Ahmet',
    soyad: 'Yılmaz',
    adSoyad: 'Ahmet Yılmaz',
    email: 'ahmet@akdenizlojistik.com.tr',
    telefon: '0542 333 44 55',
    aktifMi: true,
    firmalar: [{ firmaId: 2, firmaAdi: 'Akdeniz Lojistik Ltd. Şti.', rol: 'Yönetici' }],
  },
];

export const DEFAULT_SAMPLE_INVITATIONS: FirmaDavetDTO[] = [
  {
    id: 1,
    firmaId: 1,
    email: 'muhasebe@webakus.com',
    rol: 'Kullanıcı',
    durum: 'Bekliyor',
    olusturulmaTarihi: new Date().toISOString(),
    sonGecerlilikTarihi: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  },
];
