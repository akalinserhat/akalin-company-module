/**
 * @akalin/company_module - Firma Kullanıcı Daveti Doğrulama Kuralları (firmaDavetValidation.ts)
 */

import i18n from 'i18next';

export const validateFirmaDavet = (data: { email?: string; rol?: string }): Record<string, string> => {
  const errors: Record<string, string> = {};
  const t = i18n.t.bind(i18n);

  if (!data.email || data.email.trim() === '') {
    errors.email = t('eposta_zorunlu', 'E-posta alanı zorunludur.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = t('gecerli_eposta_giriniz', 'Geçerli bir e-posta adresi giriniz.');
  }

  if (!data.rol || data.rol.trim() === '') {
    errors.rol = t('rol_secimi_zorunlu', 'Lütfen bir rol seçiniz.');
  }

  return errors;
};
