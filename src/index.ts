/**
 * @akalin/company_module - Ana Giriş Noktası (index.ts)
 * Firma Yönetimi ve Sistem Kullanıcıları bağımsız modül paketi.
 */

// Tipler
export * from './types';

// Modül Fabrikası ve Manifest
export { createCompanyModule, FirmaYonetimiModule, default } from './createCompanyModule';

// Adapter & Context
export {
  createRestCompanyAdapter,
  createLocalStorageCompanyAdapter,
  CompanyModuleContext,
  CompanyModuleProvider,
  useCompanyModule,
  setGlobalCompanyModuleConfig,
  type CompanyModuleContextValue
} from './adapters/CompanyServiceContext';

// Sayfalar
export { default as FirmalarPage, default as Firmalar } from './pages/Firmalar';
export { default as FirmaFormPage, default as FirmaForm } from './pages/FirmaForm';
export { default as FirmaKullanicilariPage, default as FirmaKullanicilari } from './pages/FirmaKullanicilari';
export { default as FirmaKullaniciFormPage, default as FirmaKullaniciForm } from './pages/FirmaKullaniciForm';
export { default as FirmaYonetimAyarlariPage, default as FirmaYonetimAyarlari } from './pages/FirmaYonetimAyarlari';

// Bileşenler
export { default as FirmaKullaniciDavetModal } from './components/FirmaKullaniciDavetModal';

// Varsayılan Veriler
export {
  DEFAULT_SAMPLE_COMPANIES,
  DEFAULT_SAMPLE_USERS,
  DEFAULT_SAMPLE_INVITATIONS,
  DEFAULT_COMPANY_POLICIES,
  DEFAULT_PASSWORD_POLICY,
  DEFAULT_SEKTOREL_SEED_DATA,
  DEFAULT_SEED_DATA,
  SYSTEM_CORE_MODULE_CODES,
  DEFAULT_CORE_MODULE_CODES,
  DEFAULT_SECTOR_MODULES_BY_PARENT_ID
} from './defaults/defaultCompanies';

// Doğrulayıcılar (Validators)
export {
  validateFirmaForm,
  validateFirmaStep1,
  validateFirmaFaaliyetAlanlari,
  validateFirmaStep4,
  validateFirmaDepolarVeSubeler,
  isDepoSubeAddressComplete,
  getDuplicateVergiNoError
} from './validators/firmaFormValidation';
export { validateFirmaKullanici } from './validators/firmaKullaniciValidation';
export { validateFirmaDavet } from './validators/firmaDavetValidation';
export { validateDavetKabul } from './validators/davetKabulValidation';
export { validateFirmaYonetimAyarlari, type FirmaYonetimAyarlariFormData } from './validators/firmaYonetimAyarlariValidation';

// Güvenlik ve Şifre Servisi
export {
  fetchActivePasswordPolicy,
  checkPasswordAgainstPolicy,
  DEFAULT_PASSWORD_POLICY as SERVICE_DEFAULT_PASSWORD_POLICY
} from './services/passwordPolicyService';

// Kancalar (Hooks)
export { useFirmaFormAutoFocus } from './hooks/firmaFormAutoFocus';

// Modül İkonları
export { MODULE_ICON_MAP, renderModuleIcon } from './constants/moduleIcons';
