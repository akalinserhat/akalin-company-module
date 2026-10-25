/**
 * @akalin/company_module - Firma Kullanıcı Davet Modalı (FirmaKullaniciDavetModal.tsx)
 * Kullanıcının e-posta adresine firmaya katılım daveti gönderir.
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Mail, Shield, Info } from 'lucide-react';
import { BasePopup, EmailInput, SaveButton, CancelButton, FieldError, useAdminValidation } from '@akalin/ui';
import { validateFirmaDavet } from '../validators/firmaDavetValidation';
import { useCompanyModule } from '../adapters/CompanyServiceContext';

export interface FirmaKullaniciDavetModalProps {
  isOpen: boolean;
  onClose: () => void;
  firmaId: number;
  firmaAdi?: string;
  onSuccess: () => void;
}

export default function FirmaKullaniciDavetModal({
  isOpen,
  onClose,
  firmaId,
  onSuccess
}: FirmaKullaniciDavetModalProps) {
  const { t } = useTranslation();
  const { adapter } = useCompanyModule();
  const { errors, clearError, clearErrors, validate } = useAdminValidation();

  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('Kullanıcı');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      clearErrors();
      // Varsayılan rolü ayarlardan çekmeye çalış
      adapter.getCompanyPolicies?.()
        .then(policies => {
          if (policies?.varsayilanRol) setRol(policies.varsayilanRol);
        })
        .catch(() => setRol('Kullanıcı'));
    }
  }, [isOpen, adapter, clearErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = { email, rol };
    const isValid = validate(validateFirmaDavet, data);
    if (!isValid) {
      return;
    }

    try {
      setIsSending(true);
      await adapter.sendInvitation(firmaId, email, rol);

      toast.success(
        t('davet_basariyla_gonderildi', 'Davet e-postası {{email}} adresine başarıyla gönderildi.', { email })
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.mesaj || err.message || t('davet_gonderilemedi', 'Davet gönderilirken bir hata oluştu.')
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      title={t('kullanici_davet_et_baslik', 'Firmaya Kullanıcı Davet Et')}
      modalSize="md"
      hideFooter={true}
    >
      <form onSubmit={handleSubmit} className="flex-col gap-20">
        {/* Bilgilendirme Kutusu */}
        <div className="card-message-banner flex-row items-center gap-12">
          <Info size={20} className="card-message-icon" />
          <div className="card-message-text">
            {t(
              'kullanici_davet_aciklama',
              'Kullanıcının e-posta adresine davet bağlantısı iletilecektir. Kullanıcı sistemde kayıtlıysa daveti tek tıkla onaylayabilir; kayıtlı değilse şifresini belirleyerek hesabını aktive edecektir.'
            )}
          </div>
        </div>

        <div className="form-grid">
          {/* E-Posta */}
          <div className="form-field full-width">
            <label className="form-label flex-row items-center gap-8">
              <Mail size={16} />
              <span>{t('kullanici_eposta', 'Kullanıcı E-Posta Adresi')}</span>
            </label>
            <EmailInput
              value={email}
              onChange={(e: any) => {
                const val = e && e.target ? e.target.value : e;
                setEmail(val);
                clearError('email');
              }}
              placeholder="ornek@sirketiniz.com"
            />
            <FieldError error={errors.email} />
          </div>

          {/* Rol Seçimi */}
          <div className="form-field full-width">
            <label className="form-label flex-row items-center gap-8">
              <Shield size={16} />
              <span>{t('kullanici_rolu', 'Kullanıcı Rolü')}</span>
            </label>
            <select
              className="form-input"
              value={rol}
              onChange={(e) => {
                setRol(e.target.value);
                clearError('rol');
              }}
            >
              <option value="Kullanıcı">{t('rol_kullanici', 'Kullanıcı')}</option>
              <option value="Yönetici">{t('rol_yonetici', 'Yönetici')}</option>
              <option value="Admin">{t('rol_admin', 'Admin')}</option>
            </select>
            <FieldError error={errors.rol} />
          </div>
        </div>

        {/* Modal Aksiyon Butonları */}
        <div className="flex-row items-center justify-between gap-12 modal-footer-actions">
          <CancelButton onClick={onClose} text={t('vazgec', 'Vazgeç')} />
          <SaveButton
            isSaving={isSending}
            text={t('davet_gonder', 'Davet Gönder')}
          />
        </div>
      </form>
    </BasePopup>
  );
}
