import { Button, Form, message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';

import { addUserData, selectUser } from '@/features/auth/userSlice';
import { setStoredActiveBusinessId } from '@/modules/auth/utils/businessContext';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import ROUTES_PATH from '@/router/routes/routesName';
import { PageLayout } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import {
  FormActionsBar,
} from './components/BusinessProfileSections';
import {
  BusinessProfileForm,
  type BusinessCountryOption,
  type BusinessProfileFormValues,
} from './components/BusinessProfileForm';
import { countries } from './countries.json';
import { beforeUpload } from './utils/imageUpload';
import { submitBusinessCreation } from './utils/businessCreateSubmission';
import { normalizeFormValues } from './utils/formValues';

const BusinessCreatePage = () => {
  const [form] = Form.useForm<BusinessProfileFormValues>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  const { HOME } = ROUTES_PATH.BASIC_TERM;
  const countryOptions = countries as BusinessCountryOption[];
  const isDeveloperUser = hasDeveloperAccess(user);

  const releasePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      releasePreviewUrl();
    },
    [releasePreviewUrl],
  );

  const handleLogoChange = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }

    if (info.file.status === 'done') {
      const file = info.file.originFileObj;
      if (!file) {
        setUploading(false);
        message.error('No se pudo procesar la imagen seleccionada.');
        return;
      }

      releasePreviewUrl();
      const nextPreviewUrl = URL.createObjectURL(file);
      previewUrlRef.current = nextPreviewUrl;
      setImageUrl(nextPreviewUrl);
      setLogoFile(file);
      form.setFieldsValue({ logo: nextPreviewUrl });
      setUploading(false);
      message.success('Logo listo. Se subirá al crear el negocio.');
      return;
    }

    if (info.file.status === 'error') {
      setUploading(false);
      message.error('No se pudo preparar el logo.');
    }
  };

  const handleResetLogo = () => {
    releasePreviewUrl();
    setImageUrl(null);
    setLogoFile(null);
    form.setFieldsValue({ logo: '' });
  };

  const handleSubmit = async (values: BusinessProfileFormValues) => {
    setSubmitting(true);
    const result = await submitBusinessCreation({
      logoFile,
      values,
    });
    setSubmitting(false);

    if (result.status === 'error') {
      message.error(result.errorMessage);
      return;
    }

    if (result.logoUploadErrorMessage) {
      message.warning(
        `Negocio creado, pero el logo no se pudo subir: ${result.logoUploadErrorMessage}`,
      );
    }

    dispatch(
      addUserData({
        businessID: result.createdBusinessId,
        businessId: result.createdBusinessId,
        activeBusinessId: result.createdBusinessId,
        lastSelectedBusinessId: result.createdBusinessId,
        activeBusinessRole: result.role,
        hasMultipleBusinesses: result.hasMultipleBusinesses,
        businessHasOwners: true,
        ...(!isDeveloperUser
          ? {
              role: result.role,
              activeRole: result.role,
            }
          : {}),
      }),
    );
    setStoredActiveBusinessId(result.createdBusinessId);

    if (result.status === 'pending_subscription') {
      message.warning(
        'Negocio creado. La activación del plan inicial quedó pendiente; revisa suscripción para completarla.',
      );
      navigate(ROUTES_PATH.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE, {
        replace: true,
      });
      return;
    }

    message.success('Negocio creado. Tu Demo inicial quedó activa.');
    navigate(HOME, { replace: true });
  };

  return (
    <PageLayout>
      <MenuApp sectionName={'Crear Nuevo Negocio'} />
      <CreatorScrollArea>
        <CreatorContent>
          <BusinessProfileForm
            beforeUpload={beforeUpload}
            countries={countryOptions}
            form={form}
            imageUrl={imageUrl}
            initialValues={normalizeFormValues()}
            onLogoChange={handleLogoChange}
            onResetLogo={handleResetLogo}
            onSubmit={handleSubmit}
            uploading={uploading}
          />
        </CreatorContent>
      </CreatorScrollArea>
      <FormActionsBar>
        <ActionButton onClick={() => navigate(HOME)} disabled={submitting}>
          Cancelar
        </ActionButton>
        <ActionButton
          type="primary"
          onClick={() => form.submit()}
          loading={submitting}
        >
          Crear negocio
        </ActionButton>
      </FormActionsBar>
    </PageLayout>
  );
};

export default BusinessCreatePage;

const CreatorScrollArea = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
`;

const CreatorContent = styled.div`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
`;

const ActionButton = styled(Button)`
  min-width: 150px;
`;

