/**
 * @akalin/company_module - Modül Tanım Fabrikası (createCompanyModule.tsx)
 * @akalin/module_core (IModuleDefinition) ile tam uyumlu Firma Yönetimi Modülü üretir.
 */

import React, { lazy } from 'react';
import { Building, UserCog, Settings2 } from 'lucide-react';
import type { IModuleDefinition } from '@akalin/module_core';
import { CreateCompanyModuleOptions } from './types';
import {
  createRestCompanyAdapter,
  setGlobalCompanyModuleConfig,
  CompanyModuleProvider
} from './adapters/CompanyServiceContext';

const FirmalarPage = lazy(() => import('./pages/Firmalar'));
const FirmaKullanicilariPage = lazy(() => import('./pages/FirmaKullanicilari'));
const FirmaYonetimAyarlariPage = lazy(() => import('./pages/FirmaYonetimAyarlari'));

export function createCompanyModule(options: CreateCompanyModuleOptions = {}): IModuleDefinition {
  const adapter = options.adapter || createRestCompanyAdapter();

  setGlobalCompanyModuleConfig({
    adapter,
    customComponents: options.customComponents,
    onNotify: options.onNotify
  });

  const baseRoute = (options.baseRoute || '/firmalar').replace(/\/$/, '');
  const usersRoute = (options.usersRoute || '/firma-kullanicilari').replace(/\/$/, '');
  const settingsRoute = (options.settingsRoute || '/ayarlar/firma').replace(/\/$/, '');

  const ConnectedFirmalarPage: React.FC<any> = (props) => (
    <CompanyModuleProvider value={{ adapter, customComponents: options.customComponents, onNotify: options.onNotify }}>
      <FirmalarPage {...props} />
    </CompanyModuleProvider>
  );

  const ConnectedFirmaKullanicilariPage: React.FC<any> = (props) => (
    <CompanyModuleProvider value={{ adapter, customComponents: options.customComponents, onNotify: options.onNotify }}>
      <FirmaKullanicilariPage {...props} />
    </CompanyModuleProvider>
  );

  const ConnectedFirmaYonetimAyarlariPage: React.FC<any> = (props) => (
    <CompanyModuleProvider value={{ adapter, customComponents: options.customComponents, onNotify: options.onNotify }}>
      <FirmaYonetimAyarlariPage {...props} />
    </CompanyModuleProvider>
  );

  return {
    id: options.id || 'firma_yonetimi',
    title: 'Firma Yönetimi',
    name: 'Firma Yönetimi',
    description: 'Sistemdeki firmaların (tenant), kullanıcıların ve güvenlik politikalarının yönetimi.',
    icon: React.createElement(Building, { size: 20 }),
    iconName: 'Building',
    order: options.order ?? 20,
    permissionPrefix: 'firma',
    routes: [
      {
        path: baseRoute,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Firmalar'
      },
      {
        path: `${baseRoute}/yeni/adres`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Adres Belirle'
      },
      {
        path: `${baseRoute}/yeni/para-birimleri`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Para Birimleri Yapılandırması'
      },
      {
        path: `${baseRoute}/yeni/vergi-kdv`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Vergi ve KDV Ayarları'
      },
      {
        path: `${baseRoute}/yeni/birimler`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Ölçü Birimleri Yapılandırması'
      },
      {
        path: `${baseRoute}/yeni/modul-ayarlari/:modulKod`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Modül Ayarları'
      },
      {
        path: `${baseRoute}/yeni`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Yeni Firma'
      },
      {
        path: `${baseRoute}/duzenle/:id/adres`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Adres Belirle'
      },
      {
        path: `${baseRoute}/duzenle/:id/para-birimleri`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Para Birimleri Yapılandırması'
      },
      {
        path: `${baseRoute}/duzenle/:id/vergi-kdv`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Vergi ve KDV Ayarları'
      },
      {
        path: `${baseRoute}/duzenle/:id/birimler`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Ölçü Birimleri Yapılandırması'
      },
      {
        path: `${baseRoute}/duzenle/:id/modul-ayarlari/:modulKod`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Modül Ayarları'
      },
      {
        path: `${baseRoute}/duzenle/:id`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Firma Düzenle'
      },
      {
        path: `${baseRoute}/:id/adres`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Adres Belirle'
      },
      {
        path: `${baseRoute}/:id/para-birimleri`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Para Birimleri Yapılandırması'
      },
      {
        path: `${baseRoute}/:id/vergi-kdv`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Vergi ve KDV Ayarları'
      },
      {
        path: `${baseRoute}/:id/birimler`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Ölçü Birimleri Yapılandırması'
      },
      {
        path: `${baseRoute}/:id/modul-ayarlari/:modulKod`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Modül Ayarları'
      },
      {
        path: `${baseRoute}/:id`,
        element: React.createElement(ConnectedFirmalarPage),
        title: 'Firma Düzenle'
      },
      {
        path: usersRoute,
        element: React.createElement(ConnectedFirmaKullanicilariPage),
        title: 'Yönetici ve Kullanıcılar'
      },
      {
        path: `${usersRoute}/yeni`,
        element: React.createElement(ConnectedFirmaKullanicilariPage),
        title: 'Yeni Kullanıcı'
      },
      {
        path: `${usersRoute}/duzenle/:id`,
        element: React.createElement(ConnectedFirmaKullanicilariPage),
        title: 'Kullanıcı Düzenle'
      },
      {
        path: `${usersRoute}/:id`,
        element: React.createElement(ConnectedFirmaKullanicilariPage),
        title: 'Kullanıcı Düzenle'
      },
      {
        path: settingsRoute,
        element: React.createElement(ConnectedFirmaYonetimAyarlariPage),
        title: 'Firma Yönetimi Ayarları'
      }
    ],
    menuItems: [
      {
        id: 'menu_firma_yonetimi',
        label: 'Firma Yönetimi',
        icon: React.createElement(Building, { size: 20 }),
        isDropdown: true,
        order: options.order ?? 20
      },
      {
        id: 'menu_firmalar',
        parentId: 'menu_firma_yonetimi',
        label: 'Firmalar',
        path: baseRoute,
        icon: React.createElement(Building, { size: 16 }),
        order: 10
      },
      {
        id: 'menu_firma_kullanicilari',
        parentId: 'menu_firma_yonetimi',
        label: 'Yönetici ve Kullanıcılar',
        path: usersRoute,
        icon: React.createElement(UserCog, { size: 16 }),
        order: 20
      }
    ],
    settingsModules: [
      {
        id: 'firma_yonetim_ayarlari',
        name: 'Firma Yönetimi Ayarları',
        desc: 'Kullanıcı davetleri, oturum ve şifre güvenlik politikalarını yönetin.',
        icon: React.createElement(Settings2, { size: 28 }),
        order: 10,
        hasOwnLayout: true,
        component: ConnectedFirmaYonetimAyarlariPage
      }
    ],
    cards: [
      {
        id: 'firmalar',
        category: 'kart',
        titleKey: 'Firmalar',
        route: baseRoute
      },
      {
        id: 'firma_kullanicilari',
        category: 'kart',
        titleKey: 'Yönetici ve Kullanıcılar',
        route: usersRoute
      },
      {
        id: 'firma_ayarlari',
        category: 'kart',
        titleKey: 'Firma ve Güvenlik Politikaları',
        route: settingsRoute
      }
    ],
    permissions: [
      {
        key: 'firma.read',
        name: 'Firmaları Görüntüleme',
        description: 'Sistemdeki firmaları listeleme',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma.create',
        name: 'Yeni Firma Oluşturma',
        description: 'Yeni firma ve demo kaydı açma',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma.update',
        name: 'Firma Düzenleme',
        description: 'Firma bilgilerini ve ayarlarını güncelleme',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma.delete',
        name: 'Firma Silme',
        description: 'Firmayı sistemden silme',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma.license',
        name: 'Lisans ve Demo Süresi',
        description: 'Demo süresini uzatma ve lisansa geçirme',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma.suspend',
        name: 'Firma Askıya Alma',
        description: 'Firmayı askıya alma veya aktif etme',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma_user.read',
        name: 'Kullanıcıları Görüntüleme',
        description: 'Kullanıcıları listeleme',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma_user.create',
        name: 'Kullanıcı Ekleme',
        description: 'Yeni kullanıcı ekleme ve davet gönderme',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma_user.update',
        name: 'Kullanıcı Düzenleme',
        description: 'Kullanıcı bilgilerini güncelleme',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma_user.delete',
        name: 'Kullanıcı Silme',
        description: 'Kullanıcıyı silme',
        group: 'Firma Yönetimi'
      },
      {
        key: 'firma_settings.manage',
        name: 'Firma Ayarları',
        description: 'Firma yönetim ve şifre politikalarını yapılandırma',
        group: 'Firma Yönetimi'
      }
    ]
  };
}

export const FirmaYonetimiModule = createCompanyModule();
export default createCompanyModule;
