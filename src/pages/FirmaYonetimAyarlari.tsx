/**
 * @akalin/company_module - Firma Yönetimi Ayarları (FirmaYonetimAyarlari.tsx)
 * Sistem & Tanımlar -> Genel Ayarlar altında çalışan firma yönetim ayarları bileşeni.
 * Kullanıcı davetleri, şifre sıfırlama, oturum zaman aşımı ve şifre karmaşıklık politikalarını yönetir.
 * BaseCardPage ve BaseCard'dan türetilen PolicySettingCard bileşenleri ile kart mimarisine tam uyumlu olarak çalışır.
 * Tüm ayar öğeleri PolicySettingCard içinde sunulur ve yatay olarak tam genişlikte yayılır.
 */

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Building, Clock, Mail, Users, KeyRound, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { 
  BaseCardPage, 
  BasitInput, 
  BaseSwitch,
  PolicySettingCard,
  useAdminValidation, 
  type BaseTabItem 
} from '@akalin/ui';
import { 
  validateFirmaYonetimAyarlari, 
  FirmaYonetimAyarlariFormData 
} from '../validators/firmaYonetimAyarlariValidation';
import { useCompanyModule } from '../adapters/CompanyServiceContext';

export default function FirmaYonetimAyarlari() {
  const { t } = useTranslation();
  const { adapter } = useCompanyModule();
  const { errors, clearError, validate } = useAdminValidation();

  const [formData, setFormData] = useState<FirmaYonetimAyarlariFormData>({
    davetExpiryHours: 48,
    sifreSifirlamaExpiryMinutes: 60,
    varsayilanRol: 'Kullanıcı',
    sifreGecerlilikGunu: 90,
    oturumZamanAsimiDk: 30,
    minSifreUzunlugu: 8,
    buyukHarfZorunlu: true,
    kucukHarfZorunlu: true,
    rakamZorunlu: true,
    ozelKarakterZorunlu: false
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>('eposta_ve_davet');

  useEffect(() => {
    fetchAyarlar();
  }, []);

  const fetchAyarlar = async () => {
    try {
      setLoading(true);
      const policies = await adapter.getCompanyPolicies();
      const pp = policies.passwordPolicy || {} as any;

      setFormData({
        davetExpiryHours: policies.davetExpiryHours ?? 48,
        sifreSifirlamaExpiryMinutes: policies.sifreSifirlamaExpiryMinutes ?? 60,
        varsayilanRol: policies.varsayilanRol || 'Kullanıcı',
        sifreGecerlilikGunu: pp.expiryDays ?? 90,
        oturumZamanAsimiDk: pp.sessionTimeoutMinutes ?? 30,
        minSifreUzunlugu: pp.minLength ?? 8,
        buyukHarfZorunlu: pp.requireUppercase ?? true,
        kucukHarfZorunlu: pp.requireLowercase ?? true,
        rakamZorunlu: pp.requireDigit ?? true,
        ozelKarakterZorunlu: pp.requireSpecial ?? false
      });
    } catch (err) {
      console.error('Firma ayarları yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FirmaYonetimAyarlariFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    const isValid = validate(validateFirmaYonetimAyarlari, formData);
    if (!isValid) {
      toast.error(t('lutfen_zorunlu_alanlari_kontrol_ediniz', 'Lütfen formdaki hataları kontrol ediniz.'));
      return;
    }

    try {
      setSaving(true);
      await adapter.updateCompanyPolicies({
        davetExpiryHours: Number(formData.davetExpiryHours),
        sifreSifirlamaExpiryMinutes: Number(formData.sifreSifirlamaExpiryMinutes),
        varsayilanRol: formData.varsayilanRol,
        passwordPolicy: {
          expiryDays: Number(formData.sifreGecerlilikGunu ?? 90),
          sessionTimeoutMinutes: Number(formData.oturumZamanAsimiDk ?? 30),
          minLength: Number(formData.minSifreUzunlugu ?? 8),
          requireUppercase: Boolean(formData.buyukHarfZorunlu),
          requireLowercase: Boolean(formData.kucukHarfZorunlu),
          requireDigit: Boolean(formData.rakamZorunlu),
          requireSpecial: Boolean(formData.ozelKarakterZorunlu)
        }
      });

      toast.success(t('firma_yonetim_ayarlari_kaydedildi', 'Firma yönetim ayarları ve güvenlik politikaları başarıyla kaydedildi.'));
    } catch (err: any) {
      toast.error(err.response?.data?.mesaj || err.message || t('ayarlar_kaydedilemedi', 'Ayarlar kaydedilirken hata oluştu.'));
    } finally {
      setSaving(false);
    }
  };

  const tabs: BaseTabItem[] = useMemo(() => [
    {
      id: 'eposta_ve_davet',
      label: t('eposta_ve_davet_sureleri', 'E-Posta & Davet Süreleri'),
      icon: <Mail size={16} />,
      content: (
        <div className="flex-col gap-24 w-full pt-16">
          <div className="policy-section-group">
            <div className="policy-section-title">
              <Mail size={16} />
              <span>{t('davet_ve_eposta_ayarlari', 'Kullanıcı Davet ve Bildirim Süreleri')}</span>
            </div>

            {/* Davet E-Postası Süresi */}
            <PolicySettingCard
              icon={<Mail size={18} />}
              title={t('davet_eposta_gecerlilik_suresi_saat', 'Davet E-Postası Geçerlilik Süresi (Saat)')}
              description={t('davet_suresi_ipucu', 'Kullanıcıya gönderilen davet bağlantısının geçerli kalacağı süre (Önerilen: 48 saat)')}
              error={errors.davetExpiryHours}
              action={
                <div className="policy-input-container">
                  <BasitInput
                    type="number"
                    className="policy-number-input"
                    value={formData.davetExpiryHours}
                    onChange={(e: any) => handleChange('davetExpiryHours', e.target.value)}
                    placeholder="48"
                  />
                  <span className="policy-unit-text">{t('birim_saat', 'Saat')}</span>
                </div>
              }
            />

            {/* Şifre Sıfırlama Süresi */}
            <PolicySettingCard
              icon={<Clock size={18} />}
              title={t('sifre_sifirlama_gecerlilik_suresi_dakika', 'Şifre Sıfırlama Geçerlilik Süresi (Dakika)')}
              description={t('sifre_suresi_ipucu', 'Şifre yenileme bağlantısının geçerlilik süresi (Önerilen: 60 dakika)')}
              error={errors.sifreSifirlamaExpiryMinutes}
              action={
                <div className="policy-input-container">
                  <BasitInput
                    type="number"
                    className="policy-number-input"
                    value={formData.sifreSifirlamaExpiryMinutes}
                    onChange={(e: any) => handleChange('sifreSifirlamaExpiryMinutes', e.target.value)}
                    placeholder="60"
                  />
                  <span className="policy-unit-text">{t('birim_dakika', 'Dk')}</span>
                </div>
              }
            />

            {/* Varsayılan Kullanıcı Rolü */}
            <PolicySettingCard
              icon={<Users size={18} />}
              title={t('varsayilan_davet_rolu', 'Varsayılan Davet Rolü')}
              description={t('varsayilan_davet_rolu_ipucu', 'Yeni kullanıcı davet modalı açıldığında seçili gelecek rol')}
              error={errors.varsayilanRol}
              action={
                <select
                  className="form-input policy-select-input"
                  value={formData.varsayilanRol}
                  onChange={(e) => handleChange('varsayilanRol', e.target.value)}
                >
                  <option value="Kullanıcı">{t('rol_kullanici', 'Kullanıcı')}</option>
                  <option value="Yönetici">{t('rol_yonetici', 'Yönetici')}</option>
                  <option value="Admin">{t('rol_admin', 'Admin')}</option>
                </select>
              }
            />
          </div>
        </div>
      )
    },
    {
      id: 'sifre_politikasi',
      label: t('sifre_ve_guvenlik_politikasi', 'Şifre & Güvenlik Politikaları'),
      icon: <KeyRound size={16} />,
      content: (
        <div className="flex-col gap-24 w-full pt-16">
          {/* Bölüm 1: Süre ve Oturum Politikaları */}
          <div className="policy-section-group">
            <div className="policy-section-title">
              <Clock size={16} />
              <span>{t('sure_ve_oturum_politikalari', 'Süre ve Oturum Politikaları')}</span>
            </div>

            {/* Şifre Geçerlilik Süresi */}
            <PolicySettingCard
              icon={<KeyRound size={18} />}
              title={t('sifre_gecerlilik_suresi_gun', 'Şifre Geçerlilik Süresi (Gün)')}
              description={t('sifre_gecerlilik_ipucu', '0 girilirse şifre süresiz geçerli kalır (Önerilen: 90 gün)')}
              error={errors.sifreGecerlilikGunu}
              action={
                <div className="policy-input-container">
                  <BasitInput
                    type="number"
                    className="policy-number-input"
                    value={formData.sifreGecerlilikGunu}
                    onChange={(e: any) => handleChange('sifreGecerlilikGunu', e.target.value)}
                    placeholder="90"
                  />
                  <span className="policy-unit-text">{t('birim_gun', 'Gün')}</span>
                </div>
              }
            />

            {/* Oturum Zaman Aşımı Süresi */}
            <PolicySettingCard
              icon={<ShieldCheck size={18} />}
              title={t('oturum_zaman_asimi_dakika', 'Oturum Zaman Aşımı (Dakika)')}
              description={t('oturum_zaman_asimi_ipucu', 'Hareketsizlik halinde oturumun sonlandırılacağı süre (Önerilen: 30 dakika)')}
              error={errors.oturumZamanAsimiDk}
              action={
                <div className="policy-input-container">
                  <BasitInput
                    type="number"
                    className="policy-number-input"
                    value={formData.oturumZamanAsimiDk}
                    onChange={(e: any) => handleChange('oturumZamanAsimiDk', e.target.value)}
                    placeholder="30"
                  />
                  <span className="policy-unit-text">{t('birim_dakika', 'Dk')}</span>
                </div>
              }
            />
          </div>

          {/* Bölüm 2: Şifre Karmaşıklık Kuralları */}
          <div className="policy-section-group">
            <div className="policy-section-title">
              <Lock size={16} />
              <span>{t('sifre_karmasiklik_kurallari', 'Şifre Karmaşıklık ve Güvenlik Kuralları')}</span>
            </div>

            {/* Minimum Şifre Uzunluğu */}
            <PolicySettingCard
              icon={<CheckCircle2 size={18} />}
              title={t('minimum_sifre_uzunlugu', 'Minimum Şifre Uzunluğu')}
              description={t('min_sifre_uzunlugu_ipucu', 'Kullanıcıların belirleyebileceği en kısa şifre uzunluğu (En az 6, önerilen: 8)')}
              error={errors.minSifreUzunlugu}
              action={
                <div className="policy-input-container">
                  <BasitInput
                    type="number"
                    className="policy-number-input"
                    value={formData.minSifreUzunlugu}
                    onChange={(e: any) => handleChange('minSifreUzunlugu', e.target.value)}
                    placeholder="8"
                  />
                  <span className="policy-unit-text">{t('birim_karakter', 'Krk')}</span>
                </div>
              }
            />

            {/* Büyük Harf Kuralı */}
            <PolicySettingCard
              icon={<Lock size={18} />}
              iconActive={Boolean(formData.buyukHarfZorunlu)}
              title={t('buyuk_harf_zorunlu_baslik', 'Büyük Harf Zorunlu (A-Z)')}
              description={t('buyuk_harf_zorunlu_aciklama', 'Yeni şifrede en az bir büyük harf bulunmasını zorunlu kılar.')}
              action={
                <BaseSwitch
                  checked={Boolean(formData.buyukHarfZorunlu)}
                  onChange={(e) => handleChange('buyukHarfZorunlu', e.target.checked)}
                />
              }
            />

            {/* Küçük Harf Kuralı */}
            <PolicySettingCard
              icon={<Lock size={18} />}
              iconActive={Boolean(formData.kucukHarfZorunlu)}
              title={t('kucuk_harf_zorunlu_baslik', 'Küçük Harf Zorunlu (a-z)')}
              description={t('kucuk_harf_zorunlu_aciklama', 'Yeni şifrede en az bir küçük harf bulunmasını zorunlu kılar.')}
              action={
                <BaseSwitch
                  checked={Boolean(formData.kucukHarfZorunlu)}
                  onChange={(e) => handleChange('kucukHarfZorunlu', e.target.checked)}
                />
              }
            />

            {/* Rakam Kuralı */}
            <PolicySettingCard
              icon={<Lock size={18} />}
              iconActive={Boolean(formData.rakamZorunlu)}
              title={t('rakam_zorunlu_baslik', 'Rakam Zorunlu (0-9)')}
              description={t('rakam_zorunlu_aciklama', 'Yeni şifrede en az bir rakam bulunmasını zorunlu kılar.')}
              action={
                <BaseSwitch
                  checked={Boolean(formData.rakamZorunlu)}
                  onChange={(e) => handleChange('rakamZorunlu', e.target.checked)}
                />
              }
            />

            {/* Özel Karakter Kuralı */}
            <PolicySettingCard
              icon={<ShieldCheck size={18} />}
              iconActive={Boolean(formData.ozelKarakterZorunlu)}
              title={t('ozel_karakter_zorunlu_baslik', 'Özel Karakter Zorunlu')}
              description={t('ozel_karakter_zorunlu_aciklama', 'Yeni şifrede en az bir sembol (@, $, !, %, *, ?, &, vb.) bulunmasını zorunlu kılar.')}
              action={
                <BaseSwitch
                  checked={Boolean(formData.ozelKarakterZorunlu)}
                  onChange={(e) => handleChange('ozelKarakterZorunlu', e.target.checked)}
                />
              }
            />
          </div>
        </div>
      )
    }
  ], [formData, errors, t]);

  if (loading) {
    return (
      <div className="page-loading-state">
        {t('ayarlar_yukleniyor', 'Ayarlar yükleniyor...')}
      </div>
    );
  }

  return (
    <BaseCardPage
      id="firmaYonetimAyarlari"
      title={t('firma_yonetimi_ayarlari', 'Firma Yönetimi Ayarları')}
      pageTitle={t('firma_yonetim_ayarlari_baslik', 'Firma ve Güvenlik Politikaları')}
      icon={<Building size={20} />}
      subtitleLeft={t('firma_yonetim_ayarlari_aciklama', 'Kullanıcı davetleri, şifre sıfırlama, oturum zaman aşımı ve şifre karmaşıklık politikalarını bu panelden parametrik olarak yapılandırabilirsiniz.')}
      asForm={true}
      onSubmit={handleSave}
      onSave={handleSave}
      isSaving={saving}
      saveButtonText={t('firma_ayarlarini_kaydet', 'Firma Ayarlarını Kaydet')}
      showBackButton={false}
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={(id) => setActiveTabId(String(id))}
    />
  );
}
