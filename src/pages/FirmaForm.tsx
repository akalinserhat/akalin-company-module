/**
 * ============================================================================
 * YAPAY ZEKA (AI) & GELİŞTİRİCİ MİMARİ KILAVUZU (DEVELOPER ARCHITECTURE GUIDE)
 * ============================================================================
 * 
 * BU BİLEŞEN ÇİFT MODLU (DUAL-MODE) ÇALIŞMAKTADIR:
 * 1. YENİ FİRMA EKLEME (!id):
 *    - @BaseWizardPage ile adım adım sihirbaz (Wizard) deneyimi sunar.
 *    - Kullanıcı 1'den 6'ya kadar adımları sırayla doğrular ve en son firmayı oluşturur.
 * 
 * 2. FİRMA DÜZENLEME (id mevcut):
 *    - @BaseCardPage ve @TabLayout ile sekmeli (Tabbed) kart düzeni sunar.
 *    - Yönetici istediği sekmeye (Genel Bilgiler, Faaliyet Alanı, Sektörel Ayarlar, Depolar ve Şubeler, Modüller, Kullanıcılar, Hareketler)
 *      doğrudan tıklar ve bağımsız olarak güncelleyip "Kaydet" ile kaydeder.
 * 
 * --- İLERİDE DEĞİŞİKLİK YAPACAK YAPAY ZEKA AJANLARI İÇİN KURALLAR ---
 * 
 * KURAL 1 - TEK KAYNAK (DRY - DON'T REPEAT YOURSELF) PRENSİBİ:
 * - Sayfa bölümleri (Genel Bilgiler, Faaliyet Alanları, Sektörel Ayarlar, Depolar ve Şubeler, Modül İzinleri,
 *   Yönetici Hesabı ve Firma Hareketleri) bağımsız render fonksiyonları (`renderGenelBilgiler()`,
 *   `renderFaaliyetAlani()`, `renderSektorelAyarlar()`, `renderDepolarVeSubeler()`, `renderModulIzinleri()`,
 *   `renderYoneticiHesabi()`, `renderFirmaHareketleri()`) olarak tanımlanmıştır.
 * - ASLA sihirbaz ve sekme için ayrı ayrı form JSX'i veya mükerrer form alanları yazmayınız!
 * 
 * KURAL 2 - YENİ BİR FORM ALANI EKLERKEN:
 *   a) `formData` state'ine yeni alanın başlangıç değerini ekleyin.
 *   b) İlgili bölümün render fonksiyonu içine (örn: `renderGenelBilgiler`) input bileşenini ekleyin.
 *   c) `validators/firmaFormValidation.ts` içine ilgili validasyon kuralını ekleyin.
 *   -> Bu değişiklik otomatik olarak hem Yeni Firma Sihirbazına hem de Düzenleme Sekmesine yansıyacaktır!
 * 
 * KURAL 3 - YENİ BİR ADIM / SEKME EKLERKEN:
 *   a) Yeni bir render fonksiyonu oluşturun (örn: `renderYeniBolum()`).
 *   b) Yeni Firma için: `<BaseWizardPage>` JSX'i içine yeni bir `<WizardStep>` ekleyin.
 *   c) Düzenleme için: `tabs` dizisine yeni bir `{ id, label, icon, content: renderYeniBolum() }` nesnesi ekleyin.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  BaseWizardPage, 
  WizardStep, 
  BaseCardPage,
  ActionMenuItem,
  TabLayout,
  AdresSeciciForm, 
  BasitInput, 
  VergiKimlikInput,
  PhoneInput, 
  EmailInput, 
  useAlertDialog, 
  BasePromptDialog, 
  FieldError, 
  useAdminValidation, 
  BackButton,
  useHeaderApi,
  UserCard,
  BasePopup,
  EkleFloatCircleButton,
  AdresLayer,
  DepoFormCard,
  DataTable,
  BaseSwitch,
  type Column,
  ModuleSettingsRegistry
} from '@akalin/ui';
import { renderModuleIcon } from '../constants/moduleIcons';
import FirmaKullaniciForm from './FirmaKullaniciForm';
import FirmaKullaniciDavetModal from '../components/FirmaKullaniciDavetModal';
import { 
  Building, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Package, 
  Activity, 
  UserPlus, 
  UserCheck, 
  CheckSquare, 
  Square,
  Layers,
  KeyRound,
  ChevronDown,
  ChevronUp,
  X,
  ShoppingBag,
  Utensils,
  Factory,
  Briefcase,
  Globe,
  Truck,
  HeartPulse,
  Car,
  Navigation,
  Sprout,
  Compass,
  Scissors,
  Zap,
  GraduationCap,
  Check,
  Settings2,
  Users,
  FileText,
  Mail,
  Coins,
  Percent,
  Scale,
  Warehouse,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Building2,
  Copy,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Type
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { DEFAULT_SEED_DATA } from '../defaults/defaultCompanies';
import { useCompanyModule } from '../adapters/CompanyServiceContext';
import { 
  validateFirmaStep1, 
  validateFirmaFaaliyetAlanlari, 
  validateFirmaStep4, 
  validateFirmaDepolarVeSubeler,
  isDepoSubeAddressComplete,
  validateFirmaForm, 
  getDuplicateVergiNoError 
} from '../validators/firmaFormValidation';
import { 
  fetchActivePasswordPolicy, 
  checkPasswordAgainstPolicy, 
  DEFAULT_PASSWORD_POLICY 
} from '../services/passwordPolicyService';
import useFirmaFormAutoFocus from '../hooks/firmaFormAutoFocus';

export const getInitialSeedDepolar = () => {
  let list: any[] = DEFAULT_SEED_DATA.depolarVeSubeler || [];
  try {
    const saved = localStorage.getItem('webakus_admin_genel_seed_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.depolarVeSubeler) && parsed.depolarVeSubeler.length > 0) {
        list = parsed.depolarVeSubeler;
      }
    }
  } catch (e) {
    console.error('Seed depolar parse hatası:', e);
  }
  return list.map((item: any) => {
    const hasValidAddress = isDepoSubeAddressComplete(item);
    return {
      ...item,
      adres: hasValidAddress ? (item.adres || '') : '',
      acikAdres: hasValidAddress ? (item.acikAdres || item.adres || '') : '',
      adresIlId: hasValidAddress ? (item.adresIlId ?? item.ilId ?? null) : null,
      ilId: hasValidAddress ? (item.adresIlId ?? item.ilId ?? null) : null,
      adresIlceId: hasValidAddress ? (item.adresIlceId ?? item.ilceId ?? null) : null,
      ilceId: hasValidAddress ? (item.adresIlceId ?? item.ilceId ?? null) : null,
      adresBucakId: hasValidAddress ? (item.adresBucakId ?? null) : null,
      adresKoyId: hasValidAddress ? (item.adresKoyId ?? null) : null,
      adresMahalleId: hasValidAddress ? (item.adresMahalleId ?? null) : null,
      adresCaddeSokakId: hasValidAddress ? (item.adresCaddeSokakId ?? null) : null,
      adresDisKapiId: hasValidAddress ? (item.adresDisKapiId ?? null) : null,
      adresIcKapiId: hasValidAddress ? (item.adresIcKapiId ?? null) : null,
      ilAdi: hasValidAddress ? (item.ilAdi || '') : '',
      ilceAdi: hasValidAddress ? (item.ilceAdi || '') : ''
    };
  });
};

export const DEFAULT_CARI_TURU_CONFIG = {
  kokSiralama: 'kurumsal_once' // 'kurumsal_once' | 'bireysel_once'
};

export const DEFAULT_SEKTOREL_SEED_DATA = {
  paraBirimleri: [
    { kod: 'TRY', ad: 'Türk Lirası', sembol: '₺', varsayilanMi: true, aktifMi: true },
    { kod: 'EUR', ad: 'Euro', sembol: '€', varsayilanMi: false, aktifMi: false },
    { kod: 'USD', ad: 'Amerikan Doları', sembol: '$', varsayilanMi: false, aktifMi: false }
  ],
  kdvGruplari: [
    { kod: 'KDV-20', ad: 'Genel KDV (%20)', varsayilanMi: true, aktifMi: true, oran: 20, oranlar: [{ oran: 20, baslangicTarihi: '2023-07-10' }] },
    { kod: 'KDV-10', ad: 'Gıda & Temel İhtiyaç KDV (%10)', varsayilanMi: false, aktifMi: true, oran: 10, oranlar: [{ oran: 10, baslangicTarihi: '2023-07-10' }] },
    { kod: 'KDV-01', ad: 'Temel Tarım & Tohum KDV (%1)', varsayilanMi: false, aktifMi: true, oran: 1, oranlar: [{ oran: 1, baslangicTarihi: '2022-02-14' }] },
    { kod: 'KDV-00', ad: 'İhracat & İstisna KDV (%0)', varsayilanMi: false, aktifMi: true, oran: 0, oranlar: [{ oran: 0, baslangicTarihi: '2020-01-01' }] }
  ],
  birimler: [
    { id: 1, ad: 'Adet', sembol: 'ad', tip: 1, carpan: 1, anaBirimMi: true, aktifMi: true },
    { id: 2, ad: 'Kilogram', sembol: 'kg', tip: 2, carpan: 1, anaBirimMi: true, aktifMi: true },
    { id: 3, ad: 'Gram', sembol: 'gr', tip: 2, carpan: 0.001, anaBirimMi: false, aktifMi: true },
    { id: 4, ad: 'Metre', sembol: 'm', tip: 4, carpan: 1, anaBirimMi: true, aktifMi: true },
    { id: 5, ad: 'Litre', sembol: 'lt', tip: 3, carpan: 1, anaBirimMi: true, aktifMi: true },
    { id: 6, ad: 'Koli', sembol: 'kl', tip: 1, carpan: 12, anaBirimMi: false, aktifMi: true },
    { id: 7, ad: 'Paket', sembol: 'pkt', tip: 1, carpan: 1, anaBirimMi: false, aktifMi: true }
  ],
  moduller: [],
  modulAyarlari: {},
  genelAyarlar: {
    metinHarfDonusumu: 'basHarflerBuyuk',
    varsayilanDil: 'tr'
  },
  metinHarfDonusumu: 'basHarflerBuyuk',
  varsayilanDil: 'tr'
};

export const SYSTEM_CORE_MODULE_CODES = [
  'MOD_AUTH',
  'MOD_DASHBOARD',
  'MOD_SISTEM_AYARLARI',
  'MOD_BILDIRIMLER',
  'MOD_YARDIM',
  'auth',
  'dashboard',
  'sistem_ayarlari',
  'bildirimler',
  'yardim',
  'global_arama'
];

export const DEFAULT_CORE_MODULE_CODES = SYSTEM_CORE_MODULE_CODES;

export const DEFAULT_SECTOR_MODULES_BY_PARENT_ID = {
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
  '16': 'OTH'
};

export const DEFAULT_SECTOR_MODULES_MAP = {
  // 1. Perakende & Mağazacılık (RET / 47...)
  RET: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'barkod_yonetimi',
    'MOD_ADRES'
  ],
  // 2. Gıda, İçecek & Yeme-İçme (FNB / 56... / 10...)
  FNB: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'MOD_ADRES'
  ],
  // 3. Üretim, Fabrika & İmalat Sanayi (MFG / 28...)
  MFG: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'barkod_yonetimi',
    'MOD_DEPO_SUBE',
    'MOD_BARKOD_TERMINALI',
    'MOD_ADRES'
  ],
  // 4. Hizmet, Danışmanlık & Bilişim (SRV / 62...)
  SRV: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_ADRES'
  ],
  // 5. İnşaat, Yapı & Taahhüt (CON / 41...)
  CON: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_DEPO_SUBE',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'MOD_ADRES'
  ],
  // 6. E-Ticaret & Pazaryeri Satıcıları (ECM / 47.91...)
  ECM: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'MOD_KARGO',
    'barkod_yonetimi',
    'MOD_ADRES'
  ],
  // 7. Toptan Ticaret, Dağıtım & Tedarik (WHL / 46...)
  WHL: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'MOD_DEPO_SUBE',
    'barkod_yonetimi',
    'MOD_BARKOD_TERMINALI',
    'MOD_KARGO',
    'MOD_ADRES'
  ],
  // 8. Sağlık, Medikal, İlaç & Kozmetik (HLT / 21...)
  HLT: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'barkod_yonetimi',
    'MOD_SIPARIS_YONETIMI',
    'MOD_ADRES'
  ],
  // 9. Otomotiv, Servis, Yedek Parça & Filo (AUT / 45...)
  AUT: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'barkod_yonetimi',
    'MOD_SIPARIS_YONETIMI',
    'MOD_ADRES'
  ],
  // 10. Lojistik, Taşımacılık & Depolama (LOG / 49...)
  LOG: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_KARGO',
    'MOD_DEPO_VE_STOK',
    'MOD_DEPO_SUBE',
    'MOD_SIPARIS_YONETIMI',
    'MOD_ADRES'
  ],
  // 11. Tarım, Hayvancılık & Sera (AGR / 01...)
  AGR: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'MOD_ADRES'
  ],
  // 12. Turizm, Otelcilik & Organizasyon (TRZ / 55...)
  TRZ: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'MOD_ADRES'
  ],
  // 13. Tekstil, Konfeksiyon & Deri (TEX / 13...)
  TEX: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'barkod_yonetimi',
    'MOD_ADRES'
  ],
  // 14. Enerji, Madencilik & Geri Dönüşüm (NRG / 35...)
  NRG: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'MOD_ADRES'
  ],
  // 15. Eğitim, Akademi & Yayıncılık (EDU / 85...)
  EDU: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_SIPARIS_YONETIMI',
    'MOD_ADRES'
  ],
  // 16. Diğer / Genel & Dış Ticaret (OTH)
  OTH: [
    ...SYSTEM_CORE_MODULE_CODES,
    'MOD_CARI_YONETIMI',
    'MOD_URUN_YONETIMI',
    'MOD_DEPO_VE_STOK',
    'MOD_FATURA_VE_IRSALIYE',
    'MOD_FINANS',
    'MOD_ADRES'
  ]
};

/**
 * Faaliyet alanlarının SektorelSeedDataJson alanında saklanan modül seçimlerini
 * (veya sektörün varsayılan akıllı modül dağılımını) çözümler ve sistemdeki mevcut modül ID'leri (number[]) ile eşleştirir.
 */
export const resolveSectorModules = (faaliyetIds, allSectors, allModules) => {
  if (!Array.isArray(faaliyetIds) || faaliyetIds.length === 0) return [];
  if (!Array.isArray(allSectors) || allSectors.length === 0) return [];
  if (!Array.isArray(allModules) || allModules.length === 0) return [];

  // 1. Seçili sektör nesnelerini bul
  const selectedSectors = faaliyetIds
    .map((id) => allSectors.find((s) => s.id === id))
    .filter(Boolean);

  if (selectedSectors.length === 0) return [];

  // 2. Bir üst faaliyet alanının seçili alt dalları varsa, üst çatı sektör bağımsız bir faaliyet dalı değildir;
  // yalnızca alt dalların çatı kategorisidir. Bu nedenle modül çözümlemesinde yalnızca en uçtaki (leaf)
  // seçili sektörler dikkate alınmalıdır.
  const effectiveSectors = selectedSectors.filter((sec) => {
    const hasSelectedChildren = selectedSectors.some(
      (other) => other.id !== sec.id && (other.ustFaaliyetAlaniId === sec.id || String(other.ustFaaliyetAlaniId) === String(sec.id))
    );
    return !hasSelectedChildren;
  });

  const sectorsToProcess = effectiveSectors.length > 0 ? effectiveSectors : selectedSectors;

  // 3. Sektörlerin SektorelSeedDataJson alanından veya sektörel varsayılan modül haritasından modülleri topla
  const collectedModuleIdentifiers = [];

  const cleanCode = (c) => (c || '').replace(/['"]/g, '').trim().toUpperCase();

  const getSectorDefaultList = (sec, parentSec) => {
    const secKod = cleanCode(sec.kod);
    const parentKod = cleanCode(parentSec?.kod);
    const parentIdKey = String(parentSec?.id || sec.ustFaaliyetAlaniId || '');

    // Çok Sektörlü Holding & Grup Şirketi (1601 veya 64.20) ise tüm aktif modüller
    if (sec.id === 1601 || secKod === '64.20') {
      return allModules.filter(m => m.aktifMi).map(m => m.id);
    }

    // NACE koduna göre spesifik eşleştirme
    if (secKod.startsWith('47.91')) return DEFAULT_SECTOR_MODULES_MAP.ECM;
    if (secKod.startsWith('49') || secKod.startsWith('52') || secKod.startsWith('53')) return DEFAULT_SECTOR_MODULES_MAP.LOG;
    if (secKod.startsWith('62') || secKod.startsWith('69') || secKod.startsWith('70') || secKod.startsWith('71') || secKod.startsWith('73')) return DEFAULT_SECTOR_MODULES_MAP.SRV;
    if (secKod.startsWith('46')) return DEFAULT_SECTOR_MODULES_MAP.WHL;
    if (secKod.startsWith('56') || secKod.startsWith('10')) return DEFAULT_SECTOR_MODULES_MAP.FNB;
    if (secKod.startsWith('41') || secKod.startsWith('42') || secKod.startsWith('43')) return DEFAULT_SECTOR_MODULES_MAP.CON;
    if (secKod.startsWith('45')) return DEFAULT_SECTOR_MODULES_MAP.AUT;
    if (secKod.startsWith('21') || secKod.startsWith('86')) return DEFAULT_SECTOR_MODULES_MAP.HLT;
    if (secKod.startsWith('47')) return DEFAULT_SECTOR_MODULES_MAP.RET;
    if (secKod.startsWith('13') || secKod.startsWith('14') || secKod.startsWith('15')) return DEFAULT_SECTOR_MODULES_MAP.TEX;
    if (secKod.startsWith('35') || secKod.startsWith('38')) return DEFAULT_SECTOR_MODULES_MAP.NRG;
    if (secKod.startsWith('85') || secKod.startsWith('58')) return DEFAULT_SECTOR_MODULES_MAP.EDU;
    if (secKod.startsWith('01')) return DEFAULT_SECTOR_MODULES_MAP.AGR;
    if (secKod.startsWith('55') || secKod.startsWith('79') || secKod.startsWith('82')) return DEFAULT_SECTOR_MODULES_MAP.TRZ;
    if (secKod.startsWith('28') || secKod.startsWith('25') || secKod.startsWith('22') || secKod.startsWith('31')) return DEFAULT_SECTOR_MODULES_MAP.MFG;

    // Sektör Kodu veya Üst Faaliyet Kodundan eşleştir
    if (DEFAULT_SECTOR_MODULES_MAP[secKod]) return DEFAULT_SECTOR_MODULES_MAP[secKod];
    if (DEFAULT_SECTOR_MODULES_MAP[parentKod]) return DEFAULT_SECTOR_MODULES_MAP[parentKod];

    // Üst faaliyet alan ID'sine göre eşleştir
    const parentCategory = DEFAULT_SECTOR_MODULES_BY_PARENT_ID[parentIdKey];
    if (parentCategory && DEFAULT_SECTOR_MODULES_MAP[parentCategory]) {
      return DEFAULT_SECTOR_MODULES_MAP[parentCategory];
    }

    return DEFAULT_SECTOR_MODULES_MAP.RET;
  };

  for (const sec of sectorsToProcess) {
    const rawSeed = sec.sektorelSeedDataJson ?? sec.SektorelSeedDataJson;
    let secHasModules = false;

    if (rawSeed) {
      try {
        const parsed = typeof rawSeed === 'string' ? JSON.parse(rawSeed) : rawSeed;
        if (parsed && Array.isArray(parsed.moduller)) {
          secHasModules = true;
          if (parsed.moduller.length > 0) {
            collectedModuleIdentifiers.push(...parsed.moduller);
          }
        }
      } catch (e) {
        console.error('Faaliyet SektorelSeedData parse hatası:', e);
      }
    }

    // Alt faaliyet kolunda doğrudan modül listesi yapılandırılmamış ise, üst çatı sektörün modüllerini kontrol et
    if (!secHasModules && sec.ustFaaliyetAlaniId) {
      const parentSec = allSectors.find((s) => s.id === sec.ustFaaliyetAlaniId);
      if (parentSec) {
        const rawParentSeed = parentSec.sektorelSeedDataJson ?? parentSec.SektorelSeedDataJson;
        if (rawParentSeed) {
          try {
            const parsedParent = typeof rawParentSeed === 'string' ? JSON.parse(rawParentSeed) : rawParentSeed;
            if (parsedParent && Array.isArray(parsedParent.moduller)) {
              secHasModules = true;
              if (parsedParent.moduller.length > 0) {
                collectedModuleIdentifiers.push(...parsedParent.moduller);
              }
            }
          } catch (e) {
            console.error('Üst Faaliyet SektorelSeedData parse hatası:', e);
          }
        }
      }
    }

    // Eğer ne alt sektörde ne de üst sektörde özel yapılandırılmış modül listesi yoksa, sektöre özel varsayılan dağılımı uygula
    if (!secHasModules) {
      const parentSec = sec.ustFaaliyetAlaniId ? allSectors.find((s) => s.id === sec.ustFaaliyetAlaniId) : null;
      const sectorDefaults = getSectorDefaultList(sec, parentSec);
      collectedModuleIdentifiers.push(...sectorDefaults);
    }
  }

  // 3. Toplanan modül tanımlayıcılarını allModules içerisindeki modul.id ile eşleştir
  const matchedIds = new Set();
  const normalizeKod = (k) => (k || '').trim().toLowerCase().replace(/^mod_/, '');

  for (const item of collectedModuleIdentifiers) {
    if (item === null || item === undefined) continue;

    if (typeof item === 'number') {
      const found = allModules.find((m) => (m.id === item || m.dbId === item) && (m.aktifMi !== false && m.enabled !== false));
      if (found) matchedIds.add(found.dbId ?? found.id);
      continue;
    }

    if (typeof item === 'object') {
      const objId = item.id;
      const objKod = (item.kod || item.modulKod || '').trim();
      const normObjKod = normalizeKod(objKod);
      const found = allModules.find(
        (m) =>
          (m.aktifMi !== false && m.enabled !== false) &&
          ((objId && (m.id === objId || m.dbId === objId)) ||
            (objKod && (m.kod === objKod || m.id === objKod || normalizeKod(m.kod) === normObjKod || normalizeKod(m.id) === normObjKod)))
      );
      if (found) matchedIds.add(found.dbId ?? found.id);
      continue;
    }

    if (typeof item === 'string') {
      const cleanStr = item.trim();
      const lowerStr = cleanStr.toLowerCase();
      const normStr = normalizeKod(cleanStr);

      let found = allModules.find(
        (m) =>
          (m.aktifMi !== false && m.enabled !== false) &&
          ((m.kod || '').toLowerCase() === lowerStr ||
            (m.id || '').toLowerCase() === lowerStr ||
            normalizeKod(m.kod) === normStr ||
            normalizeKod(m.id) === normStr)
      );
      if (found) {
        matchedIds.add(found.dbId ?? found.id);
        continue;
      }

      if (/^mod_\d+$/i.test(cleanStr)) {
        const num = parseInt(cleanStr.replace(/^mod_/i, ''), 10);
        found = allModules.find((m) => (m.id === num || m.dbId === num) && (m.aktifMi !== false && m.enabled !== false));
        if (found) {
          matchedIds.add(found.dbId ?? found.id);
          continue;
        }
      }

      if (/^\d+$/.test(cleanStr)) {
        const num = parseInt(cleanStr, 10);
        found = allModules.find((m) => (m.id === num || m.dbId === num) && (m.aktifMi !== false && m.enabled !== false));
        if (found) {
          matchedIds.add(found.dbId ?? found.id);
          continue;
        }
      }
    }
  }

  // Çekirdek sistem modüllerini her zaman dahil et
  for (const coreCode of SYSTEM_CORE_MODULE_CODES) {
    const foundCore = allModules.find(
      (m) => (m.aktifMi !== false && m.enabled !== false) && 
             (m.kod === coreCode || m.id === coreCode || m.isCore)
    );
    if (foundCore) {
      matchedIds.add(foundCore.id);
      if (foundCore.dbId != null) matchedIds.add(foundCore.dbId);
    }
  }

  for (const m of allModules) {
    if (m.isCore && (m.aktifMi !== false && m.enabled !== false)) {
      matchedIds.add(m.id);
      if (m.dbId != null) matchedIds.add(m.dbId);
    }
  }

  return Array.from(matchedIds);
};

export const getCleanFirmaFormData = () => ({
  firmaAdi: '',
  adres: '',
  adresIlId: null,
  adresIlceId: null,
  adresBucakId: null,
  adresKoyId: null,
  adresMahalleId: null,
  adresCaddeSokakId: null,
  adresDisKapiId: null,
  adresIcKapiId: null,
  vergiDairesi: '',
  vergiNo: '',
  yetkiliAdSoyad: '',
  telefon: '',
  email: '',
  sifre: '',
  sifreTekrar: '',
  faaliyetAlanlari: [],
  cariTuruYapilandirma: DEFAULT_CARI_TURU_CONFIG,
  cariTuruYapilandirmaJson: null,
  sektorelSeedData: DEFAULT_SEKTOREL_SEED_DATA,
  sektorelAyarlarJson: null,
  depolarVeSubeler: getInitialSeedDepolar()
});

export default function FirmaForm({ id, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { customComponents } = useCompanyModule();
  const ParaBirimleri = customComponents?.ParaBirimleri;
  const KdvAyarlari = customComponents?.KdvAyarlari;
  const Birimler = customComponents?.Birimler;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAdresRoute = location.pathname.endsWith('/adres');
  const isCurrencySubPage = location.pathname.includes('/para-birimleri');
  const isKdvSubPage = location.pathname.includes('/vergi-kdv');
  const isBirimSubPage = location.pathname.includes('/birimler');
  const isModulSettingsSubPage = location.pathname.includes('/modul-ayarlari/');
  const isSubPage = isCurrencySubPage || isKdvSubPage || isBirimSubPage || isModulSettingsSubPage || isAdresRoute;

  let activeModulKod = null;
  if (isModulSettingsSubPage) {
    const parts = location.pathname.split('/modul-ayarlari/');
    if (parts.length > 1) {
      activeModulKod = decodeURIComponent(parts[1].split('/')[0].split('?')[0]);
    }
  }
  const activeSettingsDef = activeModulKod ? ModuleSettingsRegistry.get(activeModulKod) : null;
  const { showAlert } = useAlertDialog();
  const { setHeader, clearHeader, setHeaderBreadcrumbOptions } = useHeaderApi();
  const { 
    errors, 
    clearError, 
    clearErrors, 
    setFieldError,
    validate 
  } = useAdminValidation();
  
  // Düzenleme modunda aktif sekme state'i
  const [activeTabId, setActiveTabId] = useState(() => location.state?.activeTabId || 'genel');

  useEffect(() => {
    if (location.state?.activeTabId) {
      setActiveTabId(location.state.activeTabId);
    }
  }, [location.state?.activeTabId]);

  // Sayfadan tamamen ayrıldığında (alt sayfalara değil, menüye veya başka bir ana sayfaya gidildiğinde) geçici hafızayı temizle
  const currentPathnameRef = useRef(location.pathname);
  useEffect(() => {
    currentPathnameRef.current = location.pathname;
  }, [location.pathname]);

  const adresSaveHandledRef = useRef(false);
  useEffect(() => {
    if (!isAdresRoute) {
      adresSaveHandledRef.current = false;
    }
  }, [isAdresRoute]);

  useEffect(() => {
    return () => {
      try {
        const destPath = window.location.pathname.replace(/\/+$/, '');
        const isStillInFirmaForm = destPath.startsWith('/firmalar/yeni') || 
                                   destPath.startsWith('/firmalar/duzenle') || 
                                   (destPath.startsWith('/firmalar/') && destPath !== '/firmalar');
        if (!isStillInFirmaForm) {
          sessionStorage.removeItem('webakus_wizard_step_firmaWizardForm');
          sessionStorage.removeItem('webakus_firma_form_draft');
        }
      } catch (e) {}
    };
  }, []);

  const [editingFirma, setEditingFirma] = useState(null);
  const isEditMode = Boolean(id || editingFirma);
  const [hareketler, setHareketler] = useState([]);
  const [tumSektorler, setTumSektorler] = useState([]);
  const [tumModuller, setTumModuller] = useState([]);
  const [firmaModulleri, setFirmaModulleri] = useState(() => {
    if (!location.state?.isNew && location.state?.currentFormData?.modulIds) {
      return location.state.currentFormData.modulIds;
    }
    try {
      const saved = sessionStorage.getItem('webakus_firma_form_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.modulIds) && parsed.modulIds.length > 0) {
          return parsed.modulIds;
        }
      }
    } catch (e) {}
    return [];
  });
  const hasManuallyEditedModullerRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sureUzatPrompt, setSureUzatPrompt] = useState({ isOpen: false, firmaId: null, firmaAdi: '' });
  const [kullaniciDurumu, setKullaniciDurumu] = useState(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState(DEFAULT_PASSWORD_POLICY);

  useEffect(() => {
    fetchActivePasswordPolicy().then(policy => {
      if (policy) setPasswordPolicy(policy);
    });
  }, []);
  
  // Faaliyet alanları gruplarının açık/kapalı olma durumu.
  // İlk aşamada (yeni kayıt modu) kapalıdır ([]).
  const [acikSektorler, setAcikSektorler] = useState([]);
  const [editSektorlerBaslangictaAcildi, setEditSektorlerBaslangictaAcildi] = useState(false);
  
  // Firma Kullanıcıları Yönetimi State'leri
  const [firmaKullanicilari, setFirmaKullanicilari] = useState([]);
  const [kullanicilarLoading, setKullanicilarLoading] = useState(false);
  const [kullaniciModalOpen, setKullaniciModalOpen] = useState(false);
  const [seciliKullanici, setSeciliKullanici] = useState(null);
  const [bekleyenDavetler, setBekleyenDavetler] = useState([]);
  const [davetModalOpen, setDavetModalOpen] = useState(false);

  // Depo ve Şube Yönetimi State'leri
  const [editingDepoItem, setEditingDepoItem] = useState(null);
  const [isAddingDepo, setIsAddingDepo] = useState(false);

  // Form ilk açıldığında veya Genel Bilgiler adımında Firma Ünvanı alanına otomatik odaklan
  useFirmaFormAutoFocus({
    activeTabId,
    isEditMode,
    dependencies: [id, activeTabId]
  });

  const [formData, setFormData] = useState(() => {
    if (!location.state?.isNew && location.state?.currentFormData) {
      return location.state.currentFormData;
    }
    if (!location.state?.isNew) {
      try {
        const saved = sessionStorage.getItem('webakus_firma_form_draft');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return getCleanFirmaFormData();
  });

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if (location.state?.isNew) {
      try {
        sessionStorage.removeItem('webakus_firma_form_draft');
      } catch (e) {}
      setFormData(getCleanFirmaFormData());
      setFirmaModulleri([]);
      hasManuallyEditedModullerRef.current = false;
      setActiveTabId('genel');
      clearErrors();
    } else if (location.state?.currentFormData) {
      setFormData(location.state.currentFormData);
      if (Array.isArray(location.state.currentFormData.modulIds)) {
        setFirmaModulleri(location.state.currentFormData.modulIds);
      }
    }
  }, [location.state?.isNew, location.state?.currentFormData]);

  const currentSeedParaBirimleri = formData.sektorelSeedData?.paraBirimleri || DEFAULT_SEKTOREL_SEED_DATA.paraBirimleri || [];
  const currentSeedKdvGruplari = formData.sektorelSeedData?.kdvGruplari || DEFAULT_SEKTOREL_SEED_DATA.kdvGruplari || [];
  const currentSeedBirimler = formData.sektorelSeedData?.birimler || DEFAULT_SEKTOREL_SEED_DATA.birimler || [];
  const currentMetinHarfDonusumu = formData.sektorelSeedData?.genelAyarlar?.metinHarfDonusumu 
    || formData.sektorelSeedData?.metinHarfDonusumu 
    || 'basHarflerBuyuk';

  const currentVarsayilanDil = formData.sektorelSeedData?.genelAyarlar?.varsayilanDil 
    || formData.sektorelSeedData?.varsayilanDil 
    || 'tr';

  const handleMetinHarfDonusumuChange = async (newVal) => {
    const currentGenelAyarlar = formData.sektorelSeedData?.genelAyarlar || {};
    const updatedSeedData = {
      ...(formData.sektorelSeedData || DEFAULT_SEKTOREL_SEED_DATA),
      genelAyarlar: {
        ...currentGenelAyarlar,
        metinHarfDonusumu: newVal
      },
      metinHarfDonusumu: newVal
    };
    const jsonStr = JSON.stringify(updatedSeedData);
    setFormData(prev => ({
      ...prev,
      sektorelSeedData: updatedSeedData,
      sektorelAyarlarJson: jsonStr
    }));

    if (id) {
      try {
        await axios.put(`/api/Firma/${id}`, {
          ...formData,
          sektorelSeedData: updatedSeedData,
          sektorelAyarlarJson: jsonStr
        });
      } catch (err) {
        console.error('Firma metin harf dönüşüm tercihi kaydedilemedi:', err);
      }
    }
  };

  const handleVarsayilanDilChange = async (newVal) => {
    const currentGenelAyarlar = formData.sektorelSeedData?.genelAyarlar || {};
    const updatedSeedData = {
      ...(formData.sektorelSeedData || DEFAULT_SEKTOREL_SEED_DATA),
      genelAyarlar: {
        ...currentGenelAyarlar,
        varsayilanDil: newVal
      },
      varsayilanDil: newVal
    };
    const jsonStr = JSON.stringify(updatedSeedData);
    setFormData(prev => ({
      ...prev,
      sektorelSeedData: updatedSeedData,
      sektorelAyarlarJson: jsonStr
    }));

    if (id) {
      try {
        await axios.put(`/api/Firma/${id}`, {
          ...formData,
          sektorelSeedData: updatedSeedData,
          sektorelAyarlarJson: jsonStr
        });
      } catch (err) {
        console.error('Firma varsayılan dil tercihi kaydedilemedi:', err);
      }
    }
  };

  const getBaseFirmaPath = useCallback(() => {
    const cleanPath = location.pathname
      .replace(/\/adres$/, '')
      .replace(/\/para-birimleri$/, '')
      .replace(/\/vergi-kdv$/, '')
      .replace(/\/birimler$/, '')
      .replace(/\/modul-ayarlari\/[^/]+$/, '');
    if (id) {
      return cleanPath.startsWith('/firmalar/duzenle/')
        ? `/firmalar/duzenle/${id}`
        : `/firmalar/${id}`;
    }
    if (cleanPath.startsWith('/firmalar/duzenle/') || cleanPath.startsWith('/firmalar/')) {
      const match = cleanPath.match(/\/firmalar\/(?:duzenle\/)?(\d+)/);
      if (match && match[1]) {
        return cleanPath.startsWith('/firmalar/duzenle/')
          ? `/firmalar/duzenle/${match[1]}`
          : `/firmalar/${match[1]}`;
      }
    }
    return '/firmalar/yeni';
  }, [id, location.pathname]);

  const handleOpenAdresSubPage = (item) => {
    const basePath = getBaseFirmaPath();
    const targetItemId = item?.id != null ? item.id : (item?.kod || (item?.tur === 3 ? 'MERKEZ-SUBE' : 'MERKEZ-DEPO'));
    const draftData = { ...formData, modulIds: firmaModulleri };
    try {
      sessionStorage.setItem('webakus_firma_form_draft', JSON.stringify(draftData));
    } catch (e) {}
    navigate(`${basePath}/adres?depoId=${encodeURIComponent(targetItemId)}`, {
      state: { currentFormData: draftData, activeTabId: activeTabId || 'depolarVeSubeler' }
    });
  };

  const handleOpenCurrencySubPage = () => {
    const basePath = getBaseFirmaPath();
    const draftData = { ...formData, modulIds: firmaModulleri };
    try {
      sessionStorage.setItem('webakus_firma_form_draft', JSON.stringify(draftData));
    } catch (e) {}
    navigate(`${basePath}/para-birimleri`, {
      state: { currentFormData: draftData, activeTabId: 'sektorelAyarlar' }
    });
  };

  const handleBackFromCurrency = () => {
    const basePath = getBaseFirmaPath();
    navigate(basePath, {
      state: { currentFormData: formData, activeTabId: 'sektorelAyarlar' }
    });
  };

  const handleCurrencyMemoryUpdate = async (updatedItems) => {
    const updatedSeedData = {
      ...(formData.sektorelSeedData || DEFAULT_SEKTOREL_SEED_DATA),
      paraBirimleri: updatedItems
    };
    const jsonStr = JSON.stringify(updatedSeedData);
    setFormData(prev => ({
      ...prev,
      sektorelSeedData: updatedSeedData,
      sektorelAyarlarJson: jsonStr
    }));

    if (id) {
      try {
        await axios.put(`/api/Firma/${id}`, {
          ...formData,
          sektorelSeedData: updatedSeedData,
          sektorelAyarlarJson: jsonStr
        });
      } catch (err) {
        console.error('Firma para birimleri kaydedilemedi:', err);
      }
    }
  };

  const handleOpenKdvSubPage = () => {
    const basePath = getBaseFirmaPath();
    navigate(`${basePath}/vergi-kdv`, {
      state: { currentFormData: formData, activeTabId: 'sektorelAyarlar' }
    });
  };

  const handleBackFromKdv = () => {
    const basePath = getBaseFirmaPath();
    navigate(basePath, {
      state: { currentFormData: formData, activeTabId: 'sektorelAyarlar' }
    });
  };

  const handleKdvMemoryUpdate = async (updatedItems) => {
    const updatedSeedData = {
      ...(formData.sektorelSeedData || DEFAULT_SEKTOREL_SEED_DATA),
      kdvGruplari: updatedItems
    };
    const jsonStr = JSON.stringify(updatedSeedData);
    setFormData(prev => ({
      ...prev,
      sektorelSeedData: updatedSeedData,
      sektorelAyarlarJson: jsonStr
    }));

    if (id) {
      try {
        await axios.put(`/api/Firma/${id}`, {
          ...formData,
          sektorelSeedData: updatedSeedData,
          sektorelAyarlarJson: jsonStr
        });
      } catch (err) {
        console.error('Firma vergi/KDV ayarları kaydedilemedi:', err);
      }
    }
  };

  const handleOpenBirimSubPage = () => {
    const basePath = getBaseFirmaPath();
    navigate(`${basePath}/birimler`, {
      state: { currentFormData: formData, activeTabId: 'sektorelAyarlar' }
    });
  };

  const handleBackFromBirim = () => {
    const basePath = getBaseFirmaPath();
    navigate(basePath, {
      state: { currentFormData: formData, activeTabId: 'sektorelAyarlar' }
    });
  };

  const handleBirimMemoryUpdate = async (updatedItems) => {
    const updatedSeedData = {
      ...(formData.sektorelSeedData || DEFAULT_SEKTOREL_SEED_DATA),
      birimler: updatedItems
    };
    const jsonStr = JSON.stringify(updatedSeedData);
    setFormData(prev => ({
      ...prev,
      sektorelSeedData: updatedSeedData,
      sektorelAyarlarJson: jsonStr
    }));

    if (id) {
      try {
        await axios.put(`/api/Firma/${id}`, {
          ...formData,
          sektorelSeedData: updatedSeedData,
          sektorelAyarlarJson: jsonStr
        });
      } catch (err) {
        console.error('Firma ölçü birimleri kaydedilemedi:', err);
      }
    }
  };

  const handleOpenModulSettings = (modulKod) => {
    const basePath = getBaseFirmaPath();
    const draftData = { ...formData, modulIds: firmaModulleri };
    try {
      sessionStorage.setItem('webakus_firma_form_draft', JSON.stringify(draftData));
    } catch (e) {}
    navigate(`${basePath}/modul-ayarlari/${encodeURIComponent(modulKod)}`, {
      state: { currentFormData: draftData, activeTabId: 'moduller' }
    });
  };

  const handleBackFromModulSettings = () => {
    const basePath = getBaseFirmaPath();
    const draftData = { ...formData, modulIds: firmaModulleri };
    navigate(basePath, {
      state: { currentFormData: draftData, activeTabId: 'moduller' }
    });
  };

  const handleModulSettingsMemoryUpdate = async (newVal) => {
    if (!activeModulKod) return;

    const currentModulAyarlari = formData.sektorelSeedData?.modulAyarlari || {};
    const updatedModulAyarlari = {
      ...currentModulAyarlari,
      [activeModulKod]: newVal
    };

    const isUrunModul = activeModulKod.toUpperCase().includes('URUN') || 
                        activeModulKod.toUpperCase().includes('STOK');
    if (isUrunModul) {
      updatedModulAyarlari['MOD_URUN_YONETIMI'] = newVal;
      updatedModulAyarlari['MOD_URUN_HIZMET'] = newVal;
    }

    const updatedSeedData = {
      ...(formData.sektorelSeedData || DEFAULT_SEKTOREL_SEED_DATA),
      modulAyarlari: updatedModulAyarlari
    };

    const isCariModul = activeModulKod.toUpperCase() === 'MOD_CARI' || 
                        activeModulKod.toLowerCase() === 'cari-yonetimi' ||
                        activeModulKod.toUpperCase() === 'MOD_CARI_YONETIMI';
    const updatedCariConfig = isCariModul
      ? { 
          ...formData.cariTuruYapilandirma, 
          ...(newVal?.kokSiralama ? { kokSiralama: newVal.kokSiralama } : {}),
          ...(newVal?.bireyselUnvanSablonu !== undefined ? { bireyselUnvanSablonu: Number(newVal.bireyselUnvanSablonu) } : {})
        }
      : formData.cariTuruYapilandirma;

    const jsonSeed = JSON.stringify(updatedSeedData);
    const jsonCari = updatedCariConfig ? JSON.stringify(updatedCariConfig) : null;

    setFormData(prev => ({
      ...prev,
      sektorelSeedData: updatedSeedData,
      sektorelAyarlarJson: jsonSeed,
      cariTuruYapilandirma: updatedCariConfig,
      cariTuruYapilandirmaJson: jsonCari
    }));

    if (id) {
      try {
        await axios.put(`/api/Firma/${id}`, {
          ...formData,
          modulIds: firmaModulleri,
          sektorelSeedData: updatedSeedData,
          sektorelAyarlarJson: jsonSeed,
          cariTuruYapilandirma: updatedCariConfig,
          cariTuruYapilandirmaJson: jsonCari
        });
        toast.success(t('firma_modul_ayarlari_kaydedildi', 'Firma modül ayarları kaydedildi.'));
      } catch (err) {
        console.error('Firma modül ayarları kaydedilemedi:', err);
        toast.error(t('auto_kayit_sirasinda_bir_hata_olustu', 'Kayıt sırasında bir hata oluştu.'));
      }
    }
  };

  // Form açıkken üst başlık çubuğunda (Header) Geri Dön butonu ve Breadcrumb başlığını senkronize et
  useEffect(() => {
    const isAdres = location.pathname.endsWith('/adres');
    const isCurrency = location.pathname.includes('/para-birimleri');
    const isKdv = location.pathname.includes('/vergi-kdv');
    const isBirim = location.pathname.includes('/birimler');
    const isModulSettings = location.pathname.includes('/modul-ayarlari/');
    const formTitle = editingFirma?.firmaAdi || (id ? t('firma_duzenle', 'Firma Düzenle') : t('yeni_firma', 'Yeni Firma'));
    const returnPath = getBaseFirmaPath();
    
    if (setHeaderBreadcrumbOptions) {
      if (isAdres) {
        setHeaderBreadcrumbOptions({ hideBreadcrumb: true });
      } else if (isCurrency) {
        setHeaderBreadcrumbOptions({
          subTrail: [
            {
              label: formTitle,
              onClick: () => navigate(returnPath, { state: { currentFormData: formDataRef.current, activeTabId: 'sektorelAyarlar' } })
            },
            {
              label: t('sektorel_para_birimleri_baslik', 'Para Birimleri Yapılandırması')
            }
          ]
        });
      } else if (isKdv) {
        setHeaderBreadcrumbOptions({
          subTrail: [
            {
              label: formTitle,
              onClick: () => navigate(returnPath, { state: { currentFormData: formDataRef.current, activeTabId: 'sektorelAyarlar' } })
            },
            {
              label: t('sektorel_vergi_kdv_baslik', 'Vergi ve KDV Ayarları')
            }
          ]
        });
      } else if (isBirim) {
        setHeaderBreadcrumbOptions({
          subTrail: [
            {
              label: formTitle,
              onClick: () => navigate(returnPath, { state: { currentFormData: formDataRef.current, activeTabId: 'sektorelAyarlar' } })
            },
            {
              label: t('sektorel_birimler_baslik', 'Ölçü Birimleri Yapılandırması')
            }
          ]
        });
      } else if (isModulSettings) {
        setHeaderBreadcrumbOptions({
          subTrail: [
            {
              label: formTitle,
              onClick: () => navigate(returnPath, { state: { currentFormData: formDataRef.current, activeTabId: 'moduller' } })
            },
            {
              label: activeSettingsDef?.title || t('modul_ayarlari', 'Modül Ayarları')
            }
          ]
        });
      } else {
        setHeaderBreadcrumbOptions({
          recordTitle: formTitle
        });
      }
    }

    if (setHeader) {
      const getBackHandler = () => {
        if (isAdres) {
          return () => {
            if (adresSaveHandledRef.current) return;
            navigate(returnPath, { state: { currentFormData: { ...formDataRef.current, modulIds: firmaModulleri }, activeTabId: activeTabId || 'depolarVeSubeler' } });
          };
        }
        if (isCurrency || isKdv || isBirim) {
          return () => navigate(returnPath, { state: { currentFormData: { ...formDataRef.current, modulIds: firmaModulleri }, activeTabId: 'sektorelAyarlar' } });
        }
        if (isModulSettings) {
          return () => navigate(returnPath, { state: { currentFormData: { ...formDataRef.current, modulIds: firmaModulleri }, activeTabId: 'moduller' } });
        }
        return () => {
          if (typeof onClose === 'function') {
            onClose();
          } else {
            navigate('/firmalar');
          }
        };
      };

      setHeader('firma-form-header', (
        <BackButton 
          onClick={getBackHandler()} 
          title={t('auto_geri_don', 'Geri Dön')} 
        />
      ));
    }

    return () => {
      if (clearHeader) clearHeader('firma-form-header');
      if (setHeaderBreadcrumbOptions) setHeaderBreadcrumbOptions(null);
    };
  }, [id, editingFirma?.firmaAdi, location.pathname, location.search, onClose, setHeader, clearHeader, setHeaderBreadcrumbOptions, navigate, getBaseFirmaPath, activeTabId, searchParams, t]);

  useEffect(() => {
    fetchSektorler();
    fetchTumModuller();
  }, []);

  // Faaliyet alanları ve modüller yüklendiğinde veya sektörler değiştikçe modül seçimini sektörden otomatik senkronize et
  useEffect(() => {
    if (!editingFirma && !hasManuallyEditedModullerRef.current) {
      if (tumModuller.length > 0 && tumSektorler.length > 0 && formData.faaliyetAlanlari?.length > 0) {
        const resolved = resolveSectorModules(formData.faaliyetAlanlari, tumSektorler, tumModuller);
        if (resolved && resolved.length > 0) {
          setFirmaModulleri(resolved);
          setFormData(prev => ({ ...prev, modulIds: resolved }));
        }
      } else if (!formData.faaliyetAlanlari || formData.faaliyetAlanlari.length === 0) {
        const coreIds = Array.from(new Set(
          tumModuller
            .filter((m: any) => Boolean(m.isCore) || SYSTEM_CORE_MODULE_CODES.includes(m.kod) || SYSTEM_CORE_MODULE_CODES.includes(m.id))
            .flatMap((m: any) => [m.id, m.dbId].filter(Boolean))
        ));
        setFirmaModulleri(coreIds);
        setFormData(prev => ({ ...prev, modulIds: coreIds }));
      }
    }
  }, [editingFirma, tumModuller, tumSektorler, formData.faaliyetAlanlari]);

  useEffect(() => {
    setKullaniciDurumu(null);
    setEmailChecking(false);
    setEditSektorlerBaslangictaAcildi(false);
    setAcikSektorler([]);
    if (id) {
      fetchFirmaDetay(id);
    } else {
      setEditingFirma(null);
      setHareketler([]);
      if (location.state?.isNew || !location.state?.currentFormData) {
        setFormData(getCleanFirmaFormData());
        setActiveTabId('genel');
      }
    }
  }, [id, location.state?.isNew]);

  const handleEmailCheck = async (emailVal?: string) => {
    const email = (emailVal !== undefined ? emailVal : formData.email || '').trim();
    if (!email || !email.includes('@') || editingFirma) {
      setKullaniciDurumu(null);
      return;
    }

    try {
      setEmailChecking(true);
      const res = await axios.get('/api/Firma/email-kontrol', { params: { email } });
      setKullaniciDurumu(res.data);
      if (res.data.mevcutKullanici) {
        setFormData(prev => ({
          ...prev,
          sifre: '',
          sifreTekrar: '',
          yetkiliAdSoyad: prev.yetkiliAdSoyad || res.data.adSoyad || ''
        }));
      }
    } catch (err) {
      console.error('Email kontrol hatası:', err);
    } finally {
      setEmailChecking(false);
    }
  };

  const [vergiNoChecking, setVergiNoChecking] = useState(false);

  const handleVergiNoCheck = async (vergiNoVal?: string) => {
    const rawVal = (vergiNoVal !== undefined ? vergiNoVal : formData.vergiNo || '').trim();
    if (!rawVal) return true;

    // Temel format ve algoritma doğrulaması
    const formatErrors = validateFirmaStep1({ ...formData, vergiNo: rawVal });
    if (formatErrors.vergiNo) {
      setFieldError('vergiNo', formatErrors.vergiNo);
      return false;
    }

    try {
      setVergiNoChecking(true);
      const res = await axios.get('/api/Firma/vergi-no-kontrol', {
        params: {
          vergiNo: rawVal,
          excludeId: editingFirma?.id || undefined
        }
      });

      if (res.data?.exists) {
        setFieldError('vergiNo', getDuplicateVergiNoError());
        return false;
      } else {
        clearError('vergiNo');
        return true;
      }
    } catch (err) {
      console.error('Vergi no kontrol hatası:', err);
      return true;
    } finally {
      setVergiNoChecking(false);
    }
  };

  const fetchTumModuller = async () => {
    try {
      // Modül Yönetimi ile aynı kaynaktan (modules.json / config-file) ERP modüllerini çek
      const [configRes, dbRes] = await Promise.allSettled([
        axios.get('/api/moduller/config-file', { params: { kapsam: 'ERP', scope: 'ERP' } }),
        axios.get('/api/Moduller')
      ]);

      const configModules: any[] = configRes.status === 'fulfilled' ? (configRes.value.data?.modules || []) : [];
      const dbModules: any[] = dbRes.status === 'fulfilled' ? (dbRes.value.data || []) : [];

      let mergedModules: any[] = [];

      if (configModules.length > 0) {
        mergedModules = configModules.map((cm: any) => {
          const matchDb = dbModules.find((dm: any) => 
            dm.kod === cm.id || 
            dm.kod?.toLowerCase() === cm.id?.toLowerCase() ||
            dm.ad?.toLowerCase() === cm.title?.toLowerCase()
          );
          return {
            ...cm,
            dbId: matchDb?.id ?? null,
            kod: matchDb?.kod ?? cm.id,
            title: cm.title || matchDb?.ad || cm.id,
            isCore: Boolean(cm.isCore || (matchDb && SYSTEM_CORE_MODULE_CODES.includes(matchDb.kod))),
            enabled: cm.enabled !== false,
            order: cm.order ?? 0
          };
        }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      } else if (dbModules.length > 0) {
        mergedModules = dbModules.map((dm: any, idx: number) => ({
          id: dm.kod || `mod_${dm.id}`,
          dbId: dm.id,
          kod: dm.kod,
          title: dm.ad || dm.kod,
          package: dm.paketYolu || '',
          iconName: dm.ikon || 'Package',
          isCore: SYSTEM_CORE_MODULE_CODES.includes(dm.kod),
          enabled: dm.aktifMi !== false,
          order: dm.sira ?? idx
        }));
      }

      setTumModuller(mergedModules);

      if (!id && !hasManuallyEditedModullerRef.current) {
        if (formData.faaliyetAlanlari && formData.faaliyetAlanlari.length > 0 && tumSektorler.length > 0) {
          const resolved = resolveSectorModules(formData.faaliyetAlanlari, tumSektorler, mergedModules);
          if (resolved && resolved.length > 0) {
            setFirmaModulleri(resolved);
            setFormData(prev => ({ ...prev, modulIds: resolved }));
          }
        }
      }
    } catch (err) {
      console.error('Modüller getirilemedi:', err);
    }
  };

  const fetchSektorler = async () => {
    try {
      const res = await axios.get('/api/FaaliyetAlani/admin');
      const sekt = res.data || [];
      setTumSektorler(sekt);
      if (!id && !hasManuallyEditedModullerRef.current && formData.faaliyetAlanlari?.length > 0 && tumModuller.length > 0) {
        const resolved = resolveSectorModules(formData.faaliyetAlanlari, sekt, tumModuller);
        if (resolved && resolved.length > 0) {
          setFirmaModulleri(resolved);
          setFormData(prev => ({ ...prev, modulIds: resolved }));
        }
      }
    } catch (err) {
      console.error('Sektörler getirilemedi:', err);
    }
  };

  const fetchFirmaDetay = async (firmaId) => {
    try {
      setDetailLoading(true);
      const response = await axios.get(`/api/Firma/${firmaId}`);
      const firma = response.data.firma;
      setEditingFirma(firma);
      setHareketler(response.data.hareketler || []);
      setFirmaKullanicilari(response.data.kullanicilar || []);
      fetchFirmaDavetleri(firmaId);

      let parsedCariConfig = DEFAULT_CARI_TURU_CONFIG;
      const rawCariConfig = firma.cariTuruYapilandirmaJson ?? firma.CariTuruYapilandirmaJson;
      if (rawCariConfig) {
        try {
          const parsed = typeof rawCariConfig === 'string' ? JSON.parse(rawCariConfig) : rawCariConfig;
          parsedCariConfig = {
            ...DEFAULT_CARI_TURU_CONFIG,
            ...parsed
          };
        } catch (e) {
          console.error('CariTuru parse hatası:', e);
        }
      } else if (firma.faaliyetAlanlari && firma.faaliyetAlanlari.length > 0) {
        const firstFaaliyet = firma.faaliyetAlanlari[0];
        const rawFaaliyetConfig = firstFaaliyet.cariTuruYapilandirmaJson ?? firstFaaliyet.CariTuruYapilandirmaJson;
        if (rawFaaliyetConfig) {
          try {
            const parsed = typeof rawFaaliyetConfig === 'string' ? JSON.parse(rawFaaliyetConfig) : rawFaaliyetConfig;
            parsedCariConfig = {
              ...DEFAULT_CARI_TURU_CONFIG,
              ...parsed
            };
          } catch (e) {
            console.error('Faaliyet CariTuru parse hatası:', e);
          }
        }
      }

      let parsedSeedData = DEFAULT_SEKTOREL_SEED_DATA;
      const rawSeedData = firma.sektorelAyarlarJson ?? firma.SektorelAyarlarJson;
      if (rawSeedData) {
        try {
          const parsed = typeof rawSeedData === 'string' ? JSON.parse(rawSeedData) : rawSeedData;
          parsedSeedData = {
            ...DEFAULT_SEKTOREL_SEED_DATA,
            ...parsed
          };
        } catch (e) {
          console.error('SektorelAyarlar parse hatası:', e);
        }
      } else if (firma.faaliyetAlanlari && firma.faaliyetAlanlari.length > 0) {
        const firstFaaliyet = firma.faaliyetAlanlari[0];
        const rawFaaliyetSeed = firstFaaliyet.sektorelSeedDataJson ?? firstFaaliyet.SektorelSeedDataJson;
        if (rawFaaliyetSeed) {
          try {
            const parsed = typeof rawFaaliyetSeed === 'string' ? JSON.parse(rawFaaliyetSeed) : rawFaaliyetSeed;
            parsedSeedData = {
              ...DEFAULT_SEKTOREL_SEED_DATA,
              ...parsed
            };
          } catch (e) {
            console.error('Faaliyet SektorelSeed parse hatası:', e);
          }
        }
      }

      if (!location.state?.currentFormData) {
        const rawDepolar = response.data.depolarVeSubeler;
        let loadedDepolar = (Array.isArray(rawDepolar) && rawDepolar.length > 0)
          ? rawDepolar
          : getInitialSeedDepolar();

        loadedDepolar = loadedDepolar.map(item => {
          const isBranch = item.tur === 3;
          const fallbackAdres = isBranch ? (item.adres || firma.adres || '') : (item.adres || '');
          const fallbackIlId = item.adresIlId ?? item.ilId ?? (isBranch ? firma.adresIlId : null);
          const fallbackIlceId = item.adresIlceId ?? item.ilceId ?? (isBranch ? firma.adresIlceId : null);

          return {
            ...item,
            kod: item.kod || item.kodu || (isBranch ? 'SUB-01' : 'DEP-01'),
            kodu: item.kodu || item.kod || (isBranch ? 'SUB-01' : 'DEP-01'),
            ad: item.ad || (isBranch ? t('merkez_sube_bolumu', 'Merkez Şube') : t('merkez_depo_bolumu', 'Merkez Depo')),
            adres: fallbackAdres,
            acikAdres: item.acikAdres || fallbackAdres,
            adresIlId: fallbackIlId,
            ilId: fallbackIlId,
            adresIlceId: fallbackIlceId,
            ilceId: fallbackIlceId,
            adresBucakId: item.adresBucakId ?? (isBranch ? firma.adresBucakId : null),
            adresKoyId: item.adresKoyId ?? (isBranch ? firma.adresKoyId : null),
            adresMahalleId: item.adresMahalleId ?? (isBranch ? firma.adresMahalleId : null),
            adresCaddeSokakId: item.adresCaddeSokakId ?? (isBranch ? firma.adresCaddeSokakId : null),
            adresDisKapiId: item.adresDisKapiId ?? (isBranch ? firma.adresDisKapiId : null),
            adresIcKapiId: item.adresIcKapiId ?? (isBranch ? firma.adresIcKapiId : null),
            telefon: item.telefon || (isBranch ? firma.telefon : '')
          };
        });

        setFormData({
          firmaAdi: firma.firmaAdi || '',
          adres: firma.adres || '',
          adresIlId: firma.adresIlId || null,
          adresIlceId: firma.adresIlceId || null,
          adresBucakId: firma.adresBucakId || null,
          adresKoyId: firma.adresKoyId || null,
          adresMahalleId: firma.adresMahalleId || null,
          adresCaddeSokakId: firma.adresCaddeSokakId || null,
          adresDisKapiId: firma.adresDisKapiId || null,
          adresIcKapiId: firma.adresIcKapiId || null,
          vergiDairesi: firma.vergiDairesi || '',
          vergiNo: firma.vergiNo || '',
          yetkiliAdSoyad: firma.yetkiliAdSoyad || '',
          telefon: firma.telefon || '',
          email: firma.email || '',
          sifre: '',
          sifreTekrar: '',
          faaliyetAlanlari: firma.faaliyetAlanlari ? firma.faaliyetAlanlari.map((f) => f.id) : [],
          cariTuruYapilandirma: parsedCariConfig,
          cariTuruYapilandirmaJson: rawCariConfig || JSON.stringify(parsedCariConfig),
          sektorelSeedData: parsedSeedData,
          sektorelAyarlarJson: rawSeedData || JSON.stringify(parsedSeedData),
          depolarVeSubeler: loadedDepolar
        });
      }

      const modullerRes = await axios.get(`/api/Firma/${firmaId}/moduller`);
      if (modullerRes.data && modullerRes.data.length > 0) {
        const loadedIds = modullerRes.data.flatMap((m: any) => [
          m.modulId ?? m.ModulId ?? m.id,
          m.modul?.kod ?? m.Modul?.Kod,
          m.modul?.ad ?? m.Modul?.Ad
        ].filter(Boolean));
        setFirmaModulleri(loadedIds);
      } else {
        const faIds = firma.faaliyetAlanlari ? firma.faaliyetAlanlari.map((f: any) => f.id) : [];
        const resolved = resolveSectorModules(faIds, tumSektorler, tumModuller);
        setFirmaModulleri(resolved || []);
      }
    } catch (error) {
      showAlert('error', t('hata_baslik', 'Hata'), t('firma_detaylari_getirilemedi', 'Firma detayları getirilirken hata oluştu.'));
      if (onClose) onClose();
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchFirmaKullanicilari = async (firmaId) => {
    try {
      setKullanicilarLoading(true);
      const res = await axios.get(`/api/Firma/${firmaId}/kullanicilar`);
      setFirmaKullanicilari(res.data || []);
    } catch (err) {
      console.error('Kullanıcılar getirilemedi:', err);
    } finally {
      setKullanicilarLoading(false);
    }
  };

  const fetchFirmaDavetleri = async (firmaId) => {
    try {
      const res = await axios.get(`/api/Firma/${firmaId}/davetler`);
      setBekleyenDavetler(res.data || []);
    } catch (err) {
      console.error('Davetler getirilemedi:', err);
    }
  };

  const handleDavetIptal = (davetId) => {
    showAlert(
      'confirm',
      t('davet_iptali', 'Davet İptali'),
      t('davet_iptal_onay', 'Bu daveti iptal etmek istediğinize emin misiniz? Gönderilen davet bağlantısı geçersiz kılınacaktır.'),
      async () => {
        try {
          await axios.delete(`/api/Firma/${id}/davetler/${davetId}`);
          toast.success(t('davet_iptal_edildi', 'Davet başarıyla iptal edildi.'));
          if (id) fetchFirmaDavetleri(id);
        } catch (err) {
          showAlert('error', t('hata_baslik', 'Hata'), t('davet_iptal_edilemedi', 'Davet iptal edilirken hata oluştu.'));
        }
      }
    );
  };

  const handleYeniKullaniciEkle = () => {
    setDavetModalOpen(true);
  };

  const handleKullaniciDuzenle = (user) => {
    setSeciliKullanici(user);
    setKullaniciModalOpen(true);
  };

  const handleKullaniciSil = (user) => {
    showAlert(
      'confirm',
      t('kullanici_duzenle', 'Kullanıcı Düzenle'),
      `"${user.adSoyad || user.email}" ${t('kullanici_sil_onay', 'isimli kullanıcının bu firmadaki yetkisini kaldırmak istediğinize emin misiniz?')}`,
      async () => {
        try {
          const res = await axios.delete(`/api/Auth/sistem-kullanicilari/${user.id}`);
          toast.success(res.data?.mesaj || t('kullanici_silindi', 'Kullanıcı başarıyla silindi.'));
          if (id) {
            fetchFirmaKullanicilari(id);
          }
        } catch (err) {
          showAlert(
            'error',
            t('hata_baslik', 'Hata'),
            err.response?.data?.mesaj || err.response?.data?.message || t('kullanici_silinemedi', 'Kullanıcı silinirken bir hata oluştu.')
          );
        }
      },
      t('sil', 'Sil'),
      t('vazgec', 'Vazgeç')
    );
  };

  const handleSureUzat = useCallback((firmaId, firmaAdi) => {
    setSureUzatPrompt({ isOpen: true, firmaId, firmaAdi });
  }, []);

  const onConfirmSureUzat = useCallback(async (gun) => {
    if (gun && !isNaN(gun)) {
      try {
        await axios.put(`/api/Firma/${sureUzatPrompt.firmaId}/sure-uzat`, { ekGunSayisi: parseInt(gun, 10) });
        fetchFirmaDetay(sureUzatPrompt.firmaId);
        if (onSuccess) onSuccess();
        toast.success(t('sure_basariyla_uzatildi', 'Süre başarıyla uzatıldı.'));
        setSureUzatPrompt({ isOpen: false, firmaId: null, firmaAdi: '' });
      } catch (err) {
        showAlert('error', t('islem_basarisiz', 'İşlem Başarısız'), err.response?.data?.mesaj || t('islem_basarisiz', 'İşlem başarısız.'));
      }
    }
  }, [sureUzatPrompt.firmaId, onSuccess, showAlert, t]);

  const handleLisansaGecir = useCallback((firmaId, firmaAdi) => {
    showAlert(
      'confirm',
      t('lisansa_gecir_baslik', 'Lisansa Geçir'),
      t('lisansa_gecir_onay_mesaj', { firmaAdi }),
      async () => {
        try {
          await axios.put(`/api/Firma/${firmaId}/lisansa-gecir`);
          fetchFirmaDetay(firmaId);
          if (onSuccess) onSuccess();
          toast.success(t('firma_lisansa_gecirildi', 'Firma başarıyla lisanslı moda geçirildi.'));
        } catch (err) {
          showAlert('error', t('islem_basarisiz', 'İşlem Başarısız'), err.response?.data?.mesaj || t('islem_basarisiz', 'İşlem başarısız.'));
        }
      },
      t('evet_lisansa_gecir', 'Evet, Lisansa Geçir'),
      t('iptal', 'İptal')
    );
  }, [showAlert, onSuccess, t]);

  const handleFinish = async (e?: any) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    const isValid = validate(validateFirmaForm, formData, editingFirma, kullaniciDurumu, passwordPolicy);
    if (!isValid) {
      toast.error(t('lutfen_zorunlu_alanlari_doldurun', 'Lütfen zorunlu alanları eksiksiz doldurunuz.'));
      return;
    }

    const isVergiNoUnique = await handleVergiNoCheck();
    if (!isVergiNoUnique) {
      toast.error(getDuplicateVergiNoError());
      return;
    }

    clearErrors();

    const numericModulIds = Array.from(new Set(
      firmaModulleri
        .map((mId: any) => {
          if (typeof mId === 'number') return mId;
          if (typeof mId === 'string' && /^\d+$/.test(mId)) return parseInt(mId, 10);
          const found = tumModuller.find((tm: any) => tm.id === mId || tm.kod === mId);
          return found?.dbId ?? (typeof found?.id === 'number' ? found.id : null);
        })
        .filter((id): id is number => typeof id === 'number' && !isNaN(id))
    ));

    const primarySube = (formData.depolarVeSubeler || []).find(d => d.tur === 3 && d.adres) || (formData.depolarVeSubeler || []).find(d => d.adres);
    const savePayload = {
      ...formData,
      modulIds: numericModulIds,
      depolarVeSubeler: formData.depolarVeSubeler,
      cariTuruYapilandirmaJson: formData.cariTuruYapilandirma ? JSON.stringify(formData.cariTuruYapilandirma) : (formData.cariTuruYapilandirmaJson || null),
      sektorelAyarlarJson: formData.sektorelSeedData ? JSON.stringify(formData.sektorelSeedData) : (formData.sektorelAyarlarJson || null)
    };

    if (primarySube && (!savePayload.adres || savePayload.adres.trim() === '')) {
      savePayload.adres = primarySube.adres;
      savePayload.adresIlId = primarySube.adresIlId;
      savePayload.adresIlceId = primarySube.adresIlceId;
      savePayload.adresBucakId = primarySube.adresBucakId;
      savePayload.adresKoyId = primarySube.adresKoyId;
      savePayload.adresMahalleId = primarySube.adresMahalleId;
      savePayload.adresCaddeSokakId = primarySube.adresCaddeSokakId;
      savePayload.adresDisKapiId = primarySube.adresDisKapiId;
      savePayload.adresIcKapiId = primarySube.adresIcKapiId;
    }

    setSaving(true);
    try {
      if (editingFirma && editingFirma.id) {
        await axios.put(`/api/Firma/${editingFirma.id}`, savePayload);
        try {
          if (numericModulIds.length > 0) {
            await axios.put(`/api/Firma/${editingFirma.id}/moduller`, numericModulIds);
          }
        } catch (mErr) {
          console.warn('Modül güncelleme ikincil endpoint uyarısı:', mErr);
        }
        toast.success(t('firma_bilgileri_guncellendi', 'Firma bilgileri ve modül izinleri başarıyla güncellendi.'));
        if (onSuccess) {
          onSuccess(editingFirma.id);
        } else if (onClose) {
          onClose();
        }
      } else {
        const createRes = await axios.post(`/api/Firma/kayit/demo`, savePayload);
        const newFirmaId = createRes.data?.firmaId || createRes.data?.id;
        if (newFirmaId && numericModulIds.length > 0) {
          try {
            await axios.put(`/api/Firma/${newFirmaId}/moduller`, numericModulIds);
          } catch (mErr) {
            console.error('Modül yetkileri atanırken hata:', mErr);
          }
        }
        toast.success(t('yeni_firma_olusturuldu', 'Yeni firma ve yönetici hesabı başarıyla oluşturuldu.'));
        if (onSuccess) {
          onSuccess(newFirmaId);
        } else if (onClose) {
          onClose();
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.mesaj || err.response?.data?.detay || t('kayit_sirasinda_hata', 'Kayıt sırasında bir hata oluştu.');
      if (err.response?.status === 400 && errorMessage.toLowerCase().includes('vergi numarası')) {
        setFieldError('vergiNo', errorMessage);
      }
      showAlert('error', t('kayit_hatasi', 'Kayıt Hatası'), errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Adım Doğrulama Fonksiyonları (Modül içi validators/firmaFormValidation.ts'den)
  const validateStep1 = async () => {
    const isValid = validate(validateFirmaStep1, formData);
    if (!isValid) {
      toast.error(t('lutfen_zorunlu_alanlari_doldurun', 'Lütfen zorunlu alanları eksiksiz doldurunuz.'));
      return false;
    }

    const isUnique = await handleVergiNoCheck();
    if (!isUnique) {
      toast.error(getDuplicateVergiNoError());
      return false;
    }

    return true;
  };

  const validateStepFaaliyetAlanlari = () => {
    const isValid = validate(validateFirmaFaaliyetAlanlari, formData);
    if (!isValid) {
      toast.error(t('en_az_bir_faaliyet_alani_secilmeli', 'En az bir faaliyet alanı seçilmelidir.'));
    }
    return isValid;
  };

  const validateStepDepolarVeSubeler = () => {
    const isValid = validate(validateFirmaDepolarVeSubeler, formData);
    if (!isValid) {
      toast.error(t('lutfen_tum_depo_sube_adreslerini_doldurun', 'Lütfen tüm depo ve şubelerin adres bilgilerini eksiksiz doldurunuz.'));
    }
    return isValid;
  };

  const validateStep4 = () => {
    const isValid = validate(validateFirmaStep4, formData, editingFirma, kullaniciDurumu, passwordPolicy);
    if (!isValid) {
      toast.error(t('lutfen_yonetici_hesap_bilgilerini_doldurun', 'Lütfen yönetici hesabı alanlarını eksiksiz doldurunuz.'));
    }
    return isValid;
  };

  const handleSaveDepoMemory = (savedItem) => {
    let currentList = [...(formData.depolarVeSubeler || [])];
    if (editingDepoItem && (editingDepoItem.id !== undefined || editingDepoItem.kod)) {
      currentList = currentList.map(item => 
        (editingDepoItem.id && item.id === editingDepoItem.id) || (editingDepoItem.kod && item.kod === editingDepoItem.kod)
          ? { ...item, ...savedItem, id: item.id || savedItem.id }
          : item
      );
    } else {
      const newId = currentList.length > 0 ? Math.max(...currentList.map(i => i.id || 0)) + 1 : 1;
      currentList.push({ ...savedItem, id: newId });
    }
    setFormData(prev => ({
      ...prev,
      depolarVeSubeler: currentList
    }));
    clearError('depolarVeSubeler');
    setEditingDepoItem(null);
    setIsAddingDepo(false);
  };

  const handleAddressChange = (identifier, value) => {
    setFormData(prev => ({
      ...prev,
      depolarVeSubeler: (prev.depolarVeSubeler || []).map(item => {
        if ((item.id !== undefined && item.id === identifier) || (item.kod && item.kod === identifier)) {
          return {
            ...item,
            adres: value
          };
        }
        return item;
      })
    }));
    clearError('depolarVeSubeler');
    clearError(`depo_adres_${identifier}`);
  };

  const handleDepoAddressLayerChange = (identifier, updatedAddressData) => {
    setFormData(prev => {
      const updatedDepolar = (prev.depolarVeSubeler || []).map(item => {
        const isMatch = (item.id != null && String(item.id) === String(identifier)) || 
                        (item.kod && String(item.kod).toLowerCase() === String(identifier).toLowerCase()) ||
                        (identifier === 'MERKEZ-SUBE' && item.tur === 3) ||
                        (identifier === 'MERKEZ-DEPO' && item.tur !== 3);
        if (isMatch) {
          return {
            ...item,
            adres: updatedAddressData.adres !== undefined ? updatedAddressData.adres : item.adres,
            acikAdres: updatedAddressData.acikAdres !== undefined ? updatedAddressData.acikAdres : (updatedAddressData.adres !== undefined ? updatedAddressData.adres : item.acikAdres),
            adresIlId: updatedAddressData.adresIlId !== undefined ? updatedAddressData.adresIlId : item.adresIlId,
            adresIlceId: updatedAddressData.adresIlceId !== undefined ? updatedAddressData.adresIlceId : item.adresIlceId,
            adresBucakId: updatedAddressData.adresBucakId !== undefined ? updatedAddressData.adresBucakId : item.adresBucakId,
            adresKoyId: updatedAddressData.adresKoyId !== undefined ? updatedAddressData.adresKoyId : item.adresKoyId,
            adresMahalleId: updatedAddressData.adresMahalleId !== undefined ? updatedAddressData.adresMahalleId : item.adresMahalleId,
            adresCaddeSokakId: updatedAddressData.adresCaddeSokakId !== undefined ? updatedAddressData.adresCaddeSokakId : item.adresCaddeSokakId,
            adresDisKapiId: updatedAddressData.adresDisKapiId !== undefined ? updatedAddressData.adresDisKapiId : item.adresDisKapiId,
            adresIcKapiId: updatedAddressData.adresIcKapiId !== undefined ? updatedAddressData.adresIcKapiId : item.adresIcKapiId,
            ilAdi: updatedAddressData.ilAdi !== undefined ? updatedAddressData.ilAdi : item.ilAdi,
            ilceAdi: updatedAddressData.ilceAdi !== undefined ? updatedAddressData.ilceAdi : item.ilceAdi
          };
        }
        return item;
      });

      const changedItem = updatedDepolar.find(item => 
        (item.id != null && String(item.id) === String(identifier)) || 
        (item.kod && String(item.kod).toLowerCase() === String(identifier).toLowerCase()) ||
        (identifier === 'MERKEZ-SUBE' && item.tur === 3) ||
        (identifier === 'MERKEZ-DEPO' && item.tur !== 3)
      );
      const isPrimarySube = changedItem && changedItem.tur === 3;

      const nextData = {
        ...prev,
        depolarVeSubeler: updatedDepolar,
        ...(isPrimarySube ? {
          adres: updatedAddressData.adres !== undefined ? updatedAddressData.adres : prev.adres,
          adresIlId: updatedAddressData.adresIlId !== undefined ? updatedAddressData.adresIlId : prev.adresIlId,
          adresIlceId: updatedAddressData.adresIlceId !== undefined ? updatedAddressData.adresIlceId : prev.adresIlceId,
          adresBucakId: updatedAddressData.adresBucakId !== undefined ? updatedAddressData.adresBucakId : prev.adresBucakId,
          adresKoyId: updatedAddressData.adresKoyId !== undefined ? updatedAddressData.adresKoyId : prev.adresKoyId,
          adresMahalleId: updatedAddressData.adresMahalleId !== undefined ? updatedAddressData.adresMahalleId : prev.adresMahalleId,
          adresCaddeSokakId: updatedAddressData.adresCaddeSokakId !== undefined ? updatedAddressData.adresCaddeSokakId : prev.adresCaddeSokakId,
          adresDisKapiId: updatedAddressData.adresDisKapiId !== undefined ? updatedAddressData.adresDisKapiId : prev.adresDisKapiId,
          adresIcKapiId: updatedAddressData.adresIcKapiId !== undefined ? updatedAddressData.adresIcKapiId : prev.adresIcKapiId,
          ilAdi: updatedAddressData.ilAdi !== undefined ? updatedAddressData.ilAdi : prev.ilAdi,
          ilceAdi: updatedAddressData.ilceAdi !== undefined ? updatedAddressData.ilceAdi : prev.ilceAdi
        } : {})
      };

      try {
        sessionStorage.setItem('webakus_firma_form_draft', JSON.stringify(nextData));
      } catch (e) {}

      return nextData;
    });
    clearError('depolarVeSubeler');
    clearError(`depo_adres_${identifier}`);
  };

  const handleAdresSeciciSave = (identifier, result) => {
    setFormData(prev => ({
      ...prev,
      depolarVeSubeler: (prev.depolarVeSubeler || []).map(item => {
        if ((item.id !== undefined && item.id === identifier) || (item.kod && item.kod === identifier)) {
          return {
            ...item,
            adres: result.adres || item.adres,
            adresIlId: result.adresIlId ?? item.adresIlId,
            adresIlceId: result.adresIlceId ?? item.adresIlceId,
            adresBucakId: result.adresBucakId ?? item.adresBucakId,
            adresKoyId: result.adresKoyId ?? item.adresKoyId,
            adresMahalleId: result.adresMahalleId ?? item.adresMahalleId,
            adresCaddeSokakId: result.adresCaddeSokakId ?? item.adresCaddeSokakId,
            adresDisKapiId: result.adresDisKapiId ?? item.adresDisKapiId,
            adresIcKapiId: result.adresIcKapiId ?? item.adresIcKapiId
          };
        }
        return item;
      })
    }));
    clearError('depolarVeSubeler');
    clearError(`depo_adres_${identifier}`);
  };

  const handleCopyBranchAddress = (targetIdentifier, branchItem) => {
    if (!branchItem || !isDepoSubeAddressComplete(branchItem)) {
      toast.error(t('once_sube_adresini_giriniz', 'Lütfen önce Merkez Şube adresini giriniz.'));
      return;
    }
    setFormData(prev => ({
      ...prev,
      depolarVeSubeler: (prev.depolarVeSubeler || []).map(item => {
        if ((item.id !== undefined && item.id === targetIdentifier) || (item.kod && item.kod === targetIdentifier)) {
          return {
            ...item,
            adres: branchItem.adres,
            acikAdres: branchItem.acikAdres || branchItem.adres,
            adresIlId: branchItem.adresIlId ?? branchItem.ilId,
            ilId: branchItem.adresIlId ?? branchItem.ilId,
            adresIlceId: branchItem.adresIlceId ?? branchItem.ilceId,
            ilceId: branchItem.adresIlceId ?? branchItem.ilceId,
            adresBucakId: branchItem.adresBucakId,
            adresKoyId: branchItem.adresKoyId,
            adresMahalleId: branchItem.adresMahalleId,
            adresCaddeSokakId: branchItem.adresCaddeSokakId,
            adresDisKapiId: branchItem.adresDisKapiId,
            adresIcKapiId: branchItem.adresIcKapiId,
            ilAdi: branchItem.ilAdi || '',
            ilceAdi: branchItem.ilceAdi || ''
          };
        }
        return item;
      })
    }));
    clearError('depolarVeSubeler');
    clearError(`depo_adres_${targetIdentifier}`);
    toast.success(t('sube_adresi_kopyalandi', 'Merkez Şube adresi kopyalandı.'));
  };

  const handleDeleteDepoMemory = (itemToDelete, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    showAlert(
      'confirm',
      t('sil', 'Sil'),
      t('depo_sil_onay_mesaj', 'Bu depo/şube kaydını silmek istediğinize emin misiniz?'),
      () => {
        setFormData(prev => ({
          ...prev,
          depolarVeSubeler: (prev.depolarVeSubeler || []).filter(item => 
            item.id !== itemToDelete.id && (!item.kod || item.kod !== itemToDelete.kod)
          )
        }));
      }
    );
  };

  const isModuleSelected = useCallback((modul: any) => {
    if (!modul) return false;
    const isCore = Boolean(modul.isCore) || 
      SYSTEM_CORE_MODULE_CODES.includes(modul.kod) || 
      SYSTEM_CORE_MODULE_CODES.includes(modul.id);
    if (isCore) return true;

    return firmaModulleri.some((mId: any) => 
      String(mId) === String(modul.id) ||
      (modul.dbId != null && String(mId) === String(modul.dbId)) ||
      (modul.kod != null && String(mId) === String(modul.kod))
    );
  }, [firmaModulleri]);

  const handleToggleModul = useCallback((modul: any, checked?: boolean) => {
    const isCore = Boolean(modul.isCore) || 
      SYSTEM_CORE_MODULE_CODES.includes(modul.kod) || 
      SYSTEM_CORE_MODULE_CODES.includes(modul.id);
    if (isCore) return;

    hasManuallyEditedModullerRef.current = true;
    const currentlySelected = isModuleSelected(modul);
    const shouldSelect = checked !== undefined ? checked : !currentlySelected;

    let nextIds: any[] = [];
    if (shouldSelect) {
      const toAdd = [modul.id, modul.dbId].filter(Boolean);
      nextIds = Array.from(new Set([...firmaModulleri, ...toAdd]));
    } else {
      nextIds = firmaModulleri.filter((mId: any) => 
        String(mId) !== String(modul.id) &&
        (modul.dbId == null || String(mId) !== String(modul.dbId)) &&
        (modul.kod == null || String(mId) !== String(modul.kod))
      );
    }

    setFirmaModulleri(nextIds);
    setFormData(prev => ({ ...prev, modulIds: nextIds }));
  }, [firmaModulleri, isModuleSelected]);

  const handleSelectAllModuller = () => {
    hasManuallyEditedModullerRef.current = true;
    const allIds = Array.from(new Set(
      tumModuller.flatMap((m: any) => [m.id, m.dbId].filter(Boolean))
    ));
    setFirmaModulleri(allIds);
    setFormData(prev => ({ ...prev, modulIds: allIds }));
    toast.success(t('tum_moduller_secildi', 'Tüm sistem modülleri seçildi.'));
  };

  const handleClearAllModuller = () => {
    hasManuallyEditedModullerRef.current = true;
    const coreIds = Array.from(new Set(
      tumModuller
        .filter((m: any) => Boolean(m.isCore) || SYSTEM_CORE_MODULE_CODES.includes(m.kod) || SYSTEM_CORE_MODULE_CODES.includes(m.id))
        .flatMap((m: any) => [m.id, m.dbId].filter(Boolean))
    ));
    setFirmaModulleri(coreIds);
    setFormData(prev => ({ ...prev, modulIds: coreIds }));
    toast.success(t('is_modulleri_temizlendi', 'İş modülleri temizlendi (Çekirdek sistem modülleri korundu).'));
  };

  const handleApplySectorModuller = () => {
    hasManuallyEditedModullerRef.current = false;
    const resolved = resolveSectorModules(formData.faaliyetAlanlari, tumSektorler, tumModuller);
    if (resolved && resolved.length > 0) {
      setFirmaModulleri(resolved);
      setFormData(prev => ({ ...prev, modulIds: resolved }));
      toast.success(t('faaliyet_alani_modulleri_uygulandi', 'Faaliyet alanına ait modül seçimleri başarıyla uygulandı.'));
    } else {
      toast.error(t('faaliyet_alani_modulleri_bulunamadi', 'Seçili faaliyet alanına ait modül yapılandırması bulunamadı.'));
    }
  };

  const renderSektorIcon = (iconName, size = 18) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag size={size} />;
      case 'Utensils': return <Utensils size={size} />;
      case 'Factory': return <Factory size={size} />;
      case 'Briefcase': return <Briefcase size={size} />;
      case 'Building2': return <Building size={size} />;
      case 'Globe': return <Globe size={size} />;
      case 'Truck': return <Truck size={size} />;
      case 'HeartPulse': return <HeartPulse size={size} />;
      case 'Car': return <Car size={size} />;
      case 'Navigation': return <Navigation size={size} />;
      case 'Sprout': return <Sprout size={size} />;
      case 'Compass': return <Compass size={size} />;
      case 'Scissors': return <Scissors size={size} />;
      case 'Zap': return <Zap size={size} />;
      case 'GraduationCap': return <GraduationCap size={size} />;
      case 'Layers': return <Layers size={size} />;
      default: return <Layers size={size} />;
    }
  };

  const filtrelenmisSektorler = useMemo(() => {
    const parents = tumSektorler.filter(s => !s.ustFaaliyetAlaniId && s.aktifMi);
    return parents.map(parent => ({
      parent,
      children: tumSektorler.filter(c => c.ustFaaliyetAlaniId === parent.id && c.aktifMi)
    }));
  }, [tumSektorler]);

  const seciliSektorSayisi = formData.faaliyetAlanlari?.length || 0;

  const seciliSektorAdlari = useMemo(() => {
    const ids = formData.faaliyetAlanlari || [];
    return tumSektorler.filter((s) => ids.includes(s.id)).map((s) => s.ad);
  }, [formData.faaliyetAlanlari, tumSektorler]);

  const syncDefaultSectorConfigIfNeeded = (newFaaliyetIds) => {
    if (!editingFirma && newFaaliyetIds.length > 0) {
      // Alt sektörleri önceliklendir (hiyerarşik sıra)
      const sortedIds = [...newFaaliyetIds].sort((a, b) => {
        const secA = tumSektorler.find(s => s.id === a);
        const secB = tumSektorler.find(s => s.id === b);
        const isChildA = secA?.ustFaaliyetAlaniId != null ? 1 : 0;
        const isChildB = secB?.ustFaaliyetAlaniId != null ? 1 : 0;
        return isChildB - isChildA;
      });

      let cariObj = null;
      let seedObj = null;

      for (const sId of sortedIds) {
        const targetSec = tumSektorler.find(s => s.id === sId);
        if (!targetSec) continue;

        const rawCari = targetSec.cariTuruYapilandirmaJson ?? targetSec.CariTuruYapilandirmaJson;
        const rawSeed = targetSec.sektorelSeedDataJson ?? targetSec.SektorelSeedDataJson;

        if (!cariObj && rawCari) {
          try {
            const parsed = typeof rawCari === 'string' ? JSON.parse(rawCari) : rawCari;
            cariObj = {
              cariTuruYapilandirma: { ...DEFAULT_CARI_TURU_CONFIG, ...parsed },
              cariTuruYapilandirmaJson: typeof rawCari === 'string' ? rawCari : JSON.stringify(rawCari)
            };
          } catch (e) {
            console.error('Sector config parse error:', e);
          }
        }

        if (!seedObj && rawSeed) {
          try {
            const parsed = typeof rawSeed === 'string' ? JSON.parse(rawSeed) : rawSeed;
            seedObj = {
              sektorelSeedData: { ...DEFAULT_SEKTOREL_SEED_DATA, ...parsed },
              sektorelAyarlarJson: typeof rawSeed === 'string' ? rawSeed : JSON.stringify(rawSeed)
            };
          } catch (e) {
            console.error('Sector seed parse error:', e);
          }
        }

        if (cariObj && seedObj) break;
      }

      if (cariObj || seedObj) {
        return {
          ...(cariObj || {}),
          ...(seedObj || {})
        };
      }
    }
    return null;
  };

  const handleToggleParentFaaliyet = (parentId, children = [], checked) => {
    if (checked) {
      clearError('faaliyetAlanlari');
    }
    const current = formData.faaliyetAlanlari || [];
    const childIds = (children || []).map((c) => c.id);
    const newIds = checked
      ? Array.from(new Set([...current, parentId, ...childIds]))
      : current.filter((id) => id !== parentId && !childIds.includes(id));

    let resolvedModuller = firmaModulleri;
    if (!editingFirma) {
      hasManuallyEditedModullerRef.current = false;
      resolvedModuller = newIds.length > 0
        ? resolveSectorModules(newIds, tumSektorler, tumModuller)
        : [];
      setFirmaModulleri(resolvedModuller);
    }

    const extraConfig = syncDefaultSectorConfigIfNeeded(newIds);
    setFormData((prev) => ({
      ...prev,
      faaliyetAlanlari: newIds,
      modulIds: resolvedModuller,
      ...(extraConfig || {})
    }));
  };

  const handleToggleChildFaaliyet = (childId, parentId, checked) => {
    if (checked) {
      clearError('faaliyetAlanlari');
    }
    const current = formData.faaliyetAlanlari || [];
    const newIds = checked
      ? Array.from(new Set([...current, childId, parentId]))
      : current.filter((id) => id !== childId);

    let resolvedModuller = firmaModulleri;
    if (!editingFirma) {
      hasManuallyEditedModullerRef.current = false;
      resolvedModuller = newIds.length > 0
        ? resolveSectorModules(newIds, tumSektorler, tumModuller)
        : [];
      setFirmaModulleri(resolvedModuller);
    }

    const extraConfig = syncDefaultSectorConfigIfNeeded(newIds);
    setFormData((prev) => ({
      ...prev,
      faaliyetAlanlari: newIds,
      modulIds: resolvedModuller,
      ...(extraConfig || {})
    }));
  };

  const handleTumSektorleriTemizle = () => {
    hasManuallyEditedModullerRef.current = false;
    const coreIds = Array.from(new Set(
      tumModuller
        .filter((m: any) => Boolean(m.isCore) || SYSTEM_CORE_MODULE_CODES.includes(m.kod) || SYSTEM_CORE_MODULE_CODES.includes(m.id))
        .flatMap((m: any) => [m.id, m.dbId].filter(Boolean))
    ));
    setFormData(prev => ({ ...prev, faaliyetAlanlari: [], modulIds: coreIds }));
    if (!editingFirma) {
      setFirmaModulleri(coreIds);
    }
  };

  const handleToggleSektorAcik = (parentId) => {
    setAcikSektorler(prev => 
      prev.includes(parentId) 
        ? prev.filter(id => id !== parentId) 
        : [...prev, parentId]
    );
  };

  // Edit görünümünde sadece seçili faaliyet alanı / alanları açık olsun.
  // İlk aşamada (yeni firma sihirbazında) ise tümü kapalıdır.
  useEffect(() => {
    if (isEditMode && tumSektorler.length > 0 && !detailLoading && !editSektorlerBaslangictaAcildi) {
      if (formData.faaliyetAlanlari?.length > 0) {
        const selectedIds = new Set(formData.faaliyetAlanlari);
        const seciliParentIds = tumSektorler
          .filter(s => !s.ustFaaliyetAlaniId && s.aktifMi)
          .filter(parent => {
            const isParentSelected = selectedIds.has(parent.id);
            const hasSelectedChild = tumSektorler.some(c => c.ustFaaliyetAlaniId === parent.id && selectedIds.has(c.id));
            return isParentSelected || hasSelectedChild;
          })
          .map(p => p.id);

        setAcikSektorler(seciliParentIds);
      } else {
        setAcikSektorler([]);
      }
      setEditSektorlerBaslangictaAcildi(true);
    }
  }, [isEditMode, tumSektorler, detailLoading, formData.faaliyetAlanlari, editSektorlerBaslangictaAcildi]);

  // ==========================================================================
  // ORTAK BÖLÜM RENDER FONKSİYONLARI (SHARED SECTION RENDERERS)
  // Hem BaseWizardPage hem de BaseCardPage / TabLayout bu fonksiyonları kullanır.
  // Yeni bir alan eklendiğinde sadece aşağıdaki ilgili fonksiyona eklenmelidir!
  // ==========================================================================

  /** 1. BÖLÜM: Genel ve Vergi Bilgileri */
  const renderGenelBilgiler = () => (
    <div className="firma-tab-content flex-col gap-20">
      {/* Bilgilendirici Adım / Sekme Banner'ı (Yalnızca Sihirbaz Modunda) */}
      {!isEditMode && (
        <div className="wizard-step-banner">
          <div className="wizard-step-banner-icon">
            <Building size={22} />
          </div>
          <div className="wizard-step-banner-body">
            <div className="wizard-step-banner-badge">{t('adim_1_etiket', '1. Adım / Temel Bilgiler')}</div>
            <div className="wizard-step-banner-title">{t('firma_ve_vergi_bilgileri', 'Firma ve Vergi Tanımları')}</div>
            <div className="wizard-step-banner-desc">
              {t('firma_ve_vergi_aciklama', 'İşletmenizin yasal ticari ünvanını, bağlı olduğu vergi dairesini ve vergi kimlik (VKN/TCKN) numarasını tanımlayınız.')}
            </div>
          </div>
        </div>
      )}

      <div className="form-grid">
        <div className="form-field full-width">
          <label className="form-label">
            {t('firma_unvani', 'Firma Ünvanı')} <span className="required-mark">*</span>
          </label>
          <BasitInput
            id="firmaAdiInput"
            name="firmaAdi"
            textTransform="basHarflerBuyuk"
            className={errors.firmaAdi ? 'is-invalid' : ''}
            placeholder={t('firma_unvani_placeholder', 'Örn: Webakus Bilişim ve Yazılım A.Ş.')}
            value={formData.firmaAdi}
            onChange={(e) => {
              setFormData({ ...formData, firmaAdi: e.target.value });
              clearError('firmaAdi');
            }}
            autoFocus
            required
          />
          <FieldError error={errors.firmaAdi} />
        </div>

        <div className="form-field full-width">
          <label className="form-label">
            {t('vergi_dairesi', 'Vergi Dairesi')} <span className="required-mark">*</span>
          </label>
          <BasitInput
            textTransform="basHarflerBuyuk"
            className={errors.vergiDairesi ? 'is-invalid' : ''}
            placeholder={t('vergi_dairesi_placeholder', 'Örn: Kadıköy V.D.')}
            value={formData.vergiDairesi}
            onChange={(e) => {
              setFormData({ ...formData, vergiDairesi: e.target.value });
              clearError('vergiDairesi');
            }}
            required
          />
          <FieldError error={errors.vergiDairesi} />
        </div>

        <div className="form-field full-width">
          <label className="form-label">
            {t('vergi_numarasi', 'Vergi No / TCKN')} <span className="required-mark">*</span>
          </label>
          <VergiKimlikInput
            className={errors.vergiNo ? 'is-invalid' : ''}
            value={formData.vergiNo}
            onChange={(e) => {
              setFormData({ ...formData, vergiNo: e.target.value });
              clearError('vergiNo');
            }}
            onBlur={() => handleVergiNoCheck()}
            required
          />
          <FieldError error={errors.vergiNo} />
          {vergiNoChecking && (
            <div className="user-email-checking-text">
              {t('vergi_no_kontrol_ediliyor', 'Vergi numarası kontrol ediliyor...')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /** 2. BÖLÜM: Faaliyet Alanları ve Sektör Seçimi */
  const renderFaaliyetAlani = () => (
    <div className="firma-tab-content flex-col gap-16">
      {/* Bilgilendirici Adım / Sekme Banner'ı (Yalnızca Sihirbaz Modunda) */}
      {!isEditMode && (
        <div className="wizard-step-banner">
          <div className="wizard-step-banner-icon">
            <Layers size={22} />
          </div>
          <div className="wizard-step-banner-body">
            <div className="wizard-step-banner-badge">{t('adim_2_etiket', '2. Adım / Sektörel Yapılandırma')}</div>
            <div className="wizard-step-banner-title">{t('sektor_ve_faaliyet_secimi', 'Faaliyet Alanı ve İş Kolları')}</div>
            <div className="wizard-step-banner-desc">
              {t('sektor_ve_faaliyet_aciklama', 'İşletmenizin faaliyet gösterdiği ana sektörü ve alt kollarını seçiniz. Sistem arayüzü ve akıllı şablonlar bu seçime göre otomatik uyarlanacaktır.')}
            </div>
          </div>
        </div>
      )}

      {errors.faaliyetAlanlari && (
        <FieldError error={errors.faaliyetAlanlari} />
      )}

      <div className="sector-selection-container">
        {/* Seçili Faaliyet Sayısı ve Temizle Butonu */}
        {seciliSektorSayisi > 0 && (
          <div className="sector-filter-header">
            <div className="flex-row items-center gap-8">
              <span className="sector-stats-badge">
                <Check size={14} />
                {t('secili_faaliyet_sayisi', '{{sayi}} Alan Seçildi', { sayi: seciliSektorSayisi })}
              </span>
              <button
                type="button"
                className="btn-small-action"
                onClick={handleTumSektorleriTemizle}
              >
                {t('secimleri_temizle', 'Temizle')}
              </button>
            </div>
          </div>
        )}

        {/* Sektör Grupları Listesi */}
        <div className="sector-groups-scroll">
          {filtrelenmisSektorler.length === 0 ? (
            <div className="sector-empty-state">
              <Layers size={32} />
              <span>{t('henuz_tanimli_faaliyet_alani_yok', 'Henüz tanımlı bir faaliyet alanı bulunmuyor.')}</span>
            </div>
          ) : (
            filtrelenmisSektorler.map(({ parent, children }) => {
              const isParentSelected = formData.faaliyetAlanlari.includes(parent.id);
              const selectedChildCount = children.filter(c => formData.faaliyetAlanlari.includes(c.id)).length;
              const hasSelected = isParentSelected || selectedChildCount > 0;
              const isOpen = acikSektorler.includes(parent.id);

              return (
                <div key={parent.id} className={`sector-group-card ${hasSelected ? 'has-selected' : ''}`}>
                  <div 
                    className="sector-group-header"
                    onClick={() => children.length > 0 && handleToggleSektorAcik(parent.id)}
                  >
                    <div className="sector-group-left">
                      <label 
                        className="sector-checkbox-label"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isParentSelected}
                          onChange={(e) => {
                            handleToggleParentFaaliyet(parent.id, children, e.target.checked);
                            if (e.target.checked && children.length > 0) {
                              setAcikSektorler(prev => Array.from(new Set([...prev, parent.id])));
                            }
                          }}
                        />
                      </label>
                      <div className="sector-icon-badge">
                        {renderSektorIcon(parent.ikon, 18)}
                      </div>
                      <div className="sector-group-title">
                        <span>{parent.ad}</span>
                        {parent.kod && <span className="sector-code-pill">{parent.kod}</span>}
                      </div>
                    </div>

                    <div className="flex-row items-center gap-8">
                      {selectedChildCount > 0 && (
                        <span className="sector-count-pill">
                          {selectedChildCount} / {children.length} {t('secildi_kisa', 'seçili')}
                        </span>
                      )}
                      {children.length > 0 && (
                        <button
                          type="button"
                          className="sector-toggle-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSektorAcik(parent.id);
                          }}
                          title={t('genislet_daralt', 'Genişlet / Daralt')}
                        >
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {children.length > 0 && isOpen && (
                    <div className="sector-sub-grid">
                      {children.map((child) => {
                        const isChildSelected = formData.faaliyetAlanlari.includes(child.id);
                        return (
                          <label 
                            key={child.id} 
                            className={`sector-sub-chip ${isChildSelected ? 'is-selected' : ''}`}
                            title={child.aciklama || child.ad}
                          >
                            <input
                              type="checkbox"
                              checked={isChildSelected}
                              onChange={(e) => handleToggleChildFaaliyet(child.id, parent.id, e.target.checked)}
                            />
                            <div className="sector-sub-chip-body">
                              <div className="sector-sub-chip-title">
                                <span>{child.ad}</span>
                                {child.kod && <span className="sector-code-pill">{child.kod}</span>}
                              </div>
                              {child.aciklama && (
                                <div className="sector-sub-chip-desc">
                                  {child.aciklama}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  /** 3. BÖLÜM: Sektörel Ayarlar ve İş Akışı */
  const renderSektorelAyarlar = () => (
    <div className="firma-tab-content flex-col gap-20">
      {/* Bilgilendirici Adım / Sekme Banner'ı (Yalnızca Sihirbaz Modunda) */}
      {!isEditMode && (
        <div className="wizard-step-banner">
          <div className="wizard-step-banner-icon">
            <Settings2 size={22} />
          </div>
          <div className="wizard-step-banner-body">
            <div className="wizard-step-banner-badge">{t('sektorel_ayarlar', 'Sektörel Ayarlar')}</div>
            <div className="wizard-step-banner-title">{t('firma_sektorel_ayarlar_baslik', 'Firma Sektörel İş Akışı ve Davranış Ayarları')}</div>
            <div className="wizard-step-banner-desc">
              {t('firma_sektorel_ayarlar_aciklama', 'Seçili faaliyet alanına göre yapılandırılan veya firmaya özel özelleştirilen modül sıralamaları ve davranış kuralları.')}
            </div>
          </div>
        </div>
      )}

      <div className="flex-col gap-16 flex-1">
        {/* AYAR KARTI 1: PARA BİRİMLERİ YAPILANDIRMASI */}
        <div className="faaliyet-setting-section">
          <div className="faaliyet-setting-section-header">
            <div className="faaliyet-setting-section-header-left">
              <div className="faaliyet-setting-section-icon faaliyet-setting-icon-blue">
                <Coins size={20} />
              </div>
              <div>
                <h5 className="faaliyet-setting-section-title">
                  {t('sektorel_para_birimleri_baslik', 'Para Birimleri Yapılandırması')}
                </h5>
                <p className="faaliyet-setting-section-desc">
                  {t('sektorel_para_birimleri_aciklama', 'Bu sektörü seçen firmanın veri tabanı ilk kurulumunda (seed) tanımlanacak varsayılan para birimlerini yapılandırın.')}
                </p>
              </div>
            </div>

            <div className="faaliyet-setting-action-wrapper">
              <span className="faaliyet-setting-badge faaliyet-setting-badge-blue">
                {currentSeedParaBirimleri.length} {t('para_birimi_tanimli', 'Para Birimi Tanımlı')}
              </span>
              <button
                type="button"
                className="btn btn-secondary faaliyet-setting-btn flex-row items-center gap-8"
                onClick={handleOpenCurrencySubPage}
              >
                <Coins size={16} />
                {t('ayarlar', 'Ayarlar')}
              </button>
            </div>
          </div>
        </div>

        {/* AYAR KARTI 2: VERGİ VE KDV AYARLARI */}
        <div className="faaliyet-setting-section">
          <div className="faaliyet-setting-section-header">
            <div className="faaliyet-setting-section-header-left">
              <div className="faaliyet-setting-section-icon faaliyet-setting-icon-green">
                <Percent size={20} />
              </div>
              <div>
                <h5 className="faaliyet-setting-section-title">
                  {t('sektorel_vergi_kdv_baslik', 'Vergi ve KDV Ayarları')}
                </h5>
                <p className="faaliyet-setting-section-desc">
                  {t('sektorel_vergi_kdv_aciklama', 'Bu sektörü seçen firmanın veri tabanı ilk kurulumunda (seed) tanımlanacak varsayılan vergi ve KDV oranlarını yapılandırın.')}
                </p>
              </div>
            </div>

            <div className="faaliyet-setting-action-wrapper">
              <span className="faaliyet-setting-badge faaliyet-setting-badge-green">
                {currentSeedKdvGruplari.length} {t('kdv_grubu_tanimli', 'KDV Grubu Tanımlı')}
              </span>
              <button
                type="button"
                className="btn btn-secondary faaliyet-setting-btn flex-row items-center gap-8"
                onClick={handleOpenKdvSubPage}
              >
                <Percent size={16} />
                {t('ayarlar', 'Ayarlar')}
              </button>
            </div>
          </div>
        </div>

        {/* AYAR KARTI 3: ÖLÇÜ BİRİMLERİ AYARLARI */}
        <div className="faaliyet-setting-section">
          <div className="faaliyet-setting-section-header">
            <div className="faaliyet-setting-section-header-left">
              <div className="faaliyet-setting-section-icon faaliyet-setting-icon-purple">
                <Scale size={20} />
              </div>
              <div>
                <h5 className="faaliyet-setting-section-title">
                  {t('sektorel_birimler_baslik', 'Ölçü Birimleri Yapılandırması')}
                </h5>
                <p className="faaliyet-setting-section-desc">
                  {t('sektorel_birimler_aciklama', 'Bu sektörü seçen firmanın veri tabanı ilk kurulumunda (seed) tanımlanacak varsayılan ölçü birimlerini (Adet, Kg, Litre vb.) yapılandırın.')}
                </p>
              </div>
            </div>

            <div className="faaliyet-setting-action-wrapper">
              <span className="faaliyet-setting-badge faaliyet-setting-badge-purple">
                {currentSeedBirimler.length} {t('birim_tanimli', 'Birim Tanımlı')}
              </span>
              <button
                type="button"
                className="btn btn-secondary faaliyet-setting-btn flex-row items-center gap-8"
                onClick={handleOpenBirimSubPage}
              >
                <Scale size={16} />
                {t('ayarlar', 'Ayarlar')}
              </button>
            </div>
          </div>
        </div>

        {/* AYAR KARTI 4: METİN HARF DÖNÜŞÜMÜ */}
        <div className="faaliyet-setting-section">
          <div className="faaliyet-setting-section-header">
            <div className="faaliyet-setting-section-header-left">
              <div className="faaliyet-setting-section-icon faaliyet-setting-icon-indigo">
                <Type size={20} />
              </div>
              <div>
                <h5 className="faaliyet-setting-section-title">
                  {t('sektorel_metin_harf_donusumu_baslik', 'Metin Harf Dönüşüm Tercihi')}
                </h5>
                <p className="faaliyet-setting-section-desc">
                  {t('sektorel_metin_harf_donusumu_aciklama', 'Bu sektörü seçen firmalarda form girişlerinde metinlerin otomatik nasıl dönüştürüleceğini (Tümü Büyük, İlk Harfleri Büyük vb.) belirleyin.')}
                </p>
              </div>
            </div>

            <div className="faaliyet-setting-action-wrapper">
              <span className="faaliyet-setting-badge faaliyet-setting-badge-indigo">
                {currentMetinHarfDonusumu === 'hepsiBuyuk'
                  ? t('harf_donusumu_buyuk_baslik', 'Tümü Büyük Harf')
                  : currentMetinHarfDonusumu === 'basHarflerBuyuk'
                    ? t('harf_donusumu_basharfler_baslik', 'İlk Harfleri Büyük')
                    : currentMetinHarfDonusumu === 'hepsiKucuk'
                      ? t('harf_donusumu_kucuk_baslik', 'Tümü Küçük Harf')
                      : t('harf_donusumu_serbest_baslik', 'Serbest (Dönüşüm Yok)')}
              </span>
              <div className="faaliyet-setting-select-container">
                <select
                  className="form-select faaliyet-setting-select"
                  value={currentMetinHarfDonusumu}
                  onChange={(e) => handleMetinHarfDonusumuChange(e.target.value)}
                >
                  <option value="none">{t('harf_donusumu_serbest_baslik', 'Serbest (Dönüşüm Yok)')}</option>
                  <option value="hepsiBuyuk">{t('harf_donusumu_buyuk_baslik', 'Tümü Büyük Harf')}</option>
                  <option value="basHarflerBuyuk">{t('harf_donusumu_basharfler_baslik', 'İlk Harfleri Büyük')}</option>
                  <option value="hepsiKucuk">{t('harf_donusumu_kucuk_baslik', 'Tümü Küçük Harf')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* AYAR KARTI 5: VARSAYILAN SİSTEM DİLİ */}
        <div className="faaliyet-setting-section">
          <div className="faaliyet-setting-section-header">
            <div className="faaliyet-setting-section-header-left">
              <div className="faaliyet-setting-section-icon faaliyet-setting-icon-blue">
                <Globe size={20} />
              </div>
              <div>
                <h5 className="faaliyet-setting-section-title">
                  {t('sektorel_varsayilan_dil_baslik', 'Varsayılan Sistem Dili')}
                </h5>
                <p className="faaliyet-setting-section-desc">
                  {t('sektorel_varsayilan_dil_aciklama', 'Bu sektörü seçen firmalarda ERP kullanıcı arayüzünde varsayılan olarak kullanılacak dili belirleyin.')}
                </p>
              </div>
            </div>

            <div className="faaliyet-setting-action-wrapper">
              <span className="faaliyet-setting-badge faaliyet-setting-badge-blue">
                {currentVarsayilanDil === 'en'
                  ? t('dil_ingilizce', 'English (EN)')
                  : t('dil_turkce', 'Türkçe (TR)')}
              </span>
              <div className="faaliyet-setting-select-container">
                <select
                  className="form-select faaliyet-setting-select"
                  value={currentVarsayilanDil}
                  onChange={(e) => handleVarsayilanDilChange(e.target.value)}
                >
                  <option value="tr">{t('dil_turkce', 'Türkçe (TR)')}</option>
                  <option value="en">{t('dil_ingilizce', 'English (EN)')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* AYAR BLOĞU 6: STOK & ÜRÜN YÖNETİMİ */}
        <div className="faaliyet-setting-section disabled-section">
          <div className="faaliyet-setting-section-header">
            <div className="faaliyet-setting-section-header-left">
              <div className="faaliyet-setting-section-icon faaliyet-setting-icon-amber">
                <Package size={20} />
              </div>
              <div>
                <h5 className="faaliyet-setting-section-title">
                  {t('stok_urun_davranislari_baslik', 'Stok & Ürün Yönetimi ve Barkod Davranışları')}
                </h5>
                <p className="faaliyet-setting-section-desc">
                  {t('stok_urun_davranislari_aciklama', 'Hızlı satış modülü öncelikleri, varsayılan birimler ve barkod okuma akışları.')}
                </p>
              </div>
            </div>
            <div className="faaliyet-setting-action-wrapper">
              <span className="faaliyet-setting-badge badge-future">{t('moduler_alan_genisletilebilir', 'Modüler Alan (Genişletilebilir)')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /** 4. BÖLÜM: Depo ve Şube Tanımları (Dinamik Form Görünümü) */
  const renderDepolarVeSubeler = () => {
    const list = formData.depolarVeSubeler || [];
    // Merkez Şube ilk sırada (tur === 3), ardından Merkez Depo ve diğerleri
    const sortedList = [...list].sort((a, b) => {
      const aIsBranch = a.tur === 3 ? 1 : 0;
      const bIsBranch = b.tur === 3 ? 1 : 0;
      return bIsBranch - aIsBranch;
    });
    const branchItem = sortedList.find(i => i.tur === 3);
    const hasIncompleteAddress = sortedList.some(item => !isDepoSubeAddressComplete(item));

    return (
      <div className="firma-tab-content flex-col gap-20">
        {/* Bilgilendirici Adım / Sekme Banner'ı (Yalnızca Sihirbaz Modunda) */}
        {!isEditMode && (
          <div className="wizard-step-banner">
            <div className="wizard-step-banner-icon">
              <Warehouse size={22} />
            </div>
            <div className="wizard-step-banner-body">
              <div className="wizard-step-banner-badge">{t('adim_4_etiket_depolar', '4. Adım / Lokasyon ve Birimler')}</div>
              <div className="wizard-step-banner-title">{t('depolar_ve_subeler_baslik', 'Depo ve Şube Tanımları')}</div>
              <div className="wizard-step-banner-desc">
                {t('depo_ve_sube_aciklama', 'İşletmenizin faaliyet göstereceği depo, şube ve mağaza lokasyonlarını belirleyiniz. Seed Yönetimi şablonuna göre oluşturulan kayıtların adres bilgilerini eksiksiz tamamlamanız gerekmektedir.')}
              </div>
            </div>
          </div>
        )}

        {/* Adres Eksik Genel Uyarı Banner'ı */}
        {hasIncompleteAddress && (
          <div className="depo-warning-banner">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span>{t('adres_eksik_uyari_banner', 'Dikkat: Aşağıdaki depo veya şubelerin adres bilgileri henüz tanımlanmamıştır. İlerlemeden önce lütfen kartlara tıklayarak adres bilgilerini eksiksiz doldurunuz.')}</span>
          </div>
        )}

        {/* Alan Hata Mesajı Banner'ı */}
        {errors.depolarVeSubeler && (
          <div className="depo-warning-banner error">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span>{errors.depolarVeSubeler}</span>
          </div>
        )}

        {/* Dinamik Form: Merkez Şube Adresi -> Separator -> Merkez Depo Adresi */}
        <div className="flex-col gap-20">
          {sortedList.map((item, index) => {
            const isBranch = item.tur === 3;
            const itemId = item.id != null ? item.id : (item.kod || (item.tur === 3 ? 'MERKEZ-SUBE' : 'MERKEZ-DEPO'));
            const fieldError = errors[`depo_adres_${itemId}`];
            const isWarehouse = !isBranch;
            const canCopyFromBranch = isWarehouse && branchItem && branchItem.adres && branchItem.adres.trim() !== '';
            const formTitle = editingFirma?.firmaAdi || (id ? t('firma_duzenle', 'Firma Düzenle') : t('yeni_firma', 'Yeni Firma'));
            const itemTitle = item.ad || item.unvan || (isBranch ? t('merkez_sube_bolumu', 'Merkez Şube') : t('merkez_depo_bolumu', 'Merkez Depo'));

            return (
              <React.Fragment key={itemId || index}>
                <DepoFormCard
                  item={item}
                  branchItem={branchItem}
                  error={fieldError}
                  onCopyBranchAddress={() => handleCopyBranchAddress(itemId, branchItem)}
                  onAddressChange={(updated) => handleDepoAddressLayerChange(itemId, updated)}
                  onAdresSeciciClick={() => handleOpenAdresSubPage(item)}
                  required
                />

                {/* Seperator (Merkez Şube ile Merkez Depo veya diğer lokasyonlar arasında) */}
                {index < sortedList.length - 1 && (
                  <div className="depo-form-separator">
                    <div className="depo-form-separator-line" />
                    <span className="depo-form-separator-text">
                      {sortedList[index + 1].tur === 3 ? t('merkez_sube_bolumu', 'Merkez Şube') : t('merkez_depo_bolumu', 'Merkez Depo')}
                    </span>
                    <div className="depo-form-separator-line" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  /** 5. BÖLÜM: Yönetici Hesabı ve Güvenlik (Düzenleme modunda UserCard ile kullanıcılar listelenir) */
  const renderYoneticiHesabi = () => {
    // Düzenleme Modu: Firmanın kullanıcılarını modern UserCard kartları içinde listele
    if (editingFirma) {
      return (
        <div className="firma-tab-content firma-kullanicilari-tab-container flex-col gap-20">

          {/* Kullanıcı Listesi / Grid */}
          {kullanicilarLoading ? (
            <div className="page-loading-state">
              {t('kullanicilar_yukleniyor', 'Kullanıcılar yükleniyor...')}
            </div>
          ) : firmaKullanicilari && firmaKullanicilari.length > 0 ? (
            <div className="user-card-grid">
              {firmaKullanicilari.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={handleKullaniciDuzenle}
                  onDelete={handleKullaniciSil}
                />
              ))}
            </div>
          ) : (
            <div className="user-card-empty-state">
              <Users size={44} className="user-card-empty-icon" />
              <div className="user-card-empty-title">{t('kayitli_kullanici_yok', 'Henüz kayıtlı kullanıcı bulunmuyor.')}</div>
              <div className="user-card-empty-desc">
                {t('kullanici_eklemek_icin_tiklayin', 'Firmaya erişim yetkisi tanımlamak için yeni kullanıcı ekleyebilirsiniz.')}
              </div>
            </div>
          )}

          {/* Bekleyen Davetler Bölümü */}
          {bekleyenDavetler && bekleyenDavetler.filter(d => !d.kullanildiMi).length > 0 && (
            <div className="pending-invitations-container flex-col gap-12">
              <div className="flex-row items-center gap-8 pending-invitations-title">
                <Mail size={16} />
                <span className="font-semibold">{t('bekleyen_davetler', 'Bekleyen Kullanıcı Davetleri')}</span>
                <span className="badge-count">
                  {bekleyenDavetler.filter(d => !d.kullanildiMi).length}
                </span>
              </div>
              <div className="pending-invitations-list flex-col gap-8">
                {bekleyenDavetler.filter(d => !d.kullanildiMi).map((davet) => (
                  <div key={davet.id} className="pending-invitation-card flex-row items-center justify-between">
                    <div className="flex-row items-center gap-12">
                      <div className="pending-invitation-avatar">
                        <Mail size={16} />
                      </div>
                      <div className="flex-col">
                        <div className="pending-invitation-email font-medium">{davet.email}</div>
                        <div className="pending-invitation-subtext flex-row items-center gap-12">
                          <span>{t('rol', 'Rol')}: <strong>{davet.rol}</strong></span>
                          <span>•</span>
                          <span>{t('son_gecerlilik', 'Son Geçerlilik')}: {new Date(davet.gecerlilikTarihi).toLocaleDateString()} {new Date(davet.gecerlilikTarihi).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-row items-center gap-8">
                      <button
                        type="button"
                        className="btn-action-cancel"
                        onClick={() => handleDavetIptal(davet.id)}
                        title={t('daveti_iptal_et', 'Daveti İptal Et')}
                      >
                        <X size={14} />
                        <span>{t('iptal_et', 'İptal Et')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste alanının sağ alt köşesinde yüzen ekleme butonu */}
          <EkleFloatCircleButton
            onClick={handleYeniKullaniciEkle}
            position="absolute-bottom-right"
            title={t('yeni_kullanici_davet_et', 'Yeni Kullanıcı Davet Et')}
            useShadow={true}
          />

          {/* Kullanıcı Davet Modalı */}
          <FirmaKullaniciDavetModal
            isOpen={davetModalOpen}
            onClose={() => setDavetModalOpen(false)}
            firmaId={id}
            firmaAdi={editingFirma?.firmaAdi}
            onSuccess={() => {
              if (id) {
                fetchFirmaDavetleri(id);
                fetchFirmaKullanicilari(id);
              }
            }}
          />
        </div>
      );
    }

    // Yeni Firma Oluşturma Sihirbaz Modu (!editingFirma):
    return (
      <div className="firma-tab-content flex-col gap-20">
        {/* Bilgilendirici Adım / Sekme Banner'ı (Yalnızca Sihirbaz Modunda) */}
        {!isEditMode && (
          <div className="wizard-step-banner">
            <div className="wizard-step-banner-icon">
              <KeyRound size={22} />
            </div>
            <div className="wizard-step-banner-body">
              <div className="wizard-step-banner-badge">{t('adim_6_etiket_yonetici', '6. Adım / Erişim & Kimlik')}</div>
              <div className="wizard-step-banner-title">{t('yonetici_hesabi_ve_giris', 'Yönetici Hesabı ve Sisteme Giriş')}</div>
              <div className="wizard-step-banner-desc">
                {t('yonetici_hesabi_aciklama', 'Firma yöneticisinin sisteme ilk girişi gerçekleştireceği e-posta adresini belirleyiniz. Mevcut kullanıcılar doğrudan yetkilendirilir.')}
              </div>
            </div>
          </div>
        )}

        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">{t('yetkili_ad_soyad', 'Yetkili Ad Soyad')}</label>
            <BasitInput
              placeholder={t('yetkili_ad_soyad_placeholder', 'Örn: Ahmet Yılmaz')}
              value={formData.yetkiliAdSoyad}
              onChange={(e) => setFormData({ ...formData, yetkiliAdSoyad: e.target.value })}
              textTransform="basHarflerBuyuk"
            />
          </div>

          <div className="form-field">
            <label className="form-label">{t('telefon_numarasi', 'Telefon Numarası')}</label>
            <PhoneInput
              value={formData.telefon}
              onChange={(e) => {
                const val = e && e.target ? e.target.value : e;
                setFormData({ ...formData, telefon: val });
              }}
              placeholder="0 (5XX) XXX XX XX"
            />
          </div>
        </div>

        <div className="form-field full-width">
          <label className="form-label">
            {t('yonetici_eposta', 'Yönetici E-Posta Adresi')} <span className="required-mark">*</span>
          </label>
          <EmailInput
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              clearError('email');
            }}
            onBlur={() => handleEmailCheck()}
            placeholder="admin@firma.com"
            disabled={!!editingFirma}
          />
          <FieldError error={errors.email} />

          {emailChecking && (
            <div className="user-email-checking-text">
              {t('eposta_kontrol_ediliyor', 'E-posta adresi kontrol ediliyor...')}
            </div>
          )}

          {kullaniciDurumu?.mevcutKullanici && (
            <div className="user-account-detected-box">
              <UserCheck size={18} />
              <div>
                <strong>{t('kayitli_kullanici_bulundu', 'Kayıtlı Kullanıcı Hesabı Bulundu:')}</strong> {kullaniciDurumu.adSoyad} ({formData.email})
                <div className="user-account-subtext">
                  {t('kayitli_kullanici_bilgisi', 'Bu e-posta sistemde kayıtlı olduğundan firma doğrudan bu hesaba bağlanacak, şifre belirlemenize gerek yoktur.')}
                </div>
              </div>
            </div>
          )}

          {!editingFirma && !kullaniciDurumu?.mevcutKullanici && formData.email && formData.email.includes('@') && !emailChecking && (
            <div className="user-account-new-box">
              <UserPlus size={18} />
              <div>
                <strong>{t('yeni_kullanici_olusturulacak', 'Yeni Yönetici Kullanıcısı Oluşturulacak')}</strong>
                <div className="user-account-subtext">
                  {t('yeni_kullanici_bilgisi', 'Bu firma için yeni bir hesap açılacaktır. Lütfen sisteme giriş için güçlü bir şifre belirleyiniz.')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Yeni kullanıcı şifre ve şifre tekrarı (Yalnızca yeni kayıt ve mevcut hesap değilse) */}
        {!editingFirma && !kullaniciDurumu?.mevcutKullanici && (() => {
          const policyResult = checkPasswordAgainstPolicy(formData.sifre, passwordPolicy);
          const isMatched = Boolean(
            formData.sifre && 
            formData.sifreTekrar && 
            formData.sifre === formData.sifreTekrar
          );

          return (
            <>
              <div className="form-grid full-width">
                {/* Şifre Alanı */}
                <div className="form-field">
                  <label className="form-label">
                    {t('sisteme_giris_sifresi', 'Sisteme Giriş Şifresi')} <span className="required-mark">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input password-input-field ${errors.sifre ? 'is-invalid' : ''}`}
                      placeholder={t('sifre_placeholder', 'Şifrenizi giriniz...')}
                      value={formData.sifre || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, sifre: val }));
                        clearError('sifre');
                        if (errors.sifreTekrar && formData.sifreTekrar === val) {
                          clearError('sifreTekrar');
                        }
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? t('gizle', 'Gizle') : t('goster', 'Göster')}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <FieldError error={errors.sifre} />
                </div>

                {/* Şifre Tekrar Alanı */}
                <div className="form-field">
                  <label className="form-label">
                    {t('sisteme_giris_sifresi_tekrar', 'Şifre Tekrarı')} <span className="required-mark">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswordRepeat ? 'text' : 'password'}
                      className={`form-input password-input-field ${errors.sifreTekrar ? 'is-invalid' : ''}`}
                      placeholder={t('sifre_tekrar_placeholder', 'Şifrenizi tekrar giriniz...')}
                      value={formData.sifreTekrar || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, sifreTekrar: val }));
                        clearError('sifreTekrar');
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPasswordRepeat(!showPasswordRepeat)}
                      title={showPasswordRepeat ? t('gizle', 'Gizle') : t('goster', 'Göster')}
                    >
                      {showPasswordRepeat ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <FieldError error={errors.sifreTekrar} />
                  {isMatched && !errors.sifreTekrar && (
                    <div className="password-match-indicator is-match">
                      <CheckCircle2 size={14} />
                      <span>{t('sifreler_eslesiyor', 'Şifreler eşleşiyor.')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Güvenlik Politikası Gereksinimleri */}
              <div className="password-policy-checklist full-width">
                <div className="password-policy-checklist-title">
                  {t('sifre_guvenlik_politikasi_kurallari', 'Şifre Güvenlik Politikası Kuralları')}
                </div>
                <div className="flex-row flex-wrap gap-12 pt-4">
                  {policyResult.rules.map(rule => (
                    <div 
                      key={rule.key} 
                      className={`password-policy-item ${rule.passed ? 'is-met' : ''} ${rule.required ? 'is-required' : ''}`}
                    >
                      {rule.passed ? <CheckCircle2 size={13} /> : <div className="policy-bullet" />}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </div>
    );
  };

  // DataTable Sütun Tanımları (Modül Yönetimi ile Birebir Eşit)
  const modulDataTableColumns = useMemo<Column<any>[]>(() => [
    {
      id: 'icon',
      header: t('ikon', 'İkon'),
      width: 60,
      align: 'center',
      render: (item: any) => (
        <div className="module-grid-icon-cell">
          {renderModuleIcon(item.iconName)}
        </div>
      )
    },
    {
      id: 'title',
      header: t('modul_adi', 'Modül Başlığı'),
      accessor: 'title',
      sortable: true,
      minWidth: 200,
      render: (item: any) => (
        <div className="module-title-cell">
          <span className="module-title-primary font-medium">
            {item.title}
          </span>
          <span className="module-title-secondary">{item.exportName || item.kod || item.id}</span>
        </div>
      )
    },
    {
      id: 'id',
      header: t('modul_kodu', 'Modül Kimliği (ID)'),
      accessor: 'id',
      sortable: true,
      width: 170,
      render: (item: any) => (
        <span className="module-id-badge font-mono">{item.id}</span>
      )
    },
    {
      id: 'package',
      header: t('paket_yolu', 'Paket (@akalin/*) / Yol'),
      accessor: 'package',
      minWidth: 200,
      render: (item: any) => (
        <span className="module-package-text font-mono">
          {item.package || item.path || '—'}
        </span>
      )
    },
    {
      id: 'isCore',
      header: t('cekirdek_sistem', 'Çekirdek Sistem'),
      accessor: 'isCore',
      sortable: true,
      width: 140,
      align: 'center',
      render: (item: any) => {
        const isCore = Boolean(item.isCore) || 
          SYSTEM_CORE_MODULE_CODES.includes(item.kod) || 
          SYSTEM_CORE_MODULE_CODES.includes(item.id);
        return (
          <div className="flex items-center justify-center">
            {isCore ? (
              <span className="modul-badge badge-core">
                <ShieldCheck size={12} />
                {t('cekirdek', 'Çekirdek')}
              </span>
            ) : (
              <span className="modul-badge badge-plugin">
                <Package size={12} />
                {t('eklenti', 'Eklenti')}
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'yetki',
      header: t('firma_yetkisi', 'Firma Erişimi'),
      width: 140,
      align: 'center',
      render: (item: any) => {
        const isCore = Boolean(item.isCore) || 
          SYSTEM_CORE_MODULE_CODES.includes(item.kod) || 
          SYSTEM_CORE_MODULE_CODES.includes(item.id);
        const isSelected = isModuleSelected(item);

        return (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <BaseSwitch
              checked={isSelected}
              disabled={isCore}
              onChange={(e) => handleToggleModul(item, e.target.checked)}
            />
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: t('ayarlar', 'Ayarlar'),
      width: 90,
      align: 'center',
      render: (item: any) => {
        const hasSettings = ModuleSettingsRegistry.has(item.kod || item.id || '');
        if (!hasSettings) {
          return <span className="text-muted text-xs">—</span>;
        }
        return (
          <button
            type="button"
            className="btn btn-ghost btn-sm firma-modul-settings-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModulSettings(item.kod || item.id);
            }}
            title={t('modul_ayarlari', 'Modül Ayarları')}
          >
            <Settings2 size={16} />
          </button>
        );
      }
    }
  ], [t, isModuleSelected, handleToggleModul, handleOpenModulSettings]);

  /** 5. BÖLÜM: Modül İzinleri */
  const renderModulIzinleri = () => (
    <div className="firma-tab-content flex-col gap-16">
      {/* Bilgilendirici Adım / Sekme Banner'ı (Yalnızca Sihirbaz Modunda) */}
      {!isEditMode && (
        <div className="wizard-step-banner">
          <div className="wizard-step-banner-icon">
            <Package size={22} />
          </div>
          <div className="wizard-step-banner-body">
            <div className="wizard-step-banner-badge">{t('adim_5_etiket_moduller', '5. Adım / Sistem İzinleri')}</div>
            <div className="wizard-step-banner-title">{t('firma_modul_yetkileri', 'Firma Modül ve Özellik İzinleri')}</div>
            <div className="wizard-step-banner-desc">
              {t('firma_modul_yetkileri_aciklama', 'Bu işletmenin erişimine açık olacak ERP modüllerini (Stok, Fatura, Finans, E-Dönüşüm vb.) seçip özelleştiriniz.')}
            </div>
          </div>
        </div>
      )}

      <div className="flex-row items-center justify-between">
        <div>
          <h4 className="firma-modul-heading">
            {t('aktif_modul_listesi', 'Kullanılabilir Modül Listesi')}
          </h4>
          <p className="firma-modul-subheading">
            {t('firma_modul_aciklama', 'Bu firmanın kullanımına açık olacak sistem modüllerini belirleyin.')}
          </p>
        </div>

        <div className="flex-row gap-8">
          {formData.faaliyetAlanlari?.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary firma-action-btn-sm"
              onClick={handleApplySectorModuller}
              title={t('faaliyet_alani_modulleri_ipucu', 'Faaliyet alanında belirlenen varsayılan modül seçimlerini uygular.')}
            >
              <RotateCcw size={14} /> {t('faaliyet_alani_modulleri_yukle', 'Faaliyet Alanından Yükle')}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary firma-action-btn-sm"
            onClick={handleSelectAllModuller}
          >
            <CheckSquare size={14} /> {t('tumunu_sec', 'Tümünü Seç')}
          </button>
          <button
            type="button"
            className="btn btn-secondary firma-action-btn-sm"
            onClick={handleClearAllModuller}
          >
            <Square size={14} /> {t('temizle', 'Temizle')}
          </button>
        </div>
      </div>

      {seciliSektorAdlari.length > 0 && (
        <div className="firma-modul-sector-info">
          <Sparkles size={16} />
          <span>
            {t('faaliyet_alani_baglantisi', 'Seçili Faaliyet Alanı')}: <strong>{seciliSektorAdlari.join(', ')}</strong>
          </span>
          <span className="firma-modul-sector-count">
            {t('secili_modul_sayisi_detayli', '{{selected}} / {{total}} Modül Seçili ({{businessCount}} İş Modülü + {{coreCount}} Çekirdek)', {
              selected: tumModuller.filter(m => isModuleSelected(m)).length,
              total: tumModuller.length,
              businessCount: tumModuller.filter(m => isModuleSelected(m) && !Boolean(m.isCore || SYSTEM_CORE_MODULE_CODES.includes(m.kod) || SYSTEM_CORE_MODULE_CODES.includes(m.id))).length,
              coreCount: tumModuller.filter(m => Boolean(m.isCore || SYSTEM_CORE_MODULE_CODES.includes(m.kod) || SYSTEM_CORE_MODULE_CODES.includes(m.id))).length
            })}
          </span>
        </div>
      )}

      <div className="glass-card rounded-xl border border-border overflow-hidden firma-moduller-table-wrapper">
        <DataTable<any>
          data={tumModuller}
          columns={modulDataTableColumns}
          pageSize={100}
          emptyMessage={t('modul_bulunamadi', 'Kullanılabilir modül bulunamadı.')}
          keyExtractor={(item) => String(item.id || item.kod || item.dbId)}
        />
      </div>
    </div>
  );

  /** 6. BÖLÜM: Firma Hareketleri ve İşlem Geçmişi (Yalnızca Düzenleme Modunda) */
  const renderFirmaHareketleri = () => (
    <div className="firma-tab-content timeline-container flex-col gap-16">
      {/* Bilgilendirici Adım / Sekme Banner'ı (Yalnızca Sihirbaz Modunda) */}
      {!isEditMode && (
        <div className="wizard-step-banner">
          <div className="wizard-step-banner-icon">
            <Activity size={22} />
          </div>
          <div className="wizard-step-banner-body">
            <div className="wizard-step-banner-badge">{t('islem_gecmisi_etiket', 'İşlem Günlüğü')}</div>
            <div className="wizard-step-banner-title">{t('firma_hareket_gecmisi', 'Firma Hareket ve Lisans Geçmişi')}</div>
            <div className="wizard-step-banner-desc">
              {t('firma_hareket_gecmisi_aciklama', 'Firma üzerinde gerçekleştirilen tüm lisanslama, süre uzatma ve yönetimsel işlemlerin kayıtlarını inceleyiniz.')}
            </div>
          </div>
        </div>
      )}

      {hareketler.length === 0 ? (
        <p className="timeline-empty-message">
          {t('henuz_hareket_bulunmuyor', 'Henüz kayıtlı bir hareket bulunmuyor.')}
        </p>
      ) : (
        <div className="timeline-list">
          {hareketler.map((h) => (
            <div key={h.id} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-date">
                {new Date(h.tarih).toLocaleString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="timeline-title">{h.islemTipi}</div>
              <div className="timeline-desc">{h.aciklama}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ==========================================================================
  // DÜZENLEME MODU (TABLAYOUT) SEKME KONFİGÜRASYONU
  // ==========================================================================
  const tabs = useMemo(() => [
    {
      id: 'genel',
      label: t('genel_bilgiler', 'Genel Bilgiler'),
      icon: <Building size={16} />,
      content: renderGenelBilgiler()
    },
    {
      id: 'faaliyet',
      label: t('faaliyet_alanlari', 'Faaliyet Alanı'),
      icon: <Layers size={16} />,
      content: renderFaaliyetAlani()
    },
    {
      id: 'sektorelAyarlar',
      label: t('sektorel_ayarlar', 'Sektörel Ayarlar'),
      icon: <Settings2 size={16} />,
      content: renderSektorelAyarlar()
    },
    {
      id: 'depolarVeSubeler',
      label: t('depolar_ve_subeler', 'Depolar ve Şubeler'),
      icon: <Warehouse size={16} />,
      content: renderDepolarVeSubeler()
    },
    {
      id: 'moduller',
      label: t('moduller', 'Modüller'),
      icon: <Package size={16} />,
      content: renderModulIzinleri()
    },
    {
      id: 'yonetici',
      label: t('kullanicilar', 'Kullanıcılar'),
      icon: <Users size={16} />,
      content: renderYoneticiHesabi()
    },
    {
      id: 'hareketler',
      label: t('firma_hareketleri', 'Hareketler'),
      icon: <Activity size={16} />,
      content: renderFirmaHareketleri()
    }
  ], [
    formData, 
    errors, 
    filtrelenmisSektorler, 
    seciliSektorSayisi, 
    acikSektorler, 
    tumModuller, 
    firmaModulleri, 
    editingFirma, 
    kullaniciDurumu, 
    emailChecking, 
    hareketler, 
    currentSeedParaBirimleri,
    currentSeedKdvGruplari,
    currentSeedBirimler,
    firmaKullanicilari,
    kullanicilarLoading,
    kullaniciModalOpen,
    seciliKullanici,
    editingDepoItem,
    isAddingDepo,
    modulDataTableColumns,
    t
  ]);

  const cardExtraDropdownActions = useMemo<ActionMenuItem[]>(() => {
    if (!editingFirma) return [];
    const isDemo = Boolean(editingFirma.isDemo ?? editingFirma.demoMu);
    const actions: ActionMenuItem[] = [];

    if (isDemo) {
      actions.push(
        {
          label: t('sure_uzat', 'Süre Uzat'),
          icon: <Clock size={15} />,
          onClick: () => handleSureUzat(editingFirma.id, editingFirma.firmaAdi)
        },
        {
          label: t('normal_lisansa_gecir', 'Lisansa Geçir'),
          icon: <ShieldCheck size={15} />,
          onClick: () => handleLisansaGecir(editingFirma.id, editingFirma.firmaAdi)
        }
      );
    }

    return actions;
  }, [editingFirma, handleSureUzat, handleLisansaGecir, t]);

  if (detailLoading) {
    return (
      <div className="page-loading-state">
        {t('firma_bilgileri_yukleniyor', 'Firma bilgileri yükleniyor...')}
      </div>
    );
  }


  // Kullanıcı Ekleme / Düzenleme Modu (Tam Sayfa BaseCardPage)
  if (kullaniciModalOpen) {
    return (
      <FirmaKullaniciForm
        initialData={seciliKullanici ? { ...seciliKullanici, firmaId: id } : { firmaId: id }}
        inModal={false}
        onSuccess={() => {
          setKullaniciModalOpen(false);
          setSeciliKullanici(null);
          if (id) fetchFirmaKullanicilari(id);
        }}
        onCancel={() => {
          setKullaniciModalOpen(false);
          setSeciliKullanici(null);
        }}
      />
    );
  }

  // Para Birimleri Alt Sayfa Modu (Tam Sayfa BaseCardPage)
  if (isCurrencySubPage) {
    return (
      <BaseCardPage
        id="firmaParaBirimleriPage"
        showBackButton={true}
        onBack={handleBackFromCurrency}
        title={t('sektorel_para_birimleri_baslik', 'Para Birimleri Yapılandırması')}
        icon={<Coins size={20} />}
        subtitleLeft={t('sektorel_para_birimleri_aciklama', 'Bu sektörü seçen firmanın veri tabanı ilk kurulumunda (seed) tanımlanacak varsayılan para birimlerini yapılandırın.')}
        asForm={true}
        onSave={handleBackFromCurrency}
        isSaving={saving}
        onClose={handleBackFromCurrency}
      >
        <div className="pt-8">
          {ParaBirimleri ? (
            <ParaBirimleri
              showTopHeader={false}
              inMemoryMode={true}
              hideOtherTabs={true}
              initialItems={currentSeedParaBirimleri}
              onSaveMemory={handleCurrencyMemoryUpdate}
            />
          ) : (
            <div className="p-20 text-center text-secondary">
              {t('sektorel_para_birimleri_aciklama', 'Para birimleri yapılandırması')}
            </div>
          )}
        </div>
      </BaseCardPage>
    );
  }

  // Vergi ve KDV Alt Sayfa Modu (Tam Sayfa BaseCardPage)
  if (isKdvSubPage) {
    return (
      <BaseCardPage
        id="firmaKdvPage"
        showBackButton={true}
        onBack={handleBackFromKdv}
        title={t('sektorel_vergi_kdv_baslik', 'Vergi ve KDV Ayarları')}
        icon={<Percent size={20} />}
        subtitleLeft={t('sektorel_vergi_kdv_aciklama', 'Bu sektörü seçen firmanın veri tabanı ilk kurulumunda (seed) tanımlanacak varsayılan vergi ve KDV oranlarını yapılandırın.')}
        asForm={true}
        onSave={handleBackFromKdv}
        isSaving={saving}
        onClose={handleBackFromKdv}
      >
        <div className="pt-8">
          {KdvAyarlari ? (
            <KdvAyarlari
              showTopHeader={false}
              inMemoryMode={true}
              initialItems={currentSeedKdvGruplari}
              onSaveMemory={handleKdvMemoryUpdate}
            />
          ) : (
            <div className="p-20 text-center text-secondary">
              {t('sektorel_vergi_kdv_aciklama', 'Vergi ve KDV ayarları')}
            </div>
          )}
        </div>
      </BaseCardPage>
    );
  }

  // Ölçü Birimleri Alt Sayfa Modu (Tam Sayfa BaseCardPage)
  if (isBirimSubPage) {
    return (
      <BaseCardPage
        id="firmaBirimlerPage"
        showBackButton={true}
        onBack={handleBackFromBirim}
        title={t('sektorel_birimler_baslik', 'Ölçü Birimleri Yapılandırması')}
        icon={<Scale size={20} />}
        subtitleLeft={t('sektorel_birimler_aciklama', 'Bu sektörü seçen firmanın veri tabanı ilk kurulumunda (seed) tanımlanacak varsayılan ölçü birimlerini (Adet, Kg, Litre vb.) yapılandırın.')}
        asForm={true}
        onSave={handleBackFromBirim}
        isSaving={saving}
        onClose={handleBackFromBirim}
      >
        <div className="pt-8">
          {Birimler ? (
            <Birimler
              showTopHeader={false}
              inMemoryMode={true}
              initialItems={currentSeedBirimler}
              onSaveMemory={handleBirimMemoryUpdate}
            />
          ) : (
            <div className="p-20 text-center text-secondary">
              {t('sektorel_birimler_aciklama', 'Ölçü birimleri yapılandırması')}
            </div>
          )}
        </div>
      </BaseCardPage>
    );
  }

  // Modül Ayarları Alt Sayfa Modu (Dinamik ModulSettingsRegistry Bileşeni)
  if (isModulSettingsSubPage && activeSettingsDef) {
    const SettingsComp = activeSettingsDef.component;
    const isCari = activeModulKod?.toUpperCase().includes('CARI');
    const isUrun = activeModulKod?.toUpperCase().includes('URUN') || activeModulKod?.toUpperCase().includes('STOK');
    const currentVal = formData.sektorelSeedData?.modulAyarlari?.[activeModulKod] 
      || (isCari ? formData.sektorelSeedData?.modulAyarlari?.['MOD_CARI'] : null)
      || (isCari ? formData.cariTuruYapilandirma : null)
      || (isUrun ? (formData.sektorelSeedData?.modulAyarlari?.['MOD_URUN_YONETIMI'] || formData.sektorelSeedData?.modulAyarlari?.['MOD_URUN_HIZMET']) : null)
      || activeSettingsDef.defaultValues 
      || {};

    return (
      <SettingsComp
        value={currentVal}
        onChange={handleModulSettingsMemoryUpdate}
        firmaId={formData.id || id}
        onSave={handleBackFromModulSettings}
        isSaving={saving}
        onClose={handleBackFromModulSettings}
      />
    );
  }

  // Adres Seçici Modu (Tam Sayfa BaseCardPage - URL Rotalı)
  if (isAdresRoute) {
    const returnPath = getBaseFirmaPath();
    const targetDepoId = searchParams.get('depoId');
    const selectedDepo = targetDepoId
      ? (formData.depolarVeSubeler || []).find(d => {
          if (d.id != null && String(d.id).toLowerCase() === String(targetDepoId).toLowerCase()) return true;
          if (d.kod && String(d.kod).toLowerCase() === String(targetDepoId).toLowerCase()) return true;
          if (targetDepoId === 'MERKEZ-SUBE' && d.tur === 3) return true;
          if (targetDepoId === 'MERKEZ-DEPO' && d.tur !== 3) return true;
          return false;
        })
      : (formData.depolarVeSubeler?.find(d => d.tur === 3) || formData.depolarVeSubeler?.[0] || null);

    const isBranch = selectedDepo ? selectedDepo.tur === 3 : false;
    const itemTitle = selectedDepo 
      ? (selectedDepo.ad || selectedDepo.unvan || (isBranch ? t('merkez_sube_bolumu', 'Merkez Şube') : t('merkez_depo_bolumu', 'Merkez Depo')))
      : t('adres_belirle', 'Adres Belirle');

    const formTitle = editingFirma?.firmaAdi || (id ? t('firma_duzenle', 'Firma Düzenle') : t('yeni_firma', 'Yeni Firma'));
    
    const returnToForm = (updatedData = formData) => {
      navigate(returnPath, {
        state: {
          currentFormData: {
            ...updatedData,
            modulIds: firmaModulleri
          },
          activeTabId: activeTabId || 'depolarVeSubeler'
        }
      });
    };

    const activeAddressData = selectedDepo || formData;

    return (
      <AdresSeciciForm
        isOpen={true}
        inModal={false}
        title={t('adres_belirle', 'Adres Belirle')}
        subtitle={selectedDepo ? `${formTitle} • ${itemTitle}` : formTitle}
        onClose={() => {
          if (adresSaveHandledRef.current) return;
          returnToForm();
        }}
        initialData={{
          adresIlId: activeAddressData.adresIlId,
          adresIlceId: activeAddressData.adresIlceId,
          adresBucakId: activeAddressData.adresBucakId,
          adresKoyId: activeAddressData.adresKoyId,
          adresMahalleId: activeAddressData.adresMahalleId,
          adresCaddeSokakId: activeAddressData.adresCaddeSokakId,
          adresDisKapiId: activeAddressData.adresDisKapiId,
          adresIcKapiId: activeAddressData.adresIcKapiId,
          adres: activeAddressData.adres,
          acikAdres: activeAddressData.acikAdres || activeAddressData.adres,
        }}
        onSave={({ ids, formattedAdres, parts }) => {
          adresSaveHandledRef.current = true;
          const newIlId = ids?.adresIlId ? Number(ids.adresIlId) : null;
          const newIlceId = ids?.adresIlceId ? Number(ids.adresIlceId) : null;
          let updatedFormData = { ...formData };
          if (selectedDepo) {
            const updatedDepolar = (formData.depolarVeSubeler || []).map(d => {
              const isMatch = (d === selectedDepo) ||
                (selectedDepo.id != null && d.id != null && String(d.id) === String(selectedDepo.id)) ||
                (selectedDepo.kod && d.kod && String(d.kod).toLowerCase() === String(selectedDepo.kod).toLowerCase()) ||
                (targetDepoId === 'MERKEZ-SUBE' && d.tur === 3) ||
                (targetDepoId === 'MERKEZ-DEPO' && d.tur !== 3) ||
                (selectedDepo.tur != null && d.tur != null && d.tur === selectedDepo.tur);

              if (!isMatch) return d;
              return {
                ...d,
                ...ids,
                ilId: newIlId ?? d.ilId,
                ilceId: newIlceId ?? d.ilceId,
                adres: formattedAdres,
                acikAdres: formattedAdres,
                ilAdi: parts?.il || d.ilAdi,
                ilceAdi: parts?.ilce || d.ilceAdi
              };
            });

            const isPrimarySube = selectedDepo.tur === 3;
            updatedFormData = {
              ...formData,
              depolarVeSubeler: updatedDepolar,
              ...(isPrimarySube ? { 
                ...ids, 
                ilId: newIlId ?? formData.ilId,
                ilceId: newIlceId ?? formData.ilceId,
                adres: formattedAdres,
                acikAdres: formattedAdres,
                ilAdi: parts?.il || formData.ilAdi,
                ilceAdi: parts?.ilce || formData.ilceAdi
              } : {})
            };
          } else {
            updatedFormData = {
              ...formData,
              ...ids,
              ilId: newIlId ?? formData.ilId,
              ilceId: newIlceId ?? formData.ilceId,
              adres: formattedAdres,
              acikAdres: formattedAdres,
              ilAdi: parts?.il || formData.ilAdi,
              ilceAdi: parts?.ilce || formData.ilceAdi
            };
          }
          const draftWithModules = { ...updatedFormData, modulIds: firmaModulleri };
          setFormData(updatedFormData);
          try {
            sessionStorage.setItem('webakus_firma_form_draft', JSON.stringify(draftWithModules));
          } catch (e) {}
          returnToForm(updatedFormData);
        }}
      />
    );
  }

  // ==========================================================================
  // SUNUM KATMANI (PRESENTATION LAYER)
  // 1. Düzenleme Modu (id mevcut) -> BaseCardPage + TabLayout
  // 2. Yeni Kayıt Modu (!id)       -> BaseWizardPage (Sihirbaz)
  // ==========================================================================
  return (
    <>
      {id || editingFirma ? (
        /* ─── DÜZENLEME MODU (SEKMELİ KART DÜZENİ / TABLAYOUT) ─── */
        <BaseCardPage
          id="firmaCardForm"
          showBackButton={false}
          asForm={false}
          title={editingFirma?.firmaAdi || t('firma_duzenle', 'Firma Düzenle')}
          icon={<Building size={20} />}
          subtitleLeft={editingFirma?.vergiNo ? `${t('vkn_etiket', 'VKN:')} ${editingFirma.vergiNo}` : undefined}
          onClose={onClose}
          onSubmit={handleFinish}
          onSave={handleFinish}
          isSaving={saving}
          saveButtonText={t('kaydet', 'Kaydet')}
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          extraDropdownActions={cardExtraDropdownActions}
        />
      ) : (
        /* ─── YENİ FİRMA KAYIT MODU (ADIM ADIM SİHİRBAZ) ─── */
        <BaseWizardPage
          id="firmaWizardForm"
          showBackButton={false}
          initialStepId={activeTabId || 'genel'}
          title={t('yeni_firma_olusturma_sihirbazi', 'Yeni Firma Oluşturma Sihirbazı')}
          subtitle={t('yeni_firma_sihirbaz_alt_baslik', 'Adımları takip ederek yeni firma kaydını, sektörel ayarlarını ve yönetici hesabını oluşturun.')}
          icon={<Building size={20} />}
          onClose={onClose}
          onFinish={handleFinish}
          isFinishing={saving}
          finishText={t('firmayi_olustur', 'Firmayı Oluştur')}
          onStepChange={(stepIdx) => {
            const stepIds = ['genel', 'faaliyet', 'sektorelAyarlar', 'depolarVeSubeler', 'moduller', 'yonetici'];
            const targetTab = stepIds[stepIdx];
            if (targetTab) {
              setActiveTabId(targetTab);
              if (targetTab === 'moduller' && !editingFirma && !hasManuallyEditedModullerRef.current) {
                if (formData.faaliyetAlanlari?.length > 0 && tumModuller.length > 0 && tumSektorler.length > 0) {
                  const resolved = resolveSectorModules(formData.faaliyetAlanlari, tumSektorler, tumModuller);
                  if (resolved && resolved.length > 0) {
                    setFirmaModulleri(resolved);
                    setFormData(prev => ({ ...prev, modulIds: resolved }));
                  }
                }
              }
            }
          }}
        >
          {/* 1. Adım: Genel Bilgiler */}
          <WizardStep 
            id="genel"
            title={t('genel_bilgiler', 'Genel Bilgiler')} 
            onValidate={validateStep1}
          >
            {renderGenelBilgiler()}
          </WizardStep>

          {/* 2. Adım: Faaliyet Alanı & Sektör */}
          <WizardStep 
            id="faaliyet"
            title={t('faaliyet_alanlari', 'Faaliyet Alanı')} 
            onValidate={validateStepFaaliyetAlanlari}
          >
            {renderFaaliyetAlani()}
          </WizardStep>

          {/* 3. Adım: Sektörel Ayarlar */}
          <WizardStep 
            id="sektorelAyarlar"
            title={t('sektorel_ayarlar', 'Sektörel Ayarlar')} 
            isValid={true}
          >
            {renderSektorelAyarlar()}
          </WizardStep>

          {/* 4. Adım: Depolar ve Şubeler */}
          <WizardStep 
            id="depolarVeSubeler"
            title={t('depolar_ve_subeler', 'Depolar ve Şubeler')} 
            onValidate={validateStepDepolarVeSubeler}
          >
            {renderDepolarVeSubeler()}
          </WizardStep>

          {/* 5. Adım: Modül İzinleri */}
          <WizardStep 
            id="moduller"
            title={t('moduller', 'Modüller')} 
            isValid={true}
          >
            {renderModulIzinleri()}
          </WizardStep>

          {/* 6. Adım: Yönetici Hesabı & Giriş */}
          <WizardStep 
            id="yonetici"
            title={t('yonetici_hesabi', 'Yönetici Hesabı')} 
            onValidate={validateStep4}
          >
            {renderYoneticiHesabi()}
          </WizardStep>
        </BaseWizardPage>
      )}



      {/* Ortak Lisans Süresi Uzatma Prompt Modalı */}
      <BasePromptDialog
        isOpen={sureUzatPrompt.isOpen}
        onClose={() => setSureUzatPrompt({ isOpen: false, firmaId: null, firmaAdi: '' })}
        title={t('lisans_suresi_uzat_baslik', 'Lisans Süresi Uzat')}
        label={t('sure_uzatma_sorusu', { firmaAdi: sureUzatPrompt.firmaAdi })}
        initialValue="30"
        placeholder={t('gun_sayisi_placeholder', 'Gün sayısı (Örn: 30)')}
        confirmText={t('uzat_butonu', 'Uzat')}
        onConfirm={onConfirmSureUzat}
      />
    </>
  );
}
