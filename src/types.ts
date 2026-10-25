/**
 * @akalin/company_module - Tip Tanımları (types.ts)
 */

export interface FirmaDTO {
  id: number;
  ad?: string;
  firmaAdi?: string;
  unvan?: string;
  kisaAd?: string;
  vergiDairesi?: string;
  vergiNo?: string;
  email?: string;
  telefon?: string;
  webSitesi?: string;
  durum?: string;
  aktifMi?: boolean;
  demoBitisTarihi?: string;
  lisansliMi?: boolean;
  lisansBitisTarihi?: string;
  sektorelSeedData?: any;
  faaliyetAlanlari?: number[];
  adres?: string;
  acikAdres?: string;
  ilId?: number;
  ilceId?: number;
  olusturulmaTarihi?: string;
  kullaniciSayisi?: number;
}

export interface FirmaKullaniciDTO {
  id: number | string;
  ad?: string;
  soyad?: string;
  adSoyad?: string;
  email: string;
  telefon?: string;
  aktifMi?: boolean;
  firmalar?: Array<{
    firmaId: number;
    firmaAdi: string;
    rol: string;
  }>;
}

export interface FirmaDavetDTO {
  id: number | string;
  firmaId: number;
  email: string;
  rol: string;
  durum?: 'Bekliyor' | 'KabulEdildi' | 'Iptal' | string;
  olusturulmaTarihi?: string;
  sonGecerlilikTarihi?: string;
}

export interface PasswordPolicyDTO {
  expiryDays: number;
  sessionTimeoutMinutes: number;
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
}

export interface FirmaPolicyDTO {
  davetExpiryHours: number;
  sifreSifirlamaExpiryMinutes: number;
  varsayilanRol: string;
  passwordPolicy: PasswordPolicyDTO;
}

export interface ICompanyServiceAdapter {
  getCompanies(params?: any): Promise<FirmaDTO[]>;
  getCompanyById(id: number | string): Promise<FirmaDTO>;
  createCompany(data: any): Promise<FirmaDTO>;
  updateCompany(id: number | string, data: any): Promise<FirmaDTO>;
  deleteCompany(id: number | string): Promise<void>;
  extendDemo(id: number | string, days: number): Promise<void>;
  convertToLicense(id: number | string): Promise<void>;
  checkEmailAvailable(email: string): Promise<boolean>;
  checkTaxNumberAvailable(taxNo: string): Promise<boolean>;
  getCompanyModules(id: number | string): Promise<any[]>;
  updateCompanyModules(id: number | string, modules: any[]): Promise<void>;
  getCompanyUsers(id: number | string): Promise<any[]>;
  getCompanyInvitations(id: number | string): Promise<FirmaDavetDTO[]>;
  sendInvitation(id: number | string, email: string, role: string): Promise<void>;
  cancelInvitation(id: number | string, davetId: number | string): Promise<void>;
  getSystemUsers(params?: any): Promise<any[]>;
  getSystemUserById(id: number | string): Promise<any>;
  createSystemUser(data: any): Promise<any>;
  updateSystemUser(id: number | string, data: any): Promise<any>;
  deleteSystemUser(id: number | string): Promise<void>;
  getPasswordPolicy(): Promise<PasswordPolicyDTO>;
  updatePasswordPolicy?(policy: Partial<PasswordPolicyDTO>): Promise<void>;
  getCompanyPolicies(): Promise<FirmaPolicyDTO>;
  updateCompanyPolicies(policies: Partial<FirmaPolicyDTO>): Promise<void>;
  getAvailableModules?(): Promise<any[]>;
  getSectors?(): Promise<any[]>;
  suspendCompany?(id: number | string, askidaMi: boolean, neden?: string): Promise<void>;
  resetCompany?(id: number | string): Promise<any>;
}

export interface CreateCompanyModuleOptions {
  id?: string;
  appName?: string;
  baseRoute?: string;
  usersRoute?: string;
  settingsRoute?: string;
  adapter?: ICompanyServiceAdapter;
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  order?: number;
  customComponents?: {
    ParaBirimleri?: React.ComponentType<any>;
    KdvAyarlari?: React.ComponentType<any>;
    Birimler?: React.ComponentType<any>;
    DepoForm?: React.ComponentType<any>;
  };
}
