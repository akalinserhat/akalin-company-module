/**
 * @akalin/company_module - Davet Kabul Formu Doğrulama Kuralları (davetKabulValidation.ts)
 */

import i18n from 'i18next';

export interface DavetKabulFormData {
  ad?: string;
  soyad?: string;
  telefon?: string;
  sifre?: string;
  sifreTekrar?: string;
}

export const validateDavetKabul = (formData: DavetKabulFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  const t = i18n.t.bind(i18n);

  if (!formData.ad || formData.ad.trim() === '') {
    errors.ad = t('ad_zorunlu', 'Ad alanı zorunludur.');
  }

  if (!formData.soyad || formData.soyad.trim() === '') {
    errors.soyad = t('soyad_zorunlu', 'Soyad alanı zorunludur.');
  }

  if (!formData.sifre || formData.sifre.length < 6) {
    errors.sifre = t('sifre_en_az_6_karakter', 'Şifre en az 6 karakter olmalıdır.');
  }

  if (formData.sifre !== formData.sifreTekrar) {
    errors.sifreTekrar = t('sifreler_eslesmiyor', 'Girdiğiniz şifreler birbiriyle uyuşmuyor.');
  }

  return errors;
};
