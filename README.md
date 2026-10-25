# @akalin/company_module

Webakus ERP ekosistemi için bağımsız, yeniden kullanılabilir firma (tenant) yönetimi, kullanıcı davetleri, lisans/demo süreleri ve şirket politikaları modülüdür.

## Özellikler
- **Çift Modlu Firma Kartı (Dual-Mode)**:
  - Yeni Firma: `BaseWizardPage` ile adım adım tohumlama sihirbazı.
  - Firma Düzenleme: `BaseCardPage` ve `TabLayout` ile sekmeli kart mimarisi.
- **Yönetici ve Kullanıcılar**: Firma çalışanları listesi, kullanıcı davetiye modalı (`FirmaKullaniciDavetModal`) ve yetkilendirme.
- **Firma ve Şifre Politikaları**: Oturum zaman aşımı, şifre geçerlilik süresi, karmaşıklık kuralları ve davet geçerlilik saatleri yönetimi.
- **Adapter Mimarisi**: API ve veri erişimini `ICompanyServiceAdapter` ve `CompanyModuleProvider` ile monolitik bağımlılıklardan tamamen soyutlar.
- **@akalin/module_core Entegrasyonu**: `createCompanyModule()` fabrika fonksiyonu ile dinamik modül kaydı ve RBAC yetki matrisi.
