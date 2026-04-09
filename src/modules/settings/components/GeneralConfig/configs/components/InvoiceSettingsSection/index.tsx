import { Form, Input, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type {
  RcFile,
  UploadChangeParam,
  UploadFile,
  UploadProps,
} from 'antd/es/upload/interface';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { selectUser } from '@/features/auth/userSlice';
import {
  fbRemoveBusinessInvoiceSignatureAsset,
  fbUpdateInvoiceMessage,
  fbUpdateInvoiceSignatureAssets,
  fbUploadBusinessInvoiceSignatureAsset,
} from '@/firebase/businessInfo/fbAddBusinessInfo';
import InvoiceTemplates from '@/modules/invoice/components/Invoice/components/InvoiceTemplates/InvoiceTemplates';
import { beforeUpload as processAssetBeforeUpload } from '@/modules/settings/pages/setting/subPage/BusinessEditor/utils/imageUpload';
import type { InvoiceSignatureAssets } from '@/types/invoice';
import { isInvoiceTemplateV3Beta } from '@/utils/invoice/template';

import DueDateConfig from '../DueDateConfig';
import { AdditionalInfoSection } from './components/AdditionalInfoSection';
import { DueDateSection } from './components/DueDateSection';
import { SignatureAssetsSection } from './components/SignatureAssetsSection';
import { VisualStyleSection } from './components/VisualStyleSection';
import {
  ConfigSidebar,
  MainLayout,
  PreviewCanvas,
  StyledForm,
} from './styles';
import {
  DEFAULT_SIGNATURE_TRANSFORM,
  DEFAULT_STAMP_TRANSFORM,
  normalizeSignatureAssets,
  type InvoiceAssetType,
  type InvoiceFormValues,
  type NormalizedSignatureAssets,
  type SignatureTransformConfig,
  type StampTransformConfig,
} from './utils/signatureAssets';

type AssetUploadStage = 'preparing' | 'uploading' | 'saving';

const INITIAL_ASSET_UPLOAD_STAGE: Record<InvoiceAssetType, AssetUploadStage | null> =
  {
    signature: null,
    stamp: null,
  };

const InvoiceSettingsSection = () => {
  const [form] = Form.useForm<InvoiceFormValues>();
  const business = useSelector(selectBusinessData);
  const {
    billing: { invoiceType: selectedInvoiceType },
  } = useSelector(SelectSettingCart);
  const user = useSelector(selectUser);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAssets, setIsSavingAssets] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<InvoiceAssetType | null>(
    null,
  );
  const [assetUploadStage, setAssetUploadStage] = useState(
    INITIAL_ASSET_UPLOAD_STAGE,
  );
  const [messageApi, contextHolder] = message.useMessage();
  const currentMessage = business?.invoice?.invoiceMessage || '';
  const currentSignatureAssets = useMemo(
    () => normalizeSignatureAssets(business?.invoice?.signatureAssets),
    [business?.invoice?.signatureAssets],
  );
  const showSignatureAssetsSection = isInvoiceTemplateV3Beta(
    selectedInvoiceType || business?.invoice?.invoiceType,
  );
  const [signatureAssets, setSignatureAssets] = useState(
    currentSignatureAssets,
  );

  useEffect(() => {
    form.setFieldsValue({ invoiceMessage: currentMessage });
  }, [form, currentMessage]);

  useEffect(() => {
    setSignatureAssets(currentSignatureAssets);
  }, [currentSignatureAssets]);

  const handleInvoiceMessageBlur = () => {
    const value = form.getFieldValue('invoiceMessage') ?? '';
    const previousValue = business?.invoice?.invoiceMessage || '';

    if (value === previousValue) return;

    if (!user?.businessID) {
      messageApi.error('No se pudo guardar el mensaje.');
      form.setFieldsValue({ invoiceMessage: previousValue });
      return;
    }

    setIsSaving(true);
    void fbUpdateInvoiceMessage(user, value).then(
      () => {
        messageApi.success('Mensaje actualizado');
        setIsSaving(false);
      },
      () => {
        messageApi.error('No se pudo guardar el mensaje');
        form.setFieldsValue({ invoiceMessage: previousValue });
        setIsSaving(false);
      },
    );
  };

  const persistSignatureAssets = useCallback(
    async (
      nextAssets: NormalizedSignatureAssets,
      successMessage: string,
    ) => {
      if (!user?.businessID) {
        messageApi.error('No se pudo guardar la configuración visual.');
        setSignatureAssets(currentSignatureAssets);
        return false;
      }

      setIsSavingAssets(true);
      try {
        await fbUpdateInvoiceSignatureAssets(user, nextAssets);
        setSignatureAssets(nextAssets);
        messageApi.success(successMessage);
        return true;
      } catch {
        setSignatureAssets(currentSignatureAssets);
        messageApi.error('No se pudo guardar la configuración visual.');
        return false;
      } finally {
        setIsSavingAssets(false);
      }
    },
    [currentSignatureAssets, messageApi, user],
  );

  const updateSignatureAssets = useCallback(
    (
      patch:
        | Partial<NormalizedSignatureAssets>
        | {
            signature?: Partial<SignatureTransformConfig>;
            stamp?: Partial<StampTransformConfig>;
          },
    ) => {
      setSignatureAssets((current) => ({
        ...current,
        ...patch,
        signature: {
          ...current.signature,
          ...('signature' in patch ? patch.signature : {}),
        },
        stamp: {
          ...current.stamp,
          ...('stamp' in patch ? patch.stamp : {}),
        },
      }));
    },
    [],
  );

  const handleSignatureAssetsToggle = async (checked: boolean) => {
    const nextAssets = {
      ...signatureAssets,
      enabled: checked,
    };

    setSignatureAssets(nextAssets);
    await persistSignatureAssets(
      nextAssets,
      checked
        ? 'Firma y sello automáticos activados'
        : 'Firma y sello automáticos desactivados',
    );
  };

  const handleAssetUpload =
    (assetType: InvoiceAssetType) =>
    async (info: UploadChangeParam<UploadFile>) => {
      if (info.file.status === 'uploading') {
        setUploadingAsset(assetType);
        setAssetUploadStage((current) => ({
          ...current,
          [assetType]: 'uploading',
        }));
        return;
      }

      if (info.file.status === 'error' || info.file.status === 'removed') {
        setUploadingAsset(null);
        setAssetUploadStage((current) => ({
          ...current,
          [assetType]: null,
        }));
        return;
      }

      if (info.file.status !== 'done') {
        return;
      }

      if (!user?.businessID) {
        messageApi.error('No se pudo subir la imagen.');
        setUploadingAsset(null);
        setAssetUploadStage((current) => ({
          ...current,
          [assetType]: null,
        }));
        return;
      }

      const file = info.file.originFileObj;
      if (!file) {
        messageApi.error('No se pudo procesar la imagen seleccionada.');
        setUploadingAsset(null);
        setAssetUploadStage((current) => ({
          ...current,
          [assetType]: null,
        }));
        return;
      }

      const fieldName = assetType === 'signature' ? 'signatureUrl' : 'stampUrl';

      try {
        const downloadURL = await fbUploadBusinessInvoiceSignatureAsset(
          user,
          assetType,
          file,
          (stage) =>
            setAssetUploadStage((current) => ({
              ...current,
              [assetType]: stage,
            })),
        );

        if (!downloadURL) {
          throw new Error('No se recibió URL de descarga.');
        }

        const nextAssets = {
          ...signatureAssets,
          [fieldName]: downloadURL,
        };

        setSignatureAssets(nextAssets);

        if (!signatureAssets.enabled) {
          setAssetUploadStage((current) => ({
            ...current,
            [assetType]: 'saving',
          }));
          const enabledAssets = {
            ...nextAssets,
            enabled: true,
          };
          await persistSignatureAssets(
            enabledAssets,
            assetType === 'signature'
              ? 'Firma cargada y activada'
              : 'Sello cargado y activado',
          );
        } else {
          messageApi.success(
            assetType === 'signature'
              ? 'Firma actualizada'
              : 'Sello actualizado',
          );
        }
      } catch {
        setSignatureAssets(currentSignatureAssets);
        messageApi.error('No se pudo subir la imagen.');
      } finally {
        setUploadingAsset(null);
        setAssetUploadStage((current) => ({
          ...current,
          [assetType]: null,
        }));
      }
    };

  const handleAssetBeforeUpload = useCallback(
    (assetType: InvoiceAssetType): UploadProps['beforeUpload'] =>
      async (file) => {
        setUploadingAsset(assetType);
        setAssetUploadStage((current) => ({
          ...current,
          [assetType]: 'preparing',
        }));

        const processedFile = await processAssetBeforeUpload(file as RcFile);

        if (!processedFile) {
          setUploadingAsset(null);
          setAssetUploadStage((current) => ({
            ...current,
            [assetType]: null,
          }));
          return false;
        }

        return processedFile;
      },
    [],
  );

  const handleAssetReset = async (assetType: InvoiceAssetType) => {
    if (!user?.businessID) {
      messageApi.error('No se pudo quitar la imagen.');
      return;
    }

    const fieldName = assetType === 'signature' ? 'signatureUrl' : 'stampUrl';
    const nextAssets = {
      ...signatureAssets,
      [fieldName]: '',
    };

    setIsSavingAssets(true);
    try {
      await fbRemoveBusinessInvoiceSignatureAsset(user, assetType);
      setSignatureAssets(nextAssets);
      messageApi.success(
        assetType === 'signature' ? 'Firma eliminada' : 'Sello eliminado',
      );
    } catch {
      setSignatureAssets(currentSignatureAssets);
      messageApi.error('No se pudo quitar la imagen.');
    } finally {
      setIsSavingAssets(false);
    }
  };

  const handleTransformSave = async (assetType: InvoiceAssetType) => {
    await persistSignatureAssets(
      signatureAssets,
      assetType === 'signature'
        ? 'Ajuste de firma guardado'
        : 'Ajuste de sello guardado',
    );
  };

  const handleTransformReset = async (assetType: InvoiceAssetType) => {
    const nextAssets: NormalizedSignatureAssets =
      assetType === 'signature'
        ? {
            ...signatureAssets,
            signature: DEFAULT_SIGNATURE_TRANSFORM,
          }
        : {
            ...signatureAssets,
            stamp: DEFAULT_STAMP_TRANSFORM,
          };

    setSignatureAssets(nextAssets);
    await persistSignatureAssets(
      nextAssets,
      assetType === 'signature'
        ? 'Ajuste de firma restablecido'
        : 'Ajuste de sello restablecido',
    );
  };

  return (
    <MainLayout>
      {contextHolder}
      <ConfigSidebar>
        <StyledForm layout="vertical" form={form}>
          <VisualStyleSection />
          <DueDateSection>
            <DueDateConfig />
          </DueDateSection>
          {showSignatureAssetsSection ? (
            <SignatureAssetsSection
              signatureAssets={signatureAssets}
              isSavingAssets={isSavingAssets}
              uploadingAsset={uploadingAsset}
              assetUploadStage={assetUploadStage}
              onAssetBeforeUpload={handleAssetBeforeUpload}
              onToggle={handleSignatureAssetsToggle}
              onAssetUpload={handleAssetUpload}
              onAssetReset={handleAssetReset}
              onUpdate={updateSignatureAssets}
              onTransformSave={handleTransformSave}
              onTransformReset={handleTransformReset}
            />
          ) : null}
          <AdditionalInfoSection
            isSaving={isSaving}
            onBlur={handleInvoiceMessageBlur}
          />
        </StyledForm>
      </ConfigSidebar>

      <PreviewCanvas>
        <InvoiceTemplates
          onlyPreview
          previewSignatureAssets={signatureAssets as InvoiceSignatureAssets}
        />
      </PreviewCanvas>
    </MainLayout>
  );
};

export default InvoiceSettingsSection;
