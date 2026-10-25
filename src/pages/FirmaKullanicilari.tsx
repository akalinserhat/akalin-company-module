/**
 * @akalin/company_module - Firma Yönetici ve Kullanıcıları Listesi
 * BaseListPage mimarisi üzerine inşa edilmiş, sistemdeki tüm kayıtlı kullanıcıları,
 * bağlı oldukları aktif firmaları ve rolleri listeleyen ve yöneten ana sayfa bileşeni.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { BaseListPage, useAlertDialog, EkleFloatCircleButton } from '@akalin/ui';
import { Mail, Phone, ShieldCheck, Building, User, UserX, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useCompanyModule } from '../adapters/CompanyServiceContext';
import FirmaKullaniciForm from './FirmaKullaniciForm';

export default function FirmaKullanicilari() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { adapter, setSearchPlaceholder } = useCompanyModule();
  const { showAlert } = useAlertDialog();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Dinamik Rota ve URL Yönetimi
  const isYeni = location.pathname.startsWith('/firma-kullanicilari/yeni');
  const urlEditId = params.id ? parseInt(params.id, 10) : null;
  const isDuzenle = location.pathname.startsWith('/firma-kullanicilari/duzenle/') || (Boolean(urlEditId) && !isYeni);
  const isFormMode = isYeni || isDuzenle;
  const activeUserId = urlEditId;

  useEffect(() => {
    if (setSearchPlaceholder) {
      setSearchPlaceholder(t('Kullanıcı, e-posta veya firma ara...'));
    }
    return () => {
      if (setSearchPlaceholder) {
        setSearchPlaceholder(t('Arama yapın...'));
      }
    };
  }, [setSearchPlaceholder, t]);

  const refreshList = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    window.dispatchEvent(new Event('refresh-list'));
  }, []);

  const handleOpenForm = useCallback((user: any = null) => {
    if (user && typeof user === 'object' && user.id) {
      setSelectedUser(user);
      navigate(`/firma-kullanicilari/duzenle/${user.id}`);
    } else if (typeof user === 'number' || typeof user === 'string') {
      navigate(`/firma-kullanicilari/duzenle/${user}`);
    } else {
      setSelectedUser(null);
      navigate('/firma-kullanicilari/yeni');
    }
  }, [navigate]);

  const handleCloseForm = useCallback(() => {
    setSelectedUser(null);
    navigate('/firma-kullanicilari');
  }, [navigate]);

  const customFetchData = useCallback(async (paramsObj: any = {}) => {
    try {
      const responseData = await adapter.getSystemUsers();
      let data = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];

      if (paramsObj.aramaData && paramsObj.aramaData.value) {
        const val = paramsObj.aramaData.value.toLocaleLowerCase('tr-TR').trim();
        const type = paramsObj.aramaData.type || 'Tumu';

        data = data.filter((user: any) => {
          if (type === 'AdSoyad') {
            return user.adSoyad?.toLocaleLowerCase('tr-TR').includes(val);
          }
          if (type === 'Email') {
            return user.email?.toLocaleLowerCase('tr-TR').includes(val);
          }
          if (type === 'Firma') {
            return user.firmalar?.some((f: any) => f.firmaAdi?.toLocaleLowerCase('tr-TR').includes(val));
          }
          // Tumu
          return (
            user.adSoyad?.toLocaleLowerCase('tr-TR').includes(val) ||
            user.email?.toLocaleLowerCase('tr-TR').includes(val) ||
            (user.telefon && user.telefon.includes(val)) ||
            user.firmalar?.some((f: any) =>
              f.firmaAdi?.toLocaleLowerCase('tr-TR').includes(val) ||
              f.rol?.toLocaleLowerCase('tr-TR').includes(val)
            )
          );
        });
      }

      return { data, totalCount: data.length };
    } catch (error) {
      console.error('Kullanıcılar getirilirken hata:', error);
      return { data: [], totalCount: 0 };
    }
  }, [adapter]);

  /**
   * Kullanıcı silme işlemi (Aktif firma ve tek yönetici kuralları ile).
   */
  const handleDelete = useCallback((user: any) => {
    const bagliFirmaSayisi = user.firmalar?.length || 0;
    const isSuperAdmin = user.roller?.includes('SuperAdmin');

    let dialogMessage = t(
      'kullanici_silme_onay',
      '"{{adSoyad}}" isimli kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      { adSoyad: user.adSoyad }
    );

    if (bagliFirmaSayisi > 0) {
      const firmaIsimleri = user.firmalar.map((f: any) => f.firmaAdi).join(', ');
      dialogMessage = t(
        'kullanici_bagli_firma_silme_uyari',
        'DİKKAT: "{{adSoyad}}" kullanıcısının bağlı olduğu {{bagliFirmaSayisi}} adet aktif firma bulunmaktadır ({{firmaIsimleri}}).\n\nBu kullanıcıyı silmek istediğinize emin misiniz? (Firmasında tek yönetici ise silme işlemi güvenlik gereği sistem tarafından engellenecektir.)',
        { adSoyad: user.adSoyad, bagliFirmaSayisi, firmaIsimleri }
      );
    } else if (isSuperAdmin) {
      dialogMessage = t(
        'super_admin_silme_uyari',
        'DİKKAT: "{{adSoyad}}" bir Süper Yöneticidir. Bu hesabı silmek istediğinize emin misiniz?',
        { adSoyad: user.adSoyad }
      );
    }

    showAlert(
      'confirm',
      t('Kullanıcıyı Sil'),
      dialogMessage,
      async () => {
        try {
          await adapter.deleteSystemUser(user.id);
          toast.success(t('Kullanıcı başarıyla silindi.'));
          refreshList();
        } catch (err: any) {
          showAlert(
            'error',
            t('Silme İşlemi Engellendi'),
            err.response?.data?.mesaj || err.response?.data?.message || err.message || t('Kullanıcı silinirken bir hata oluştu.')
          );
        }
      },
      t('Evet, Sil'),
      t('Vazgeç')
    );
  }, [showAlert, refreshList, adapter, t]);

  const columns = useMemo(() => [
    {
      id: 'kullanici',
      header: t('Kullanıcı'),
      accessor: 'adSoyad',
      sortable: true,
      render: (user: any) => (
        <div className="kullanici-col-cell">
          <div className="kullanici-avatar-box">
            {user.adSoyad ? user.adSoyad.charAt(0).toUpperCase() : <User size={18} />}
          </div>
          <div>
            <div className="kullanici-info-title">
              {user.adSoyad || t('İsimsiz Kullanıcı')}
            </div>
            <div className="kullanici-info-meta">
              <span className="inline-flex items-center gap-4">
                <Mail size={12} />
                {user.email}
              </span>
              {user.telefon && (
                <span className="inline-flex items-center gap-4">
                  <Phone size={12} />
                  {user.telefon}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'bagliFirmaSayisi',
      header: t('Bağlı Firma Sayısı'),
      accessor: 'firmalar',
      align: 'center',
      render: (user: any) => {
        const count = user.firmalar ? user.firmalar.length : 0;
        const isSuperAdmin = user.roller?.includes('SuperAdmin');

        if (count === 0 && isSuperAdmin) {
          return (
            <div className="kullanici-badge-superadmin">
              <ShieldCheck size={14} />
              {t('Süper Admin')}
            </div>
          );
        }

        return (
          <div className={count > 0 ? 'kullanici-badge-firmalar' : 'kullanici-badge-nofirma'}>
            {count > 0 ? <Building size={14} /> : <UserX size={14} />}
            {count} {t('Firma')}
          </div>
        );
      }
    },
    {
      id: 'yetkiliFirmalar',
      header: t('Yetkili Olduğu Firmalar & Roller'),
      accessor: 'firmalar',
      render: (user: any) => {
        if (!user.firmalar || user.firmalar.length === 0) {
          if (user.roller?.includes('SuperAdmin')) {
            return (
              <span className="inline-flex items-center gap-6 text-13 font-500" style={{ color: '#8b5cf6' }}>
                <ShieldCheck size={15} /> {t('Tüm Sistem (Süper Yönetici)')}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-6 text-13 text-secondary italic">
              <UserX size={14} /> {t('Henüz atanmış aktif bir firma bulunmuyor.')}
            </span>
          );
        }

        return (
          <div className="kullanici-firmalar-chips">
            {user.firmalar.map((firma: any, idx: number) => (
              <div key={idx} className="kullanici-firma-chip">
                <Building size={13} color="var(--accent-primary)" />
                <span className="font-600 text-primary">{firma.firmaAdi}</span>
                <span className="text-secondary opacity-60">•</span>
                <span className="inline-flex items-center gap-4 text-secondary">
                  <ShieldCheck size={12} color="var(--accent-primary)" />
                  {firma.rol}
                </span>
              </div>
            ))}
          </div>
        );
      }
    },
    {
      id: 'durum',
      header: t('Durum'),
      accessor: 'durum',
      sortable: true,
      align: 'center',
      render: (user: any) => (
        <div className="kullanici-durum-cell">
          <div className={`kullanici-durum-dot ${user.durum === 'Aktif' ? 'aktif' : 'pasif'}`} />
          <span className="text-13 font-500 text-primary">{user.durum}</span>
        </div>
      )
    }
  ], [t]);

  const searchableFields = useMemo(() => [
    { id: 'Tumu', label: t('Tümünde Ara'), type: 'text', placeholder: t('İsim, e-posta veya firma ara...') },
    { id: 'AdSoyad', label: t('Kullanıcı Adına Göre'), type: 'text', placeholder: t('Kullanıcı adı girin...') },
    { id: 'Email', label: t('E-Postaya Göre'), type: 'text', placeholder: t('E-posta adresi girin...') },
    { id: 'Firma', label: t('Firmaya Göre'), type: 'text', placeholder: t('Firma adı girin...') }
  ], [t]);

  const mobileCardRender = useCallback((user: any) => {
    const count = user.firmalar ? user.firmalar.length : 0;
    const isSuperAdmin = user.roller?.includes('SuperAdmin');

    return (
      <div className="flex flex-col gap-12 p-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="kullanici-avatar-box">
              {user.adSoyad ? user.adSoyad.charAt(0).toUpperCase() : <User size={16} />}
            </div>
            <div>
              <div className="kullanici-info-title">{user.adSoyad || t('İsimsiz Kullanıcı')}</div>
              <div className="kullanici-info-meta">
                <span className="inline-flex items-center gap-4">
                  <Mail size={12} /> {user.email}
                </span>
                {user.telefon && (
                  <span className="inline-flex items-center gap-4">
                    <Phone size={12} /> {user.telefon}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="kullanici-durum-cell">
            <div className={`kullanici-durum-dot ${user.durum === 'Aktif' ? 'aktif' : 'pasif'}`} />
            <span className="text-12 font-500">{user.durum}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {count === 0 && isSuperAdmin ? (
            <div className="kullanici-badge-superadmin">
              <ShieldCheck size={13} /> {t('Süper Admin')}
            </div>
          ) : (
            <div className={count > 0 ? 'kullanici-badge-firmalar' : 'kullanici-badge-nofirma'}>
              {count > 0 ? <Building size={13} /> : <UserX size={13} />} {count} {t('Firma')}
            </div>
          )}
        </div>

        {user.firmalar && user.firmalar.length > 0 ? (
          <div className="kullanici-firmalar-chips pt-8 border-t border-glass">
            {user.firmalar.map((f: any, i: number) => (
              <div key={i} className="kullanici-firma-chip">
                <Building size={12} color="var(--accent-primary)" />
                <span className="font-500 text-primary">{f.firmaAdi}</span>
                <span className="text-secondary opacity-60">•</span>
                <span className="text-secondary">{f.rol}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-8 border-t border-glass text-12 text-secondary italic">
            {isSuperAdmin ? t('Tüm Sistem (Süper Yönetici)') : t('Henüz atanmış aktif bir firma bulunmuyor.')}
          </div>
        )}
      </div>
    );
  }, [t]);

  if (isFormMode) {
    return (
      <FirmaKullaniciForm
        id={activeUserId ?? undefined}
        initialData={selectedUser}
        inModal={false}
        onCancel={handleCloseForm}
        onSuccess={() => {
          refreshList();
          handleCloseForm();
        }}
      />
    );
  }

  return (
    <BaseListPage
      title={t('Firma Yönetici ve Kullanıcıları')}
      subtitle={t('Sistemdeki tüm kullanıcıları ve erişimi oldukları firmaları inceleyin.')}
      icon={<Users size={22} />}
      customFetchData={customFetchData}
      columns={columns}
      searchableFields={searchableFields}
      mobileCardRender={mobileCardRender}
      enableColumnManagement={true}
      addNewText={t('yeni_kullanici_ekle', 'Yeni Kullanıcı Ekle')}
      onAddNew={() => handleOpenForm(null)}
      customAddButton={
        <EkleFloatCircleButton
          onClick={() => handleOpenForm(null)}
          title={t('yeni_kullanici_ekle', 'Yeni Kullanıcı Ekle')}
          position="fixed-bottom-right"
          useShadow={true}
        />
      }
      onEdit={(user) => handleOpenForm(user)}
      customDeleteData={(id) => adapter.deleteSystemUser(id)}
      refreshKey={refreshKey}
    />
  );
}
