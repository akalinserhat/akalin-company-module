/**
 * @akalin/company_module - Firma Formu Doğrulama Kuralları (firmaFormValidation.ts)
 */

import i18n from 'i18next';
import { validateVKN, validateTCKN } from '@akalin/ui';
import {
  PasswordPolicy,
  DEFAULT_PASSWORD_POLICY,
  checkPasswordAgainstPolicy,
} from '../services/passwordPolicyService';

/**
 * Firma sihirbazı 1. Adım (Genel Bilgiler) doğrulaması.
 */
export const validateFirmaStep1 = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {};
  const t = i18n.t.bind(i18n);

  if (!formData.firmaAdi || formData.firmaAdi.trim() === '') {
    errors.firmaAdi = t('firma_unvani_zorunludur', 'Firma ünvanı zorunludur.');
  }

  if (!formData.vergiDairesi || formData.vergiDairesi.trim() === '') {
    errors.vergiDairesi = t('vergi_dairesi_zorunludur', 'Vergi dairesi zorunludur.');
  }

  if (!formData.vergiNo || formData.vergiNo.trim() === '') {
    errors.vergiNo = t('vergi_no_zorunludur', 'Vergi numarası / TCKN zorunludur.');
  } else if (!/^[0-9]{10,11}$/.test(formData.vergiNo.trim())) {
    errors.vergiNo = t('vergi_no_format_hatasi', 'Vergi No 10 haneli VKN veya 11 haneli TCKN olmalıdır.');
  } else {
    const clean = formData.vergiNo.trim();
    const isValid = clean.length === 10 ? validateVKN(clean) : validateTCKN(clean);
    if (!isValid) {
      errors.vergiNo =
        clean.length === 10
          ? t('gecersiz_vkn', 'Geçersiz Vergi Numarası (VKN).')
          : t('gecersiz_tckn', 'Geçersiz T.C. Kimlik Numarası (TCKN).');
    }
  }

  return errors;
};

/**
 * Firma sihirbazı 2. Adım (Faaliyet Alanları) doğrulaması.
 */
export const validateFirmaFaaliyetAlanlari = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {};
  const t = i18n.t.bind(i18n);

  if (
    !formData.faaliyetAlanlari ||
    !Array.isArray(formData.faaliyetAlanlari) ||
    formData.faaliyetAlanlari.length === 0
  ) {
    errors.faaliyetAlanlari = t('en_az_bir_faaliyet_alani_secilmeli', 'En az bir faaliyet alanı seçilmelidir.');
  }

  return errors;
};

export const validateFirmaStep2 = validateFirmaFaaliyetAlanlari;

/**
 * Firma sihirbazı 4. Adım (Yönetici Hesabı) doğrulaması.
 */
export const validateFirmaStep4 = (
  formData: any,
  editingFirma?: any,
  kullaniciDurumu?: any,
  passwordPolicy?: PasswordPolicy
): Record<string, string> => {
  if (editingFirma) return {};

  const errors: Record<string, string> = {};
  const t = i18n.t.bind(i18n);

  if (!formData.email || formData.email.trim() === '') {
    errors.email = t('eposta_zorunlu', 'E-posta adresi zorunludur.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = t('gecerli_eposta_giriniz', 'Geçerli bir e-posta adresi giriniz.');
  }

  if (!kullaniciDurumu?.mevcutKullanici) {
    if (!formData.sifre || formData.sifre.trim() === '') {
      errors.sifre = t('sisteme_giris_sifresi_zorunlu', 'Sisteme giriş şifresi zorunludur.');
    } else {
      const activePolicy = passwordPolicy || DEFAULT_PASSWORD_POLICY;
      const { isValid, failedRequiredRules } = checkPasswordAgainstPolicy(formData.sifre, activePolicy);
      if (!isValid && failedRequiredRules.length > 0) {
        errors.sifre = t(
          'sifre_politikaya_uygun_degil',
          'Şifre güvenlik politikasına uygun değildir: {{rules}}',
          { rules: failedRequiredRules.map((r) => r.label).join(', ') }
        );
      }
    }

    if (!formData.sifreTekrar || formData.sifreTekrar.trim() === '') {
      errors.sifreTekrar = t('sifre_tekrar_zorunlu', 'Şifre tekrarı zorunludur.');
    } else if (formData.sifre !== formData.sifreTekrar) {
      errors.sifreTekrar = t('sifreler_eslesmiyor', 'Girilen şifreler birbiriyle uyuşmuyor.');
    }
  }

  return errors;
};

/**
 * Bir depo veya şubenin adresinin eksiksiz ve geçerli olup olmadığını doğrular.
 */
export const isDepoSubeAddressComplete = (item: any): boolean => {
  if (!item) return false;
  const adresText = (item.adres || item.acikAdres || '').trim();
  const hasText = adresText.length > 0;
  const ilId = item.adresIlId ?? item.ilId;
  const hasCity = ilId !== null && ilId !== undefined && ilId !== '' && Number(ilId) > 0;
  return hasText && hasCity;
};

/**
 * Firma sihirbazı Depolar ve Şubeler doğrulaması.
 */
export const validateFirmaDepolarVeSubeler = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {};
  const t = i18n.t.bind(i18n);
  const list = formData.depolarVeSubeler || [];

  if (!list || list.length === 0) {
    errors.depolarVeSubeler = t('en_az_bir_depo_veya_sube_tanimlanmali', 'En az bir depo veya şube tanımlanmalıdır.');
    return errors;
  }

  const missingAddressItems = list.filter((item: any) => !isDepoSubeAddressComplete(item));
  if (missingAddressItems.length > 0) {
    const names = missingAddressItems.map((item: any) => item.ad || item.kod || item.kodu).join(', ');
    errors.depolarVeSubeler = `${t(
      'lutfen_tum_depo_sube_adreslerini_doldurun',
      'Lütfen tüm depo ve şubelerin adres bilgilerini eksiksiz doldurunuz.'
    )} (${names})`;
    missingAddressItems.forEach((item: any) => {
      const fieldKey = `depo_adres_${item.id || item.kod || item.kodu}`;
      errors[fieldKey] = t('adres_ve_il_zorunludur', 'Depo/Şube için il seçimi ve açık adres girişi zorunludur.');
    });
  }

  return errors;
};

/**
 * Firma formu genel tamamlama / kaydetme doğrulaması.
 */
export const validateFirmaForm = (
  formData: any,
  editingFirma?: any,
  kullaniciDurumu?: any,
  passwordPolicy?: PasswordPolicy
): Record<string, string> => {
  const step1Errors = validateFirmaStep1(formData);
  const stepFaaliyetErrors = validateFirmaFaaliyetAlanlari(formData);
  const stepDepoErrors = validateFirmaDepolarVeSubeler(formData);
  const step4Errors = validateFirmaStep4(formData, editingFirma, kullaniciDurumu, passwordPolicy);

  return {
    ...step1Errors,
    ...stepFaaliyetErrors,
    ...stepDepoErrors,
    ...step4Errors,
  };
};

/**
 * Mükerrer Vergi Numarası / TCKN hata mesajı
 */
export const getDuplicateVergiNoError = (): string => {
  const t = i18n.t.bind(i18n);
  return t('bu_vergi_no_ile_firma_mevcut', 'Bu vergi numarası / TCKN ile kayıtlı bir firma zaten bulunmaktadır.');
};
