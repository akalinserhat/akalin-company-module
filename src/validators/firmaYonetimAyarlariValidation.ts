/**
 * @akalin/company_module - Firma Yönetim Ayarları Doğrulama Kuralları (firmaYonetimAyarlariValidation.ts)
 */

import i18n from 'i18next';

export interface FirmaYonetimAyarlariFormData {
  davetExpiryHours?: number | string;
  sifreSifirlamaExpiryMinutes?: number | string;
  varsayilanRol?: string;
  sifreGecerlilikGunu?: number | string;
  oturumZamanAsimiDk?: number | string;
  minSifreUzunlugu?: number | string;
  buyukHarfZorunlu?: boolean;
  kucukHarfZorunlu?: boolean;
  rakamZorunlu?: boolean;
  ozelKarakterZorunlu?: boolean;
}

export const validateFirmaYonetimAyarlari = (data: FirmaYonetimAyarlariFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  const t = i18n.t.bind(i18n);

  const davetHours = Number(data.davetExpiryHours);
  if (!data.davetExpiryHours || isNaN(davetHours) || davetHours < 1 || davetHours > 720) {
    errors.davetExpiryHours = t('davet_suresi_aralik_hatasi', 'Davet süresi 1 ile 720 saat arasında olmalıdır.');
  }

  const sifreMinutes = Number(data.sifreSifirlamaExpiryMinutes);
  if (!data.sifreSifirlamaExpiryMinutes || isNaN(sifreMinutes) || sifreMinutes < 5 || sifreMinutes > 1440) {
    errors.sifreSifirlamaExpiryMinutes = t('sifre_suresi_aralik_hatasi', 'Şifre sıfırlama süresi 5 ile 1440 dakika arasında olmalıdır.');
  }

  const gecerlilik = Number(data.sifreGecerlilikGunu);
  if (
    data.sifreGecerlilikGunu === undefined ||
    data.sifreGecerlilikGunu === '' ||
    isNaN(gecerlilik) ||
    gecerlilik < 0 ||
    gecerlilik > 365
  ) {
    errors.sifreGecerlilikGunu = t('sifre_gecerlilik_gunu_aralik_hatasi', 'Şifre geçerlilik süresi 0 (süresiz) ile 365 gün arasında olmalıdır.');
  }

  const oturumDk = Number(data.oturumZamanAsimiDk);
  if (!data.oturumZamanAsimiDk || isNaN(oturumDk) || oturumDk < 5 || oturumDk > 1440) {
    errors.oturumZamanAsimiDk = t('oturum_zamani_aralik_hatasi', 'Oturum zaman aşımı süresi 5 ile 1440 dakika arasında olmalıdır.');
  }

  const minLen = Number(data.minSifreUzunlugu);
  if (!data.minSifreUzunlugu || isNaN(minLen) || minLen < 6 || minLen > 32) {
    errors.minSifreUzunlugu = t('min_sifre_uzunlugu_aralik_hatasi', 'Minimum şifre uzunluğu 6 ile 32 karakter arasında olmalıdır.');
  }

  return errors;
};
