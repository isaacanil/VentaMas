import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Slider, Upload } from 'antd';

import {
  formatSignedValue,
  type SignatureTransformConfig,
  type StampTransformConfig,
} from '../utils/signatureAssets';

import {
  buildSteppedValue,
  getUploadButtonLabel,
  getUploadStatusText,
  TRANSFORM_LIMITS,
} from './SignatureAssetsSection.helpers';
import {
  AssetActions,
  AssetCard,
  AssetPlaceholder,
  AssetPreview,
  ControlActions,
  ControlGroup,
  ControlLabelRow,
  ControlRow,
  ControlValue,
  FineTuneButtons,
  SliderRow,
  UploadStatus,
} from './SignatureAssetsSection.styles';
import type {
  AssetEditorProps,
  SignatureAssetsPatch,
} from './SignatureAssetsSection.types';

export const AssetEditor = ({
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
}: AssetEditorProps) => {
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
  const uploadButtonLabel = getUploadButtonLabel({
    currentUploadStage,
    hasImage: Boolean(imageUrl),
    isSignature,
  });
  const uploadStatusText = getUploadStatusText(currentUploadStage);

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
          customRequest={({ onSuccess }) =>
            setTimeout(() => onSuccess?.('ok'), 0)
          }
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
              min={TRANSFORM_LIMITS.scale.min}
              max={TRANSFORM_LIMITS.scale.max}
              step={TRANSFORM_LIMITS.scale.step}
              value={transform.scale}
              onChange={(value) => updateTransform({ scale: value as number })}
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
                      -TRANSFORM_LIMITS.scale.buttonStep,
                      TRANSFORM_LIMITS.scale.min,
                      TRANSFORM_LIMITS.scale.max,
                      TRANSFORM_LIMITS.scale.step,
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
                      TRANSFORM_LIMITS.scale.buttonStep,
                      TRANSFORM_LIMITS.scale.min,
                      TRANSFORM_LIMITS.scale.max,
                      TRANSFORM_LIMITS.scale.step,
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
            <span>Posicion X</span>
            <ControlValue>{formatSignedValue(transform.offsetX)}</ControlValue>
          </ControlLabelRow>
          <SliderRow>
            <Slider
              min={TRANSFORM_LIMITS.offsetX.min}
              max={TRANSFORM_LIMITS.offsetX.max}
              step={TRANSFORM_LIMITS.offsetX.step}
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
                      -TRANSFORM_LIMITS.offsetX.buttonStep,
                      TRANSFORM_LIMITS.offsetX.min,
                      TRANSFORM_LIMITS.offsetX.max,
                      TRANSFORM_LIMITS.offsetX.step,
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
                      TRANSFORM_LIMITS.offsetX.buttonStep,
                      TRANSFORM_LIMITS.offsetX.min,
                      TRANSFORM_LIMITS.offsetX.max,
                      TRANSFORM_LIMITS.offsetX.step,
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
            <span>Posicion Y</span>
            <ControlValue>{formatSignedValue(transform.offsetY)}</ControlValue>
          </ControlLabelRow>
          <SliderRow>
            <Slider
              min={TRANSFORM_LIMITS.offsetY.min}
              max={TRANSFORM_LIMITS.offsetY.max}
              step={TRANSFORM_LIMITS.offsetY.step}
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
                      -TRANSFORM_LIMITS.offsetY.buttonStep,
                      TRANSFORM_LIMITS.offsetY.min,
                      TRANSFORM_LIMITS.offsetY.max,
                      TRANSFORM_LIMITS.offsetY.step,
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
                      TRANSFORM_LIMITS.offsetY.buttonStep,
                      TRANSFORM_LIMITS.offsetY.min,
                      TRANSFORM_LIMITS.offsetY.max,
                      TRANSFORM_LIMITS.offsetY.step,
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
                min={TRANSFORM_LIMITS.opacity.min}
                max={TRANSFORM_LIMITS.opacity.max}
                step={TRANSFORM_LIMITS.opacity.step}
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
                          -TRANSFORM_LIMITS.opacity.buttonStep,
                          TRANSFORM_LIMITS.opacity.min,
                          TRANSFORM_LIMITS.opacity.max,
                          TRANSFORM_LIMITS.opacity.step,
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
                          TRANSFORM_LIMITS.opacity.buttonStep,
                          TRANSFORM_LIMITS.opacity.min,
                          TRANSFORM_LIMITS.opacity.max,
                          TRANSFORM_LIMITS.opacity.step,
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
