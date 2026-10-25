/**
 * @akalin/company_module - Şifre Politikası Servisi ve Doğrulayıcısı (passwordPolicyService.ts)
 * Sistem genelinde veya firma bazında belirlenen şifre politikalarını denetler.
 */

import i18n from 'i18next';
import { PasswordPolicyDTO } from '../types';
import { DEFAULT_PASSWORD_POLICY } from '../defaults/defaultCompanies';

export type PasswordPolicy = PasswordPolicyDTO;
export { DEFAULT_PASSWORD_POLICY };

export interface PasswordRuleStatus {
  key: string;
  label: string;
  passed: boolean;
  required: boolean;
}

/**
 * EntegrasyonAyarlari REST API'si üzerinden güncel şifre politikasını çeker (fetch tabanlı).
 */
export const fetchActivePasswordPolicy = async (customFetch: typeof fetch = fetch): Promise<PasswordPolicy> => {
  try {
    const keys = [
      'PASSWORD_EXPIRY_DAYS',
      'SESSION_TIMEOUT_MINUTES',
      'PASSWORD_MIN_LENGTH',
      'PASSWORD_REQUIRE_UPPERCASE',
      'PASSWORD_REQUIRE_LOWERCASE',
      'PASSWORD_REQUIRE_DIGIT',
      'PASSWORD_REQUIRE_SPECIAL',
    ];

    const responses = await Promise.all(
      keys.map((k) =>
        customFetch(`/api/EntegrasyonAyarlari/by-key/${k}`, {
          headers: { 'X-Silent-Error': 'true', Accept: 'application/json' },
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    );

    const [expiryRes, sessionRes, minLenRes, upperRes, lowerRes, digitRes, specialRes] = responses;

    return {
      expiryDays:
        expiryRes?.deger != null && expiryRes?.deger !== '' ? Number(expiryRes.deger) : 90,
      sessionTimeoutMinutes:
        sessionRes?.deger != null && sessionRes?.deger !== '' ? Number(sessionRes.deger) : 30,
      minLength: minLenRes?.deger ? Math.max(6, Number(minLenRes.deger)) : 8,
      requireUppercase:
        upperRes?.deger != null && upperRes?.deger !== '' ? upperRes.deger === 'true' : true,
      requireLowercase:
        lowerRes?.deger != null && lowerRes?.deger !== '' ? lowerRes.deger === 'true' : true,
      requireDigit:
        digitRes?.deger != null && digitRes?.deger !== '' ? digitRes.deger === 'true' : true,
      requireSpecial:
        specialRes?.deger != null && specialRes?.deger !== '' ? specialRes.deger === 'true' : false,
    };
  } catch (error) {
    console.error('Şifre politikası yüklenemedi:', error);
    return DEFAULT_PASSWORD_POLICY;
  }
};

/**
 * Verilen şifreyi mevcut politika kurallarına göre denetler.
 */
export const checkPasswordAgainstPolicy = (
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): {
  isValid: boolean;
  rules: PasswordRuleStatus[];
  failedRequiredRules: PasswordRuleStatus[];
} => {
  const t = i18n.t.bind(i18n);
  const pwd = password || '';

  const rules: PasswordRuleStatus[] = [
    {
      key: 'minLength',
      label: t('sifre_kurali_min_uzunluk', 'En az {{count}} karakter', { count: policy.minLength }),
      passed: pwd.length >= policy.minLength,
      required: true,
    },
    {
      key: 'uppercase',
      label: t('sifre_kurali_buyuk_harf', 'En az bir büyük harf (A-Z)'),
      passed: /[A-Z]/.test(pwd),
      required: policy.requireUppercase,
    },
    {
      key: 'lowercase',
      label: t('sifre_kurali_kucuk_harf', 'En az bir küçük harf (a-z)'),
      passed: /[a-z]/.test(pwd),
      required: policy.requireLowercase,
    },
    {
      key: 'digit',
      label: t('sifre_kurali_rakam', 'En az bir rakam (0-9)'),
      passed: /[0-9]/.test(pwd),
      required: policy.requireDigit,
    },
    {
      key: 'special',
      label: t('sifre_kurali_ozel_karakter', 'En az bir özel karakter (@$!%*?&._-)'),
      passed: /[^A-Za-z0-9]/.test(pwd),
      required: policy.requireSpecial,
    },
  ];

  const failedRequiredRules = rules.filter((r) => r.required && !r.passed);
  const isValid = pwd.length > 0 && failedRequiredRules.length === 0;

  return {
    isValid,
    rules,
    failedRequiredRules,
  };
};
