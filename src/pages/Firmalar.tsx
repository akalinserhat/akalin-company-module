/**
 * Webakus ERP AdminUI - Firma (Tenant) Yönetimi Listesi
 * Sistemdeki tüm kayıtlı firmaları, demo/lisans sürelerini listeler, filtreleme,
 * düzenleme, süre uzatma, lisansa geçirme ve silme (soft-delete) işlemlerini yönetir.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { BaseListPage, ActionMenu, useAlertDialog, BasePromptDialog, BackButton, useHeaderApi } from '@akalin/ui';
import { Building, Calendar, ShieldCheck, Trash2, Edit2, Mail, Phone, Clock, Globe, RotateCcw, PauseCircle, PlayCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useCompanyModule } from '../adapters/CompanyServiceContext';
import FirmaForm from './FirmaForm';

export default function Firmalar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const headerApi = (useHeaderApi?.() || {}) as any;
  const setHeader = headerApi.setHeader;
  const clearHeader = headerApi.clearHeader;
  const { adapter, setSearchPlaceholder } = useCompanyModule();
  const { showAlert } = useAlertDialog();

  const [sureUzatPrompt, setSureUzatPrompt] = useState({ isOpen: false, firmaId: null, firmaAdi: '' });
  const [suspendPrompt, setSuspendPrompt] = useState({ isOpen: false, firmaId: null, firmaAdi: '' });

  // Dinamik Rota ve URL Yönetimi
  const isYeni = location.pathname.startsWith('/firmalar/yeni');
  const urlEditId = params.id ? parseInt(params.id, 10) : null;
  const isDuzenle = location.pathname.startsWith('/firmalar/duzenle/') || (Boolean(urlEditId) && !isYeni);
  const isFormMode = isYeni || isDuzenle;
  const activeFirmaId = urlEditId;

  // Liste modundayken üst başlık çubuğuna (Header) Geri Dön butonu ekle
  useEffect(() => {
    if (!isFormMode && setHeader) {
      setHeader('firmalar-list-header', (
        <BackButton 
          to="/" 
          title={t('auto_geri_don', 'Geri Dön')} 
        />
      ));
    }
    return () => {
      if (clearHeader) clearHeader('firmalar-list-header');
    };
  }, [isFormMode, setHeader, clearHeader, t]);

  useEffect(() => {
    if (setSearchPlaceholder) {
      setSearchPlaceholder(t('firma_arama_placeholder', 'Firma Adı, Vergi No veya E-posta ara...'));
    }
    return () => {
      if (setSearchPlaceholder) {
        setSearchPlaceholder(t('arama_yapin', 'Arama yapın...'));
      }
    };
  }, [setSearchPlaceholder, t]);

  const refreshList = () => {
    window.dispatchEvent(new Event('refresh-list'));
  };

  const customFetchData = useCallback(async (paramsObj: any = {}) => {
    try {
      const response = await axios.get('/api/Firma');
      let data = response.data || [];

      if (paramsObj.aramaData && paramsObj.aramaData.value) {
        const val = paramsObj.aramaData.value.toLocaleLowerCase('tr-TR').trim();
        const type = paramsObj.aramaData.type || 'Tumu';

        data = data.filter((f) => {
          if (type === 'FirmaAdi') {
            return f.firmaAdi?.toLocaleLowerCase('tr-TR').includes(val);
          }
          if (type === 'VergiNo') {
            return f.vergiNo?.toLocaleLowerCase('tr-TR').includes(val);
          }
          if (type === 'Email') {
            return f.email?.toLocaleLowerCase('tr-TR').includes(val);
          }
          if (type === 'Yetkili') {
            return f.yetkiliAdSoyad?.toLocaleLowerCase('tr-TR').includes(val);
          }
          // Tumu
          return (
            f.firmaAdi?.toLocaleLowerCase('tr-TR').includes(val) ||
            f.vergiNo?.toLocaleLowerCase('tr-TR').includes(val) ||
            f.email?.toLocaleLowerCase('tr-TR').includes(val) ||
            f.yetkiliAdSoyad?.toLocaleLowerCase('tr-TR').includes(val) ||
            (f.telefon && f.telefon.includes(val)) ||
            (f.subDomain && f.subDomain.toLocaleLowerCase('tr-TR').includes(val)) ||
            f.faaliyetAlanlari?.some((fa) => fa?.toLocaleLowerCase('tr-TR').includes(val))
          );
        });
      }

      return { data };
    } catch (error) {
      console.error('Firmalar getirilirken hata:', error);
      return { data: [] };
    }
  }, []);

  const handleSuspendPrompt = useCallback((id, firmaAdi) => {
    setSuspendPrompt({ isOpen: true, firmaId: id, firmaAdi });
  }, []);

  const onConfirmSuspend = useCallback(async (neden) => {
    try {
      await axios.put(`/api/Firma/${suspendPrompt.firmaId}/suspend`, { 
        askidaMi: true, 
        neden: neden ? String(neden).trim() : null 
      });
      refreshList();
      toast.success(t('firma_askiya_alindi_basarili', 'Firma başarıyla askıya alındı.'));
      setSuspendPrompt({ isOpen: false, firmaId: null, firmaAdi: '' });
    } catch (err) {
      showAlert('error', t('islem_basarisiz', 'İşlem Başarısız'), err.response?.data?.mesaj || t('islem_basarisiz', 'İşlem başarısız.'));
    }
  }, [suspendPrompt.firmaId, showAlert, t]);

  const handleUnsuspend = useCallback((id, firmaAdi) => {
    showAlert(
      'confirm',
      t('aski_kaldir_baslik', 'Firmayı Aktifleştir'),
      t('aski_kaldir_onay_mesaj', { firmaAdi }),
      async () => {
        try {
          await axios.put(`/api/Firma/${id}/suspend`, { askidaMi: false });
          refreshList();
          toast.success(t('firma_aktiflestirildi_basarili', 'Firma başarıyla tekrar aktif edildi.'));
        } catch (err) {
          showAlert('error', t('islem_basarisiz', 'İşlem Başarısız'), err.response?.data?.mesaj || t('islem_basarisiz', 'İşlem başarısız.'));
        }
      },
      t('evet_aktiflestir', 'Evet, Aktifleştir'),
      t('iptal', 'İptal')
    );
  }, [showAlert, t]);

  const handleDeleteFirma = useCallback((firma) => {
    showAlert(
      'confirm',
      t('firmayi_kalici_sil_baslik', 'Firmayı Kalıcı Olarak Sil'),
      t('firmayi_kalici_sil_onay_mesaj', { firmaAdi: firma.firmaAdi }),
      async () => {
        const toastId = toast.loading(t('firma_siliniyor', 'Firma ve veritabanı kayıtları kalıcı olarak siliniyor...'));
        try {
          await axios.delete(`/api/Firma/${firma.id}`);
          refreshList();
          toast.success(t('firma_kalici_silindi', 'Firma ve tüm verileri veritabanından kalıcı olarak silindi.'), { id: toastId });
        } catch (err) {
          toast.dismiss(toastId);
          showAlert('error', t('islem_basarisiz', 'İşlem Başarısız'), err.response?.data?.mesaj || t('islem_basarisiz', 'İşlem başarısız.'));
        }
      },
      t('evet_kalici_sil', 'Evet, Kalıcı Olarak Sil'),
      t('iptal', 'İptal')
    );
  }, [showAlert, t]);

  const customDeleteData = useCallback(async (id) => {
    await axios.delete(`/api/Firma/${id}`);
  }, []);

  const handleSureUzat = useCallback((id, firmaAdi) => {
    setSureUzatPrompt({ isOpen: true, firmaId: id, firmaAdi });
  }, []);

  const onConfirmSureUzat = useCallback(async (gun) => {
    if (gun && !isNaN(gun)) {
      try {
        await axios.put(`/api/Firma/${sureUzatPrompt.firmaId}/sure-uzat`, { ekGunSayisi: parseInt(gun, 10) });
        refreshList();
        toast.success(t('sure_basariyla_uzatildi', 'Süre başarıyla uzatıldı.'));
        setSureUzatPrompt({ isOpen: false, firmaId: null, firmaAdi: '' });
      } catch (err) {
        showAlert('error', t('islem_basarisiz', 'İşlem Başarısız'), err.response?.data?.mesaj || t('islem_basarisiz', 'İşlem başarısız.'));
      }
    }
  }, [sureUzatPrompt.firmaId, showAlert, t]);

  const handleLisansaGecir = useCallback((id, firmaAdi) => {
    showAlert(
      'confirm',
      t('lisansa_gecir_baslik', 'Lisansa Geçir'),
      t('lisansa_gecir_onay_mesaj', { firmaAdi }),
      async () => {
        try {
          await axios.put(`/api/Firma/${id}/lisansa-gecir`);
          refreshList();
          toast.success(t('firma_lisansa_gecirildi', 'Firma başarıyla lisanslı moda geçirildi.'));
        } catch (err) {
          showAlert('error', t('islem_basarisiz', 'İşlem Başarısız'), err.response?.data?.mesaj || t('islem_basarisiz', 'İşlem başarısız.'));
        }
      },
      t('evet_lisansa_gecir', 'Evet, Lisansa Geçir'),
      t('iptal', 'İptal')
    );
  }, [showAlert, t]);

  const handleResetFirma = useCallback((id, firmaAdi) => {
    showAlert(
      'confirm',
      t('firma_reset_baslik', 'Firma Veritabanını Sıfırla'),
      t('firma_reset_onay_mesaj', { firmaAdi }),
      async () => {
        const toastId = toast.loading(t('firma_reset_yapiliyor', 'Firma veritabanı sıfırlanıyor, lütfen bekleyin...'));
        try {
          const res = await axios.post(`/api/Firma/${id}/reset`);
          refreshList();
          toast.success(res.data?.mesaj || t('firma_reset_basarili', 'Firma veritabanı başarıyla sıfırlandı.'), { id: toastId });
        } catch (err) {
          toast.dismiss(toastId);
          showAlert('error', t('islem_basarisiz', 'İşlem Başarısız'), err.response?.data?.mesaj || t('islem_basarisiz', 'İşlem başarısız.'));
        }
      },
      t('evet_sifirla', 'Evet, Sıfırla'),
      t('iptal', 'İptal')
    );
  }, [showAlert, t]);

  // Liste modundayken (form kapalıyken) geçici sihirbaz hafızasını temizle
  useEffect(() => {
    if (!isFormMode) {
      try {
        sessionStorage.removeItem('webakus_wizard_step_firmaWizardForm');
      } catch (e) {}
    }
  }, [isFormMode]);

  const handleOpenForm = useCallback((id = null) => {
    if (id) {
      try {
        sessionStorage.setItem('webakus_active_row_/firmalar', String(id));
      } catch (e) {}
      navigate(`/firmalar/duzenle/${id}`);
    } else {
      try {
        sessionStorage.removeItem('webakus_wizard_step_firmaWizardForm');
      } catch (e) {}
      navigate('/firmalar/yeni', { state: { isNew: true } });
    }
  }, [navigate]);

  const handleCloseForm = useCallback((selectedId = null) => {
    const isPrimitiveId = typeof selectedId === 'number' || (typeof selectedId === 'string' && selectedId.trim() !== '');
    const validId = isPrimitiveId ? selectedId : (typeof activeFirmaId === 'number' || typeof activeFirmaId === 'string' ? activeFirmaId : null);
    if (validId) {
      try {
        sessionStorage.setItem('webakus_active_row_/firmalar', String(validId));
      } catch (e) {}
    }
    navigate('/firmalar', { state: validId ? { selectedId: validId } : undefined });
  }, [navigate, activeFirmaId]);

  const columns = useMemo(() => [
    {
      id: 'firmaBilgileri',
      header: t('firma_bilgileri', 'Firma Bilgileri'),
      accessor: 'firmaAdi',
      sortable: true,
      style: { minWidth: '240px' },
      render: (firma) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--glass-border)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px', fontSize: '14px' }}>
              {firma.firmaAdi}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '12px' }}>
              <span>{t('vn_etiket', 'VN:')} {firma.vergiNo || '-'}</span>
              {firma.subDomain && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Globe size={11} /> {firma.subDomain}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faaliyetAlanlari',
      header: t('faaliyet_alanlari', 'Faaliyet Alanları'),
      accessor: 'faaliyetAlanlari',
      style: { minWidth: '180px' },
      render: (firma) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {firma.faaliyetAlanlari && firma.faaliyetAlanlari.length > 0 ? (
            firma.faaliyetAlanlari.map((fa, i) => (
              <span
                key={i}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: '500'
                }}
              >
                {fa}
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>-</span>
          )}
        </div>
      )
    },
    {
      id: 'yetkili',
      header: t('yetkili_ve_iletisim', 'Yetkili & İletişim'),
      accessor: 'yetkiliAdSoyad',
      style: { minWidth: '200px' },
      render: (firma) => (
        <div style={{ fontSize: '13px' }}>
          <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {firma.yetkiliAdSoyad || '-'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-secondary)', fontSize: '11px' }}>
            {firma.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={12} /> {firma.email}
              </div>
            )}
            {firma.telefon && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={12} /> {firma.telefon}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'lisansDurumu',
      header: t('lisans_ve_durum', 'Lisans / Firma Durumu'),
      accessor: 'isDemo',
      sortable: true,
      style: { minWidth: '210px' },
      render: (firma) => {
        const isSuspended = firma.askidaMi || !firma.aktifMi;

        if (isSuspended) {
          return (
            <div>
              <span style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--danger)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <PauseCircle size={13} />
                {t('askiya_alindi_rozet', 'Askıya Alındı (Suspend)')}
              </span>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {firma.askiNedeni ? (
                  <span><strong>{t('aski_nedeni_etiket', 'Neden:')}</strong> {firma.askiNedeni}</span>
                ) : (
                  <span>{t('kullanici_girisleri_kapali', 'Kullanıcı girişleri engellendi')}</span>
                )}
              </div>
            </div>
          );
        }

        const isDemo = firma.isDemo ?? firma.demoMu;
        const kalanGun = firma.lisansKalanGun;

        let badgeBg = 'rgba(16, 185, 129, 0.1)';
        let badgeColor = 'var(--success)';
        let badgeText = t('normal_lisans', 'Normal Lisans');

        if (isDemo) {
          if (kalanGun <= 0) {
            badgeBg = 'rgba(239, 68, 68, 0.1)';
            badgeColor = 'var(--danger)';
            badgeText = t('demo_sure_bitti', 'Demo (Süre Bitti)');
          } else if (kalanGun <= 5) {
            badgeBg = 'rgba(245, 158, 11, 0.1)';
            badgeColor = '#f59e0b';
            badgeText = t('demo_kalan_gun', 'Demo ({gun} Gün Kaldı)', { gun: kalanGun });
          } else {
            badgeBg = 'rgba(99, 102, 241, 0.1)';
            badgeColor = 'var(--accent-primary)';
            badgeText = t('demo_kalan_gun', 'Demo ({gun} Gün Kaldı)', { gun: kalanGun });
          }
        }

        return (
          <div>
            <span style={{
              background: badgeBg,
              color: badgeColor,
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Calendar size={12} />
              {badgeText}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {t('bitis_tarihi', 'Bitiş:')} {firma.lisansBitisTarihi ? new Date(firma.lisansBitisTarihi).toLocaleDateString('tr-TR') : '-'}
            </div>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      width: '60px',
      render: (firma) => {
        const isSuspended = firma.askidaMi || !firma.aktifMi;
        return (
          <ActionMenu
            actions={[
              {
                label: t('Düzenle'),
                icon: <Edit2 size={15} />,
                isDefault: true,
                default: true,
                onClick: () => handleOpenForm(firma.id)
              },
              ...((firma.isDemo ?? firma.demoMu) ? [
                {
                  label: t('sure_uzat', 'Süre Uzat'),
                  icon: <Clock size={15} />,
                  onClick: () => handleSureUzat(firma.id, firma.firmaAdi)
                },
                {
                  label: t('normal_lisansa_gecir', 'Normal Lisansa Geçir'),
                  icon: <ShieldCheck size={15} />,
                  onClick: () => handleLisansaGecir(firma.id, firma.firmaAdi)
                }
              ] : []),
              isSuspended ? {
                label: t('aski_kaldir_aktiflestir', 'Askıyı Kaldır (Aktif Et)'),
                icon: <PlayCircle size={15} />,
                onClick: () => handleUnsuspend(firma.id, firma.firmaAdi)
              } : {
                label: t('firmayi_askiya_al_suspend', 'Firmayı Askıya Al (Suspend)'),
                icon: <PauseCircle size={15} />,
                onClick: () => handleSuspendPrompt(firma.id, firma.firmaAdi),
                danger: true
              },
              {
                label: t('veritabanini_sifirla_reset', 'Veritabanını Sıfırla (Reset)'),
                icon: <RotateCcw size={15} />,
                onClick: () => handleResetFirma(firma.id, firma.firmaAdi),
                danger: true
              },
              {
                label: t('firmayi_kalici_sil', 'Firmayı Kalıcı Sil'),
                icon: <Trash2 size={15} />,
                onClick: () => handleDeleteFirma(firma),
                danger: true
              }
            ]}
          />
        );
      }
    }
  ], [handleOpenForm, handleSureUzat, handleLisansaGecir, handleSuspendPrompt, handleUnsuspend, handleResetFirma, handleDeleteFirma, t]);

  const searchableFields = useMemo(() => [
    { id: 'Tumu', label: t('tum_alanlar', 'Tüm Alanlar') },
    { id: 'FirmaAdi', label: t('firma_adi', 'Firma Adı') },
    { id: 'VergiNo', label: t('vergi_numarasi', 'Vergi Numarası') },
    { id: 'Email', label: t('eposta', 'E-Posta') },
    { id: 'Yetkili', label: t('yetkili_kisi', 'Yetkili Kişi') }
  ], [t]);

  const mobileCardRender = useCallback((firma) => {
    const isSuspended = firma.askidaMi || !firma.aktifMi;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{firma.firmaAdi}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('vn_etiket', 'VN:')} {firma.vergiNo || '-'}</div>
          </div>
          <ActionMenu
            actions={[
              {
                label: t('Düzenle'),
                icon: <Edit2 size={15} />,
                isDefault: true,
                default: true,
                onClick: () => handleOpenForm(firma.id)
              },
              ...((firma.isDemo ?? firma.demoMu) ? [
                {
                  label: t('sure_uzat', 'Süre Uzat'),
                  icon: <Clock size={15} />,
                  onClick: () => handleSureUzat(firma.id, firma.firmaAdi)
                },
                {
                  label: t('normal_lisansa_gecir', 'Normal Lisansa Geçir'),
                  icon: <ShieldCheck size={15} />,
                  onClick: () => handleLisansaGecir(firma.id, firma.firmaAdi)
                }
              ] : []),
              isSuspended ? {
                label: t('aski_kaldir_aktiflestir', 'Askıyı Kaldır (Aktif Et)'),
                icon: <PlayCircle size={15} />,
                onClick: () => handleUnsuspend(firma.id, firma.firmaAdi)
              } : {
                label: t('firmayi_askiya_al_suspend', 'Firmayı Askıya Al (Suspend)'),
                icon: <PauseCircle size={15} />,
                onClick: () => handleSuspendPrompt(firma.id, firma.firmaAdi),
                danger: true
              },
              {
                label: t('veritabanini_sifirla_reset', 'Veritabanını Sıfırla (Reset)'),
                icon: <RotateCcw size={15} />,
                onClick: () => handleResetFirma(firma.id, firma.firmaAdi),
                danger: true
              },
              {
                label: t('firmayi_kalici_sil', 'Firmayı Kalıcı Sil'),
                icon: <Trash2 size={15} />,
                onClick: () => handleDeleteFirma(firma),
                danger: true
              }
            ]}
          />
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div><strong>{t('yetkili', 'Yetkili')}:</strong> {firma.yetkiliAdSoyad || '-'}</div>
          <div><strong>{t('eposta', 'E-Posta')}:</strong> {firma.email || '-'}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          {isSuspended ? (
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <PauseCircle size={12} />
              {t('askiya_alindi_rozet', 'Askıya Alındı (Suspend)')}
            </div>
          ) : (
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: (firma.isDemo ?? firma.demoMu) ? 'var(--accent-primary)' : 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Calendar size={12} />
              {firma.lisansKalanGun > 0 ? t('kalan_gun_sayisi', '{gun} gün kaldı', { gun: firma.lisansKalanGun }) : t('sure_bitti_kisa', 'SÜRE BİTTİ')}
            </div>
          )}
        </div>
      </div>
    );
  }, [handleOpenForm, handleSureUzat, handleLisansaGecir, handleSuspendPrompt, handleUnsuspend, handleResetFirma, handleDeleteFirma, t]);

  if (isFormMode) {
    return (
      <FirmaForm
        key={isYeni ? (location.state?.isNew ? `yeni-${location.key}` : 'yeni-firma') : `duzenle-${activeFirmaId}`}
        id={activeFirmaId}
        onClose={handleCloseForm}
        onSuccess={(savedId) => {
          refreshList();
          handleCloseForm(savedId);
        }}
      />
    );
  }

  return (
    <>
      <BaseListPage
        title={t('firmalar_baslik', 'Firmalar')}
        subtitle={t('firmalar_alt_baslik', 'Sisteme kayıtlı olan tüm firmaları (Firma) ve demo süreçlerini yönetin.')}
        icon={<Building size={24} />}
        apiEndpoint="/api/Firma"
        baseRoute="/firmalar"
        customFetchData={customFetchData}
        customDeleteData={customDeleteData}
        columns={columns}
        searchableFields={searchableFields}
        addNewText={t('yeni_firma_ekle', 'Yeni Firma Ekle')}
        onAddNew={() => handleOpenForm(null)}
        onEdit={(firma) => handleOpenForm(firma.id)}
        emptyMessage={t('firma_bulunamadi', 'Firma bulunamadı.')}
        itemNameResolver={(firma) => firma.firmaAdi || t('firma_varsayilan_ad', 'Firma')}
        mobileCardRender={mobileCardRender}
        enableColumnManagement={true}
      />

      {/* Süre Uzatma Prompt Modalı */}
      <BasePromptDialog
        isOpen={sureUzatPrompt.isOpen}
        onClose={() => setSureUzatPrompt({ isOpen: false, firmaId: null, firmaAdi: '' })}
        title={t('lisans_suresi_uzat_baslik', 'Lisans Süresi Uzat')}
        label={t('sure_uzatma_sorusu', { firmaAdi: sureUzatPrompt.firmaAdi })}
        initialValue="30"
        placeholder={t('gun_sayisi_placeholder', 'Gün sayısı (Örn: 30)')}
        confirmText={t('uzat_butonu', 'Uzat')}
        onConfirm={onConfirmSureUzat}
      />

      {/* Firmayı Askıya Alma (Suspend) Prompt Modalı */}
      <BasePromptDialog
        isOpen={suspendPrompt.isOpen}
        onClose={() => setSuspendPrompt({ isOpen: false, firmaId: null, firmaAdi: '' })}
        title={t('firmayi_askiya_al_baslik', 'Firmayı Askıya Al (Suspend)')}
        label={t('firmayi_askiya_al_soru', { firmaAdi: suspendPrompt.firmaAdi })}
        initialValue=""
        placeholder={t('aski_nedeni_placeholder', 'Askıya alma nedeni (Opsiyonel)')}
        confirmText={t('askiya_al_butonu', 'Askıya Al')}
        onConfirm={onConfirmSuspend}
      />
    </>
  );
}
