/**
 * @akalin/company_module - Adapter ve Context Katmanı (CompanyServiceContext.tsx)
 * Firma ve sistem kullanıcıları API çağrılarını monolitik mimariden soyutlar.
 */

import React, { createContext, useContext } from 'react';
import axios from 'axios';
import {
  ICompanyServiceAdapter,
  FirmaDTO,
  FirmaKullaniciDTO,
  FirmaDavetDTO,
  PasswordPolicyDTO,
  FirmaPolicyDTO,
  CreateCompanyModuleOptions
} from '../types';
import {
  DEFAULT_SAMPLE_COMPANIES,
  DEFAULT_SAMPLE_USERS,
  DEFAULT_SAMPLE_INVITATIONS,
  DEFAULT_COMPANY_POLICIES,
  DEFAULT_PASSWORD_POLICY
} from '../defaults/defaultCompanies';

/**
 * REST API çağrıları için varsayılan HTTP istemcisi adapter'ı.
 */
export function createRestCompanyAdapter(client: any = axios): ICompanyServiceAdapter {
  return {
    async getCompanies(params?: any): Promise<FirmaDTO[]> {
      const res = await client.get('/api/Firma', { params });
      return res.data || [];
    },

    async getCompanyById(id: number | string): Promise<FirmaDTO> {
      const res = await client.get(`/api/Firma/${id}`);
      return res.data;
    },

    async createCompany(data: any): Promise<FirmaDTO> {
      const res = await client.post('/api/Firma', data);
      return res.data;
    },

    async updateCompany(id: number | string, data: any): Promise<FirmaDTO> {
      const res = await client.put(`/api/Firma/${id}`, data);
      return res.data;
    },

    async deleteCompany(id: number | string): Promise<void> {
      await client.delete(`/api/Firma/${id}`);
    },

    async extendDemo(id: number | string, days: number): Promise<void> {
      await client.put(`/api/Firma/${id}/sure-uzat`, { ekGunSayisi: Number(days) });
    },

    async convertToLicense(id: number | string): Promise<void> {
      await client.put(`/api/Firma/${id}/lisansa-gecir`);
    },

    async checkEmailAvailable(email: string): Promise<boolean> {
      try {
        const res = await client.get(`/api/Firma/check-email?email=${encodeURIComponent(email)}`);
        return Boolean(res.data?.available ?? true);
      } catch {
        return true;
      }
    },

    async checkTaxNumberAvailable(taxNo: string): Promise<boolean> {
      try {
        const res = await client.get(`/api/Firma/check-tax?taxNo=${encodeURIComponent(taxNo)}`);
        return Boolean(res.data?.available ?? true);
      } catch {
        return true;
      }
    },

    async getCompanyModules(id: number | string): Promise<any[]> {
      const res = await client.get(`/api/Firma/${id}/moduller`);
      return res.data || [];
    },

    async updateCompanyModules(id: number | string, modules: any[]): Promise<void> {
      await client.put(`/api/Firma/${id}/moduller`, modules);
    },

    async getCompanyUsers(id: number | string): Promise<any[]> {
      const res = await client.get(`/api/Firma/${id}/kullanicilar`);
      return res.data || [];
    },

    async getCompanyInvitations(id: number | string): Promise<FirmaDavetDTO[]> {
      const res = await client.get(`/api/Firma/${id}/davetler`);
      return res.data || [];
    },

    async sendInvitation(id: number | string, email: string, role: string): Promise<void> {
      await client.post(`/api/Firma/${id}/davet-gonder`, { email, rol: role });
    },

    async cancelInvitation(id: number | string, davetId: number | string): Promise<void> {
      await client.delete(`/api/Firma/${id}/davetler/${davetId}`);
    },

    async getSystemUsers(params?: any): Promise<any[]> {
      const res = await client.get('/api/Auth/sistem-kullanicilari', { params });
      return res.data || [];
    },

    async getSystemUserById(id: number | string): Promise<any> {
      const res = await client.get(`/api/Auth/sistem-kullanicilari/${id}`);
      return res.data;
    },

    async createSystemUser(data: any): Promise<any> {
      const res = await client.post('/api/Auth/sistem-kullanicilari', data);
      return res.data;
    },

    async updateSystemUser(id: number | string, data: any): Promise<any> {
      const res = await client.put(`/api/Auth/sistem-kullanicilari/${id}`, data);
      return res.data;
    },

    async deleteSystemUser(id: number | string): Promise<void> {
      await client.delete(`/api/Auth/sistem-kullanicilari/${id}`);
    },

    async getPasswordPolicy(): Promise<PasswordPolicyDTO> {
      try {
        const [expiryRes, sessionRes, minLenRes, upperRes, lowerRes, digitRes, specialRes] = await Promise.all([
          client.get('/api/EntegrasyonAyarlari/by-key/PASSWORD_EXPIRY_DAYS', { skipErrorToast: true } as any).catch(() => ({ data: null })),
          client.get('/api/EntegrasyonAyarlari/by-key/SESSION_TIMEOUT_MINUTES', { skipErrorToast: true } as any).catch(() => ({ data: null })),
          client.get('/api/EntegrasyonAyarlari/by-key/PASSWORD_MIN_LENGTH', { skipErrorToast: true } as any).catch(() => ({ data: null })),
          client.get('/api/EntegrasyonAyarlari/by-key/PASSWORD_REQUIRE_UPPERCASE', { skipErrorToast: true } as any).catch(() => ({ data: null })),
          client.get('/api/EntegrasyonAyarlari/by-key/PASSWORD_REQUIRE_LOWERCASE', { skipErrorToast: true } as any).catch(() => ({ data: null })),
          client.get('/api/EntegrasyonAyarlari/by-key/PASSWORD_REQUIRE_DIGIT', { skipErrorToast: true } as any).catch(() => ({ data: null })),
          client.get('/api/EntegrasyonAyarlari/by-key/PASSWORD_REQUIRE_SPECIAL', { skipErrorToast: true } as any).catch(() => ({ data: null }))
        ]);

        return {
          expiryDays: expiryRes.data?.deger ? Number(expiryRes.data.deger) : DEFAULT_PASSWORD_POLICY.expiryDays,
          sessionTimeoutMinutes: sessionRes.data?.deger ? Number(sessionRes.data.deger) : DEFAULT_PASSWORD_POLICY.sessionTimeoutMinutes,
          minLength: minLenRes.data?.deger ? Number(minLenRes.data.deger) : DEFAULT_PASSWORD_POLICY.minLength,
          requireUppercase: upperRes.data?.deger != null ? upperRes.data.deger === 'true' : DEFAULT_PASSWORD_POLICY.requireUppercase,
          requireLowercase: lowerRes.data?.deger != null ? lowerRes.data.deger === 'true' : DEFAULT_PASSWORD_POLICY.requireLowercase,
          requireDigit: digitRes.data?.deger != null ? digitRes.data.deger === 'true' : DEFAULT_PASSWORD_POLICY.requireDigit,
          requireSpecial: specialRes.data?.deger != null ? specialRes.data.deger === 'true' : DEFAULT_PASSWORD_POLICY.requireSpecial
        };
      } catch {
        return DEFAULT_PASSWORD_POLICY;
      }
    },

    async getCompanyPolicies(): Promise<FirmaPolicyDTO> {
      try {
        const [davetRes, sifreRes, rolRes] = await Promise.all([
          client.get('/api/EntegrasyonAyarlari/by-key/FIRMA_DAVET_EXPIRY_HOURS', { skipErrorToast: true } as any).catch(() => ({ data: null })),
          client.get('/api/EntegrasyonAyarlari/by-key/FIRMA_SIFRE_SIFIRLAMA_EXPIRY_MINUTES', { skipErrorToast: true } as any).catch(() => ({ data: null })),
          client.get('/api/EntegrasyonAyarlari/by-key/FIRMA_VARSAYILAN_KULLANICI_ROLU', { skipErrorToast: true } as any).catch(() => ({ data: null }))
        ]);

        const passwordPolicy = await this.getPasswordPolicy();

        return {
          davetExpiryHours: davetRes.data?.deger ? Number(davetRes.data.deger) : 48,
          sifreSifirlamaExpiryMinutes: sifreRes.data?.deger ? Number(sifreRes.data.deger) : 60,
          varsayilanRol: rolRes.data?.deger || 'Kullanıcı',
          passwordPolicy
        };
      } catch {
        return DEFAULT_COMPANY_POLICIES;
      }
    },

    async updateCompanyPolicies(policies: Partial<FirmaPolicyDTO>): Promise<void> {
      const calls: Promise<any>[] = [];

      if (policies.davetExpiryHours != null) {
        calls.push(client.post('/api/EntegrasyonAyarlari/by-key/FIRMA_DAVET_EXPIRY_HOURS', {
          deger: String(policies.davetExpiryHours),
          aciklama: 'Kullanıcı Davet E-postası Geçerlilik Süresi (Saat)'
        }));
      }

      if (policies.sifreSifirlamaExpiryMinutes != null) {
        calls.push(client.post('/api/EntegrasyonAyarlari/by-key/FIRMA_SIFRE_SIFIRLAMA_EXPIRY_MINUTES', {
          deger: String(policies.sifreSifirlamaExpiryMinutes),
          aciklama: 'Şifre Sıfırlama E-postası Geçerlilik Süresi (Dakika)'
        }));
      }

      if (policies.varsayilanRol != null) {
        calls.push(client.post('/api/EntegrasyonAyarlari/by-key/FIRMA_VARSAYILAN_KULLANICI_ROLU', {
          deger: String(policies.varsayilanRol),
          aciklama: 'Firma Kullanıcı Davetlerinde Varsayılan Rol'
        }));
      }

      const pp = policies.passwordPolicy;
      if (pp) {
        if (pp.expiryDays != null) {
          calls.push(client.post('/api/EntegrasyonAyarlari/by-key/PASSWORD_EXPIRY_DAYS', {
            deger: String(pp.expiryDays),
            aciklama: 'Şifre Geçerlilik Süresi (Gün)'
          }));
        }
        if (pp.sessionTimeoutMinutes != null) {
          calls.push(client.post('/api/EntegrasyonAyarlari/by-key/SESSION_TIMEOUT_MINUTES', {
            deger: String(pp.sessionTimeoutMinutes),
            aciklama: 'Oturum Zaman Aşımı Süresi (Dakika)'
          }));
        }
        if (pp.minLength != null) {
          calls.push(client.post('/api/EntegrasyonAyarlari/by-key/PASSWORD_MIN_LENGTH', {
            deger: String(pp.minLength),
            aciklama: 'Minimum Şifre Uzunluğu'
          }));
          calls.push(client.post('/api/EntegrasyonAyarlari/by-key/SECURITY_MIN_PWD_LEN', {
            deger: String(pp.minLength),
            aciklama: 'Min Şifre Uzunluğu (Sistem Senkronu)'
          }));
        }
        if (pp.requireUppercase != null) {
          calls.push(client.post('/api/EntegrasyonAyarlari/by-key/PASSWORD_REQUIRE_UPPERCASE', {
            deger: pp.requireUppercase ? 'true' : 'false',
            aciklama: 'Şifrede Büyük Harf Zorunlu mu?'
          }));
        }
        if (pp.requireLowercase != null) {
          calls.push(client.post('/api/EntegrasyonAyarlari/by-key/PASSWORD_REQUIRE_LOWERCASE', {
            deger: pp.requireLowercase ? 'true' : 'false',
            aciklama: 'Şifrede Küçük Harf Zorunlu mu?'
          }));
        }
        if (pp.requireDigit != null) {
          calls.push(client.post('/api/EntegrasyonAyarlari/by-key/PASSWORD_REQUIRE_DIGIT', {
            deger: pp.requireDigit ? 'true' : 'false',
            aciklama: 'Şifrede Rakam Zorunlu mu?'
          }));
        }
        if (pp.requireSpecial != null) {
          calls.push(client.post('/api/EntegrasyonAyarlari/by-key/PASSWORD_REQUIRE_SPECIAL', {
            deger: pp.requireSpecial ? 'true' : 'false',
            aciklama: 'Şifrede Özel Karakter Zorunlu mu?'
          }));
        }
      }

      await Promise.all(calls);
    },

    async getAvailableModules(): Promise<any[]> {
      const res = await client.get('/api/Moduller');
      return res.data || [];
    },

    async getSectors(): Promise<any[]> {
      const res = await client.get('/api/FaaliyetAlani/admin');
      return res.data || [];
    },

    async suspendCompany(id: number | string, askidaMi: boolean, neden?: string): Promise<void> {
      await client.put(`/api/Firma/${id}/suspend`, { askidaMi, neden: neden || null });
    },

    async resetCompany(id: number | string): Promise<any> {
      const res = await client.post(`/api/Firma/${id}/reset`);
      return res.data;
    }
  };
}

/**
 * Bağımsız yerel test ve demo amacıyla LocalStorage tabanlı adapter.
 */
export function createLocalStorageCompanyAdapter(): ICompanyServiceAdapter {
  const STORAGE_KEY = 'akalin_company_module_data';
  const USERS_KEY = 'akalin_company_users_data';
  const INVITATIONS_KEY = 'akalin_company_invitations_data';

  const getCompaniesFromStorage = (): FirmaDTO[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_SAMPLE_COMPANIES;
    } catch {
      return DEFAULT_SAMPLE_COMPANIES;
    }
  };

  const saveCompanies = (companies: FirmaDTO[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    } catch {}
  };

  const getUsersFromStorage = (): FirmaKullaniciDTO[] => {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : DEFAULT_SAMPLE_USERS;
    } catch {
      return DEFAULT_SAMPLE_USERS;
    }
  };

  const saveUsers = (users: FirmaKullaniciDTO[]) => {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {}
  };

  return {
    async getCompanies(): Promise<FirmaDTO[]> {
      return getCompaniesFromStorage();
    },

    async getCompanyById(id: number | string): Promise<FirmaDTO> {
      const list = getCompaniesFromStorage();
      const item = list.find((c) => String(c.id) === String(id));
      if (!item) throw new Error('Firma bulunamadı.');
      return item;
    },

    async createCompany(data: any): Promise<FirmaDTO> {
      const list = getCompaniesFromStorage();
      const newCompany: FirmaDTO = {
        ...data,
        id: Date.now(),
        olusturulmaTarihi: new Date().toISOString()
      };
      list.push(newCompany);
      saveCompanies(list);
      return newCompany;
    },

    async updateCompany(id: number | string, data: any): Promise<FirmaDTO> {
      const list = getCompaniesFromStorage();
      const index = list.findIndex((c) => String(c.id) === String(id));
      if (index === -1) throw new Error('Firma bulunamadı.');
      list[index] = { ...list[index], ...data };
      saveCompanies(list);
      return list[index];
    },

    async deleteCompany(id: number | string): Promise<void> {
      const list = getCompaniesFromStorage();
      const updated = list.filter((c) => String(c.id) !== String(id));
      saveCompanies(updated);
    },

    async extendDemo(id: number | string, days: number): Promise<void> {
      const list = getCompaniesFromStorage();
      const item = list.find((c) => String(c.id) === String(id));
      if (item) {
        const current = item.demoBitisTarihi ? new Date(item.demoBitisTarihi) : new Date();
        current.setDate(current.getDate() + Number(days));
        item.demoBitisTarihi = current.toISOString();
        saveCompanies(list);
      }
    },

    async convertToLicense(id: number | string): Promise<void> {
      const list = getCompaniesFromStorage();
      const item = list.find((c) => String(c.id) === String(id));
      if (item) {
        item.lisansliMi = true;
        item.durum = 'Aktif';
        saveCompanies(list);
      }
    },

    async checkEmailAvailable(): Promise<boolean> {
      return true;
    },

    async checkTaxNumberAvailable(): Promise<boolean> {
      return true;
    },

    async getCompanyModules(): Promise<any[]> {
      return [];
    },

    async updateCompanyModules(): Promise<void> {},

    async getCompanyUsers(id: number | string): Promise<any[]> {
      const users = getUsersFromStorage();
      return users.filter(u => u.firmalar?.some(f => String(f.firmaId) === String(id)));
    },

    async getCompanyInvitations(): Promise<FirmaDavetDTO[]> {
      try {
        const data = localStorage.getItem(INVITATIONS_KEY);
        return data ? JSON.parse(data) : DEFAULT_SAMPLE_INVITATIONS;
      } catch {
        return DEFAULT_SAMPLE_INVITATIONS;
      }
    },

    async sendInvitation(id: number | string, email: string, role: string): Promise<void> {
      const data = localStorage.getItem(INVITATIONS_KEY);
      const list: FirmaDavetDTO[] = data ? JSON.parse(data) : DEFAULT_SAMPLE_INVITATIONS;
      list.push({
        id: Date.now(),
        firmaId: Number(id),
        email,
        rol: role,
        durum: 'Bekliyor',
        olusturulmaTarihi: new Date().toISOString()
      });
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(list));
    },

    async cancelInvitation(id: number | string, davetId: number | string): Promise<void> {
      const data = localStorage.getItem(INVITATIONS_KEY);
      const list: FirmaDavetDTO[] = data ? JSON.parse(data) : DEFAULT_SAMPLE_INVITATIONS;
      const updated = list.filter(i => String(i.id) !== String(davetId));
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(updated));
    },

    async getSystemUsers(): Promise<any[]> {
      return getUsersFromStorage();
    },

    async getSystemUserById(id: number | string): Promise<any> {
      const users = getUsersFromStorage();
      const user = users.find(u => String(u.id) === String(id));
      if (!user) throw new Error('Kullanıcı bulunamadı.');
      return user;
    },

    async createSystemUser(data: any): Promise<any> {
      const users = getUsersFromStorage();
      const newUser = { ...data, id: Date.now() };
      users.push(newUser);
      saveUsers(users);
      return newUser;
    },

    async updateSystemUser(id: number | string, data: any): Promise<any> {
      const users = getUsersFromStorage();
      const idx = users.findIndex(u => String(u.id) === String(id));
      if (idx === -1) throw new Error('Kullanıcı bulunamadı.');
      users[idx] = { ...users[idx], ...data };
      saveUsers(users);
      return users[idx];
    },

    async deleteSystemUser(id: number | string): Promise<void> {
      const users = getUsersFromStorage();
      const updated = users.filter(u => String(u.id) !== String(id));
      saveUsers(updated);
    },

    async getPasswordPolicy(): Promise<PasswordPolicyDTO> {
      return DEFAULT_PASSWORD_POLICY;
    },

    async getCompanyPolicies(): Promise<FirmaPolicyDTO> {
      return DEFAULT_COMPANY_POLICIES;
    },

    async updateCompanyPolicies(): Promise<void> {},

    async getAvailableModules(): Promise<any[]> {
      return [];
    },

    async getSectors(): Promise<any[]> {
      return [];
    },

    async suspendCompany(id: number | string, askidaMi: boolean): Promise<void> {
      const list = getCompaniesFromStorage();
      const item = list.find(c => String(c.id) === String(id));
      if (item) {
        item.aktifMi = !askidaMi;
        saveCompanies(list);
      }
    },

    async resetCompany(): Promise<any> {
      return { success: true, mesaj: 'Firma veritabanı sıfırlandı.' };
    }
  };
}

export interface CompanyModuleContextValue {
  adapter: ICompanyServiceAdapter;
  customComponents?: CreateCompanyModuleOptions['customComponents'];
  setSearchPlaceholder?: (text: string) => void;
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

let globalCompanyModuleConfig: CompanyModuleContextValue = {
  adapter: createRestCompanyAdapter(),
  setSearchPlaceholder: () => {}
};

export function setGlobalCompanyModuleConfig(config: Partial<CompanyModuleContextValue>): void {
  globalCompanyModuleConfig = { ...globalCompanyModuleConfig, ...config };
}

export const CompanyModuleContext = createContext<CompanyModuleContextValue>(globalCompanyModuleConfig);

export const CompanyModuleProvider: React.FC<{
  value?: Partial<CompanyModuleContextValue>;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const mergedValue: CompanyModuleContextValue = {
    ...globalCompanyModuleConfig,
    ...value,
    adapter: value?.adapter || globalCompanyModuleConfig.adapter || createRestCompanyAdapter()
  };

  return (
    <CompanyModuleContext.Provider value={mergedValue}>
      {children}
    </CompanyModuleContext.Provider>
  );
};

export function useCompanyModule(): CompanyModuleContextValue {
  const ctx = useContext(CompanyModuleContext);
  return ctx || globalCompanyModuleConfig;
}
