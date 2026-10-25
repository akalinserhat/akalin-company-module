/**
 * @akalin/company_module - Firma Kullanıcısı Formu Doğrulama Kuralları (firmaKullaniciValidation.ts)
 */

import i18n from 'i18next';

export const validateFirmaKullanici = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {};
  const t = i18n.t.bind(i18n);

  if (!formData.ad || formData.ad.trim() === '') {
    errors.ad = t('ad_zorunlu', 'Ad alanı zorunludur.');
  }

  if (!formData.soyad || formData.soyad.trim() === '') {
    errors.soyad = t('soyad_zorunlu', 'Soyad alanı zorunludur.');
  }

  if (!formData.email || formData.email.trim() === '') {
    errors.email = t('eposta_zorunlu', 'E-posta alanı zorunludur.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = t('gecerli_eposta_giriniz', 'Geçerli bir e-posta adresi giriniz.');
  }

  if (formData.telefon && formData.telefon.trim()) {
    const digits = formData.telefon.replace(/\D/g, '');
    if (digits.length < 10) {
      errors.telefon = t('gecerli_telefon_giriniz', 'Lütfen geçerli bir telefon numarası giriniz.');
    }
  }

  if (formData.sifre && formData.sifre.length < 6) {
    errors.sifre = t('sifre_en_az_6_karakter', 'Şifre en az 6 karakter olmalıdır.');
  }

  return errors;
};
