import type { AssetUploadStage } from './SignatureAssetsSection.types';

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const roundToStep = (value: number, step: number) => {
  const decimals = `${step}`.split('.')[1]?.length ?? 0;
  return Number(value.toFixed(decimals));
};

export const buildSteppedValue = (
  current: number,
  delta: number,
  min: number,
  max: number,
  step: number,
) => roundToStep(clampValue(current + delta, min, max), step);

export const TRANSFORM_LIMITS = {
  scale: {
    min: 0.1,
    max: 3.2,
    step: 0.01,
    buttonStep: 0.1,
  },
  offsetX: {
    min: -240,
    max: 240,
    step: 1,
    buttonStep: 5,
  },
  offsetY: {
    min: -160,
    max: 160,
    step: 1,
    buttonStep: 5,
  },
  opacity: {
    min: 0.3,
    max: 1,
    step: 0.01,
    buttonStep: 0.05,
  },
} as const;

export const getUploadButtonLabel = ({
  currentUploadStage,
  hasImage,
  isSignature,
}: {
  currentUploadStage: AssetUploadStage | null;
  hasImage: boolean;
  isSignature: boolean;
}) => {
  if (currentUploadStage === 'preparing') {
    return isSignature ? 'Preparando firma...' : 'Preparando sello...';
  }
  if (currentUploadStage === 'uploading') {
    return isSignature ? 'Subiendo firma...' : 'Subiendo sello...';
  }
  if (currentUploadStage === 'saving') {
    return isSignature ? 'Guardando firma...' : 'Guardando sello...';
  }
  if (hasImage) {
    return 'Cambiar';
  }
  return isSignature ? 'Subir firma' : 'Subir sello';
};

export const getUploadStatusText = (
  currentUploadStage: AssetUploadStage | null,
) => {
  if (currentUploadStage === 'preparing') {
    return 'Procesando y optimizando la imagen antes de subirla.';
  }
  if (currentUploadStage === 'uploading') {
    return 'Subiendo la imagen al almacenamiento.';
  }
  if (currentUploadStage === 'saving') {
    return 'Guardando la referencia de la imagen.';
  }
  return ' ';
};
