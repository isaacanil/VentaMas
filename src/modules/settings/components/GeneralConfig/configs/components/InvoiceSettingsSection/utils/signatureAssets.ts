import type { InvoiceSignatureAssets } from '@/types/invoice';

export interface InvoiceFormValues {
  invoiceMessage?: string;
}

export type InvoiceAssetType = 'signature' | 'stamp';

export type SignatureTransformConfig = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type StampTransformConfig = SignatureTransformConfig & {
  opacity: number;
};

export type NormalizedSignatureAssets = {
  enabled: boolean;
  signatureUrl: string;
  stampUrl: string;
  signature: SignatureTransformConfig;
  stamp: StampTransformConfig;
};

export const DEFAULT_SIGNATURE_TRANSFORM: SignatureTransformConfig = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export const DEFAULT_STAMP_TRANSFORM: StampTransformConfig = {
  scale: 0.82,
  offsetX: 0,
  offsetY: 0,
  opacity: 0.92,
};

export const formatSignedValue = (value: number) =>
  `${value > 0 ? '+' : ''}${value}`;

export const normalizeSignatureAssets = (
  value: InvoiceSignatureAssets | null | undefined,
): NormalizedSignatureAssets => ({
  enabled: Boolean(value?.enabled),
  signatureUrl:
    typeof value?.signatureUrl === 'string' ? value.signatureUrl : '',
  stampUrl: typeof value?.stampUrl === 'string' ? value.stampUrl : '',
  signature: {
    scale:
      typeof value?.signature?.scale === 'number'
        ? value.signature.scale
        : DEFAULT_SIGNATURE_TRANSFORM.scale,
    offsetX:
      typeof value?.signature?.offsetX === 'number'
        ? value.signature.offsetX
        : DEFAULT_SIGNATURE_TRANSFORM.offsetX,
    offsetY:
      typeof value?.signature?.offsetY === 'number'
        ? value.signature.offsetY
        : DEFAULT_SIGNATURE_TRANSFORM.offsetY,
  },
  stamp: {
    scale:
      typeof value?.stamp?.scale === 'number'
        ? value.stamp.scale
        : DEFAULT_STAMP_TRANSFORM.scale,
    offsetX:
      typeof value?.stamp?.offsetX === 'number'
        ? value.stamp.offsetX
        : DEFAULT_STAMP_TRANSFORM.offsetX,
    offsetY:
      typeof value?.stamp?.offsetY === 'number'
        ? value.stamp.offsetY
        : DEFAULT_STAMP_TRANSFORM.offsetY,
    opacity:
      typeof value?.stamp?.opacity === 'number'
        ? value.stamp.opacity
        : DEFAULT_STAMP_TRANSFORM.opacity,
  },
});
