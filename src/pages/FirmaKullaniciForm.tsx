/**
 * @akalin/company_module - Firma Kullanıcısı Düzenleme Formu
 * BaseCardPage altyapısı üzerine inşa edilmiş, Material Design 3 ve
 * standart kart sayfası mimarisine tam uyumlu kullanıcı düzenleme bileşeni.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Building, UserCog, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { BaseCardPage, useAdminValidation, PhoneInput, FieldError, FirmaCard, useHeaderApi } from '@akalin/ui';
import { validateFirmaKullanici } from '../validators/firmaKullaniciValidation';
import { useCompanyModule } from '../adapters/CompanyServiceContext';

export interface FirmaKullaniciFormProps {
  /** Düzenlenecek veya başlangıç verileri */
  initialData?: any;
  /** Düzenlenecek kullanıcı ID'si */
  id?: number | string;
  /** İşlem başarılı olduğunda çağrılacak geri çağırma fonksiyonu */
  onSuccess?: (data: any) => void;
  /** İptal veya kapatma butonuna tıklandığında çağrılacak fonksiyon */
  onCancel?: () => void;
  /** Modal içinde mi çalışıyor? (varsayılan: false) */
  inModal?: boolean;
  /** Üst bileşene kaydetme durumu bildiren fonksiyon */
  setIsSaving?: (isSaving: boolean) => void;
  /** İlave CSS sınıfları */
  className?: string;
}

export const FirmaKullaniciForm: React.FC<FirmaKullaniciFormProps> = ({
  initialData,
  id,
  onSuccess,
  onCancel,
  inModal = false,
  setIsSaving,
  className = ''
}) => {
  const { t } = useTranslation();
  const { adapter } = useCompanyModule();
  const { errors: formErrors, setErrors: setFormErrors, clearError, validate } = useAdminValidation();
  const [saving, setSaving] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>('genel');
  const [userData, setUserData] = useState<any>(initialData || null);
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
    sifre: '',
    aktifMi: true
  });

  const { setHeaderBreadcrumbOptions } = useHeaderApi() || {};
  const effectiveId = id || initialData?.id;

  const userDisplayName = useMemo(() => {
    const fullName = userData?.adSoyad?.trim() || (userData?.ad ? `${userData.ad} ${userData.soyad || ''}`.trim() : '');
    if (fullName) return fullName;
    if (formData.ad || formData.soyad) return `${formData.ad || ''} ${formData.soyad || ''}`.trim();
    if (effectiveId) return `#${effectiveId}`;
    return t('yeni_kullanici_ekle', 'Yeni Kullanıcı Ekle');
  }, [userData, formData.ad, formData.soyad, effectiveId, t]);

  useEffect(() => {
    if (setHeaderBreadcrumbOptions && !inModal) {
      setHeaderBreadcrumbOptions({
        recordTitle: userDisplayName
      });
    }
    return () => {
      if (setHeaderBreadcrumbOptions && !inModal) {
        setHeaderBreadcrumbOptions(null);
      }
    };
  }, [userDisplayName, setHeaderBreadcrumbOptions, inModal]);

  useEffect(() => {
    if (initialData) {
      setUserData(initialData);
    } else if (effectiveId) {
      adapter.getSystemUserById(effectiveId)
        .then((res) => {
          setUserData(res);
        })
        .catch((err) => {
          toast.error(err.response?.data?.mesaj || err.message || t('Kullanıcı bilgileri yüklenemedi.'));
        });
    } else {
      setUserData(null);
      setFormData({
        ad: '',
        soyad: '',
        email: '',
        telefon: '',
        sifre: '',
        aktifMi: true
      });
      setFormErrors({});
    }
  }, [initialData, effectiveId, adapter, setFormErrors, t]);

  useEffect(() => {
    if (userData) {
      let ad = userData.ad || '';
      let soyad = userData.soyad || '';
      if (!ad && !soyad && userData.adSoyad) {
        const parts = userData.adSoyad.split(' ');
        soyad = parts.length > 1 ? parts.pop() || '' : '';
        ad = parts.join(' ') || '';
      }

      setFormData({
        ad: ad,
        soyad: soyad,
        email: userData.email || '',
        telefon: userData.telefon || '',
        sifre: '',
        aktifMi: userData.durum === 'Aktif' || userData.aktifMi === true
      });
      setFormErrors({});
    }
  }, [userData, setFormErrors]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const isValid = validate(validateFirmaKullanici, formData);
    if (!isValid) {
      return;
    }

    setSaving(true);
    if (setIsSaving) setIsSaving(true);
    setFormErrors({});

    try {
      const targetId = effectiveId || userData?.id;
      if (targetId) {
        const res = await adapter.updateSystemUser(targetId, formData);
        toast.success(res?.mesaj || t('Kullanıcı başarıyla güncellendi.'));
        if (onSuccess) onSuccess(res);
      } else {
        const res = await adapter.createSystemUser(formData);
        toast.success(res?.mesaj || t('Kullanıcı başarıyla oluşturuldu.'));
        if (onSuccess) onSuccess(res);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.mesaj || err.response?.data?.message || err.message || t('Kullanıcı kaydedilirken hata oluştu.');
      toast.error(errorMsg);
      const lower = errorMsg.toLowerCase();
      if (lower.includes('telefon') || lower.includes('phone')) {
        setFormErrors((prev: Record<string, string>) => ({ ...prev, telefon: errorMsg }));
      } else if (lower.includes('e-posta') || lower.includes('eposta') || lower.includes('email')) {
        setFormErrors((prev: Record<string, string>) => ({ ...prev, email: errorMsg }));
      }
    } finally {
      setSaving(false);
      if (setIsSaving) setIsSaving(false);
    }
  };

  const isSuperAdmin = userData?.roller?.includes('SuperAdmin') || userData?.isSuperAdmin;
  const firmalarCount = userData?.firmalar?.length || 0;

  const tabs = useMemo(() => [
    {
      id: 'genel',
      label: t('Genel Bilgiler'),
      icon: <UserCog size={16} />,
      content: (
        <div className={`firma-kullanici-form ${className}`.trim()}>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">
                {t('Ad')} <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.ad ? 'is-invalid' : ''}`}
                placeholder={t('Ad giriniz...')}
                value={formData.ad}
                onChange={(e) => {
                  setFormData({ ...formData, ad: e.target.value });
                  if (formErrors.ad) clearError('ad');
                }}
                required
                autoFocus
              />
              {formErrors.ad && <FieldError error={formErrors.ad} />}
            </div>

            <div className="form-field">
              <label className="form-label">
                {t('Soyad')} <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.soyad ? 'is-invalid' : ''}`}
                placeholder={t('Soyad giriniz...')}
                value={formData.soyad}
                onChange={(e) => {
                  setFormData({ ...formData, soyad: e.target.value });
                  if (formErrors.soyad) clearError('soyad');
                }}
                required
              />
              {formErrors.soyad && <FieldError error={formErrors.soyad} />}
            </div>

            <div className="form-field">
              <label className="form-label">
                {t('E-Posta')} <span className="required-mark">*</span>
              </label>
              <input
                type="email"
                className={`form-input ${formErrors.email ? 'is-invalid' : ''}`}
                placeholder="kullanici@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) clearError('email');
                }}
                required
              />
              {formErrors.email && <FieldError error={formErrors.email} />}
            </div>

            <div className="form-field">
              <label className="form-label">{t('Telefon')}</label>
              <PhoneInput
                name="telefon"
                className={`form-input ${formErrors.telefon ? 'is-invalid' : ''}`}
                placeholder="0 (5XX) XXX XX XX"
                value={formData.telefon}
                onChange={(val: any) => {
                  const phoneVal = typeof val === 'object' && val?.target ? val.target.value : val;
                  setFormData({ ...formData, telefon: phoneVal });
                  if (formErrors.telefon) clearError('telefon');
                }}
              />
              {formErrors.telefon && <FieldError error={formErrors.telefon} />}
            </div>

            <div className="form-field full-width">
              <label className="form-label">{t('Yeni Şifre (İsteğe Bağlı)')}</label>
              <input
                type="password"
                className={`form-input ${formErrors.sifre ? 'is-invalid' : ''}`}
                placeholder={t('Değiştirmek istemiyorsanız boş bırakınız...')}
                value={formData.sifre}
                onChange={(e) => {
                  setFormData({ ...formData, sifre: e.target.value });
                  if (formErrors.sifre) clearError('sifre');
                }}
              />
              {formErrors.sifre && <FieldError error={formErrors.sifre} />}
            </div>

            <div className="form-field full-width">
              <label className="form-label">{t('Hesap Durumu')}</label>
              <select
                className="form-input"
                value={formData.aktifMi ? 'aktif' : 'pasif'}
                onChange={(e) => setFormData({ ...formData, aktifMi: e.target.value === 'aktif' })}
              >
                <option value="aktif">{t('Aktif')}</option>
                <option value="pasif">{t('Pasif')}</option>
              </select>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'firmalar',
      label: firmalarCount > 0 ? `${t('Bağlı Olduğu Firmalar')} (${firmalarCount})` : t('Bağlı Olduğu Firmalar'),
      icon: <Building size={16} />,
      content: (
        <div className="firma-kullanici-firmalar-tab">
          {userData?.firmalar && userData.firmalar.length > 0 ? (
            <>
              <div className="firma-kullanici-tab-header">
                <div className="flex items-center gap-8 text-14 font-600 text-primary">
                  <Building size={18} color="var(--accent-primary)" />
                  <span>{t('Erişim Yetkisi Bulunan Firmalar')}</span>
                </div>
                <span className="firma-kullanici-badge-count">
                  {userData.firmalar.length} {t('Firma')}
                </span>
              </div>

              <div className="firma-kullanici-cards-grid">
                {userData.firmalar.map((f: any, idx: number) => (
                  <FirmaCard key={idx} firma={f} />
                ))}
              </div>
            </>
          ) : (
            <div className="firma-kullanici-empty-tab">
              <div className="firma-kullanici-empty-icon">
                {isSuperAdmin ? (
                  <ShieldCheck size={36} color="var(--accent-primary)" />
                ) : (
                  <Building size={36} className="text-secondary" />
                )}
              </div>
              <h4 className="firma-kullanici-empty-title">
                {isSuperAdmin
                  ? t('Süper Yönetici (Tüm Sistem)')
                  : t('Bağlı Firma Bulunamadı')}
              </h4>
              <p className="firma-kullanici-empty-desc">
                {isSuperAdmin
                  ? t('Bu kullanıcı Sistem Yöneticisidir (Süper Admin). Sistemdeki tüm firmalara doğrudan tam yetki ile erişebilir.')
                  : t('Bu kullanıcıya henüz atanmış aktif bir firma yetkisi bulunmamaktadır.')}
              </p>
            </div>
          )}
        </div>
      )
    }
  ], [
    t,
    className,
    formErrors,
    formData,
    clearError,
    userData,
    isSuperAdmin,
    firmalarCount
  ]);

  return (
    <BaseCardPage
      id="firmaKullaniciForm"
      title={userDisplayName}
      icon={<UserCog size={20} />}
      subtitleLeft={userData?.email ? userData.email : t('Kullanıcı kimlik, iletişim ve yetki bilgilerini yapılandırın.')}
      asForm={true}
      onSave={handleSubmit}
      isSaving={saving}
      onClose={onCancel}
      hideBreadcrumb={inModal}
      showBackButton={!inModal}
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={(tabId: string | number) => setActiveTabId(String(tabId))}
    />
  );
};

export default FirmaKullaniciForm;
