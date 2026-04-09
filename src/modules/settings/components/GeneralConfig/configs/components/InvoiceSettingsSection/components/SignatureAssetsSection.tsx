import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Slider, Switch, Tabs, Upload } from 'antd';
import styled from 'styled-components';
import type {
  UploadChangeParam,
  UploadFile,
  UploadProps,
} from 'antd/es/upload/interface';

import { SectionHeader, SectionWrapper } from '../styles';
import {
  formatSignedValue,
  type InvoiceAssetType,
  type NormalizedSignatureAssets,
  type SignatureTransformConfig,
  type StampTransformConfig,
} from '../utils/signatureAssets';

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const ToggleMeta = styled.div`
  display: grid;
  gap: 4px;
`;

const ToggleTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
`;

const ToggleHint = styled.p`
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
`;

const AssetCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: #fcfcfd;
`;

const AssetTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 16px;
  }

  .ant-tabs-tab {
    padding: 8px 0;
    font-weight: 600;
  }
`;

const AssetPreview = styled.div`
  height: 140px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background:
    linear-gradient(45deg, #f8fafc 25%, transparent 25%),
    linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f8fafc 75%),
    linear-gradient(-45deg, transparent 75%, #f8fafc 75%);
  background-size: 18px 18px;
  background-position:
    0 0,
    0 9px,
    9px -9px,
    -9px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 12px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const AssetPlaceholder = styled.span`
  font-size: 12px;
  color: #98a2b3;
`;

const AssetActions = styled.div`
  display: flex;
  gap: 8px;

  .ant-upload {
    width: 100%;
  }

  button {
    flex: 1;
  }
`;

const UploadStatus = styled.p`
  min-height: 18px;
  margin: 10px 0 0;
  font-size: 12px;
  color: #2563eb;
  line-height: 1.4;
`;

const AssetNote = styled.p`
  margin: 14px 0 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.45;
`;

const ControlGroup = styled.div`
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
  display: grid;
  gap: 12px;
`;

const ControlRow = styled.div`
  display: grid;
  gap: 6px;
`;

const SliderRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
`;

const FineTuneButtons = styled.div`
  display: inline-flex;
  gap: 6px;
`;

const ControlLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #475467;
`;

const ControlValue = styled.span`
  color: #667085;
  font-variant-numeric: tabular-nums;
`;

const ControlActions = styled.div`
  display: flex;
  gap: 8px;

  button {
    flex: 1;
  }
`;

type SignatureAssetsPatch =
  | Partial<NormalizedSignatureAssets>
  | {
      signature?: Partial<SignatureTransformConfig>;
      stamp?: Partial<StampTransformConfig>;
    };

type AssetUploadStage = 'preparing' | 'uploading' | 'saving';

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const roundToStep = (value: number, step: number) => {
  const decimals = `${step}`.split('.')[1]?.length ?? 0;
  return Number(value.toFixed(decimals));
};

const buildSteppedValue = (
  current: number,
  delta: number,
  min: number,
  max: number,
  step: number,
) => roundToStep(clampValue(current + delta, min, max), step);

interface SignatureAssetsSectionProps {
  signatureAssets: NormalizedSignatureAssets;
  isSavingAssets: boolean;
  uploadingAsset: InvoiceAssetType | null;
  assetUploadStage: Record<InvoiceAssetType, AssetUploadStage | null>;
  onAssetBeforeUpload: (assetType: InvoiceAssetType) => UploadProps['beforeUpload'];
  onToggle: (checked: boolean) => Promise<void>;
  onAssetUpload: (
    assetType: InvoiceAssetType,
  ) => (info: UploadChangeParam<UploadFile>) => Promise<void>;
  onAssetReset: (assetType: InvoiceAssetType) => Promise<void>;
  onUpdate: (patch: SignatureAssetsPatch) => void;
  onTransformSave: (assetType: InvoiceAssetType) => Promise<void>;
  onTransformReset: (assetType: InvoiceAssetType) => Promise<void>;
}

const buildAssetEditor = ({
  assetType,
  signatureAssets,
  isSavingAssets,
  uploadingAsset,
  assetUploadStage,
  onAssetBeforeUpload,
  onAssetUpload,
  onAssetReset,
  onUpdate,
  onTransformSave,
  onTransformReset,
}: {
  assetType: InvoiceAssetType;
} & Omit<SignatureAssetsSectionProps, 'onToggle'>) => {
  const isSignature = assetType === 'signature';
  const imageUrl = isSignature
    ? signatureAssets.signatureUrl
    : signatureAssets.stampUrl;
  const transform = isSignature
    ? signatureAssets.signature
    : signatureAssets.stamp;
  const currentUploadStage =
    uploadingAsset === assetType ? assetUploadStage[assetType] : null;
  const controlsDisabled =
    !imageUrl || isSavingAssets || Boolean(currentUploadStage);
  const uploadButtonLabel = currentUploadStage
    ? currentUploadStage === 'preparing'
      ? isSignature
        ? 'Preparando firma...'
        : 'Preparando sello...'
      : currentUploadStage === 'uploading'
        ? isSignature
          ? 'Subiendo firma...'
          : 'Subiendo sello...'
        : isSignature
          ? 'Guardando firma...'
          : 'Guardando sello...'
    : imageUrl
      ? 'Cambiar'
      : isSignature
        ? 'Subir firma'
        : 'Subir sello';
  const uploadStatusText = currentUploadStage
    ? currentUploadStage === 'preparing'
      ? 'Procesando y optimizando la imagen antes de subirla.'
      : currentUploadStage === 'uploading'
        ? 'Subiendo la imagen al almacenamiento.'
        : 'Guardando la referencia de la imagen.'
    : ' ';
  const scaleMin = 0.1;
  const scaleMax = 3.2;
  const scaleStep = 0.01;
  const scaleButtonStep = 0.1;
  const offsetXMin = -240;
  const offsetXMax = 240;
  const offsetYMin = -160;
  const offsetYMax = 160;
  const offsetStep = 1;
  const offsetButtonStep = 5;
  const opacityMin = 0.3;
  const opacityMax = 1;
  const opacityStep = 0.01;
  const opacityButtonStep = 0.05;

  const updateTransform = (
    patch: Partial<SignatureTransformConfig> | Partial<StampTransformConfig>,
  ) =>
    onUpdate({
      [assetType]: patch,
    } as SignatureAssetsPatch);

  return (
    <AssetCard>
      <AssetPreview>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={isSignature ? 'Firma del negocio' : 'Sello del negocio'}
          />
        ) : (
          <AssetPlaceholder>
            {isSignature ? 'Sin firma cargada' : 'Sin sello cargado'}
          </AssetPlaceholder>
        )}
      </AssetPreview>
      <AssetActions>
        <Upload
          showUploadList={false}
          beforeUpload={onAssetBeforeUpload(assetType)}
          onChange={onAssetUpload(assetType)}
          customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.('ok'), 0)}
          accept="image/png,image/jpeg"
          disabled={isSavingAssets || Boolean(currentUploadStage)}
        >
          <Button type="primary" loading={Boolean(currentUploadStage)}>
            {uploadButtonLabel}
          </Button>
        </Upload>
        <Button
          onClick={() => void onAssetReset(assetType)}
          disabled={!imageUrl || isSavingAssets || Boolean(currentUploadStage)}
        >
          Quitar
        </Button>
      </AssetActions>
      <UploadStatus>{uploadStatusText}</UploadStatus>
      <ControlGroup>
        <ControlRow>
          <ControlLabelRow>
            <span>Escala</span>
            <ControlValue>{transform.scale.toFixed(2)}x</ControlValue>
          </ControlLabelRow>
          <SliderRow>
            <Slider
              min={scaleMin}
              max={scaleMax}
              step={scaleStep}
              value={transform.scale}
              onChange={(value) =>
                updateTransform({ scale: value as number })
              }
              disabled={controlsDisabled}
            />
            <FineTuneButtons>
              <Button
                aria-label="Reducir escala"
                icon={<MinusOutlined />}
                onClick={() =>
                  updateTransform({
                    scale: buildSteppedValue(
                      transform.scale,
                      -scaleButtonStep,
                      scaleMin,
                      scaleMax,
                      scaleStep,
                    ),
                  })
                }
                disabled={controlsDisabled}
              />
              <Button
                aria-label="Aumentar escala"
                icon={<PlusOutlined />}
                onClick={() =>
                  updateTransform({
                    scale: buildSteppedValue(
                      transform.scale,
                      scaleButtonStep,
                      scaleMin,
                      scaleMax,
                      scaleStep,
                    ),
                  })
                }
                disabled={controlsDisabled}
              />
            </FineTuneButtons>
          </SliderRow>
        </ControlRow>
        <ControlRow>
          <ControlLabelRow>
            <span>Posición X</span>
            <ControlValue>{formatSignedValue(transform.offsetX)}</ControlValue>
          </ControlLabelRow>
          <SliderRow>
            <Slider
              min={offsetXMin}
              max={offsetXMax}
              step={offsetStep}
              value={transform.offsetX}
              onChange={(value) =>
                updateTransform({ offsetX: value as number })
              }
              disabled={controlsDisabled}
            />
            <FineTuneButtons>
              <Button
                aria-label="Mover a la izquierda"
                icon={<MinusOutlined />}
                onClick={() =>
                  updateTransform({
                    offsetX: buildSteppedValue(
                      transform.offsetX,
                      -offsetButtonStep,
                      offsetXMin,
                      offsetXMax,
                      offsetStep,
                    ),
                  })
                }
                disabled={controlsDisabled}
              />
              <Button
                aria-label="Mover a la derecha"
                icon={<PlusOutlined />}
                onClick={() =>
                  updateTransform({
                    offsetX: buildSteppedValue(
                      transform.offsetX,
                      offsetButtonStep,
                      offsetXMin,
                      offsetXMax,
                      offsetStep,
                    ),
                  })
                }
                disabled={controlsDisabled}
              />
            </FineTuneButtons>
          </SliderRow>
        </ControlRow>
        <ControlRow>
          <ControlLabelRow>
            <span>Posición Y</span>
            <ControlValue>{formatSignedValue(transform.offsetY)}</ControlValue>
          </ControlLabelRow>
          <SliderRow>
            <Slider
              min={offsetYMin}
              max={offsetYMax}
              step={offsetStep}
              value={transform.offsetY}
              onChange={(value) =>
                updateTransform({ offsetY: value as number })
              }
              disabled={controlsDisabled}
            />
            <FineTuneButtons>
              <Button
                aria-label="Subir"
                icon={<MinusOutlined />}
                onClick={() =>
                  updateTransform({
                    offsetY: buildSteppedValue(
                      transform.offsetY,
                      -offsetButtonStep,
                      offsetYMin,
                      offsetYMax,
                      offsetStep,
                    ),
                  })
                }
                disabled={controlsDisabled}
              />
              <Button
                aria-label="Bajar"
                icon={<PlusOutlined />}
                onClick={() =>
                  updateTransform({
                    offsetY: buildSteppedValue(
                      transform.offsetY,
                      offsetButtonStep,
                      offsetYMin,
                      offsetYMax,
                      offsetStep,
                    ),
                  })
                }
                disabled={controlsDisabled}
              />
            </FineTuneButtons>
          </SliderRow>
        </ControlRow>
        {!isSignature ? (
          <ControlRow>
            <ControlLabelRow>
              <span>Opacidad</span>
              <ControlValue>
                {Math.round(signatureAssets.stamp.opacity * 100)}%
              </ControlValue>
            </ControlLabelRow>
            <SliderRow>
              <Slider
                min={opacityMin}
                max={opacityMax}
                step={opacityStep}
                value={signatureAssets.stamp.opacity}
                onChange={(value) =>
                  onUpdate({
                    stamp: { opacity: value as number },
                  })
                }
                disabled={controlsDisabled}
              />
              <FineTuneButtons>
                <Button
                  aria-label="Reducir opacidad"
                  icon={<MinusOutlined />}
                  onClick={() =>
                    onUpdate({
                      stamp: {
                        opacity: buildSteppedValue(
                          signatureAssets.stamp.opacity,
                          -opacityButtonStep,
                          opacityMin,
                          opacityMax,
                          opacityStep,
                        ),
                      },
                    })
                  }
                  disabled={controlsDisabled}
                />
                <Button
                  aria-label="Aumentar opacidad"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    onUpdate({
                      stamp: {
                        opacity: buildSteppedValue(
                          signatureAssets.stamp.opacity,
                          opacityButtonStep,
                          opacityMin,
                          opacityMax,
                          opacityStep,
                        ),
                      },
                    })
                  }
                  disabled={controlsDisabled}
                />
              </FineTuneButtons>
            </SliderRow>
          </ControlRow>
        ) : null}
        <ControlActions>
          <Button
            onClick={() => void onTransformSave(assetType)}
            disabled={controlsDisabled}
          >
            Guardar ajuste
          </Button>
          <Button
            onClick={() => void onTransformReset(assetType)}
            disabled={controlsDisabled}
          >
            Restablecer
          </Button>
        </ControlActions>
      </ControlGroup>
    </AssetCard>
  );
};

export const SignatureAssetsSection = ({
  signatureAssets,
  isSavingAssets,
  uploadingAsset,
  assetUploadStage,
  onAssetBeforeUpload,
  onToggle,
  onAssetUpload,
  onAssetReset,
  onUpdate,
  onTransformSave,
  onTransformReset,
}: SignatureAssetsSectionProps) => (
  <SectionWrapper style={{ marginBottom: '24px' }}>
    <SectionHeader>
      <h3>Firma y Sello</h3>
    </SectionHeader>

    <ToggleRow>
      <ToggleMeta>
        <ToggleTitle>Firma y sello automáticos</ToggleTitle>
        <ToggleHint>
          Se imprimen en el bloque de &quot;Despachado Por&quot;.
        </ToggleHint>
      </ToggleMeta>
      <Switch
        checked={signatureAssets.enabled}
        onChange={(checked) => void onToggle(checked)}
        loading={isSavingAssets}
      />
    </ToggleRow>

    <AssetTabs
      defaultActiveKey="signature"
      destroyOnHidden={false}
      items={[
        {
          key: 'signature',
          label: 'Firma',
          children: buildAssetEditor({
            assetType: 'signature',
            signatureAssets,
            isSavingAssets,
            uploadingAsset,
            assetUploadStage,
            onAssetBeforeUpload,
            onAssetUpload,
            onAssetReset,
            onUpdate,
            onTransformSave,
            onTransformReset,
          }),
        },
        {
          key: 'stamp',
          label: 'Sello',
          children: buildAssetEditor({
            assetType: 'stamp',
            signatureAssets,
            isSavingAssets,
            uploadingAsset,
            assetUploadStage,
            onAssetBeforeUpload,
            onAssetUpload,
            onAssetReset,
            onUpdate,
            onTransformSave,
            onTransformReset,
          }),
        },
      ]}
    />

    <AssetNote>
      Recomendado: firma en PNG con transparencia y sello cuadrado con buen
      contraste. Puedes dejar uno de los dos vacío.
    </AssetNote>
  </SectionWrapper>
);
