import type { UploadFile, UploadProps } from 'antd';
import type { UploadChangeParam } from 'antd/es/upload/interface';

import type {
  InvoiceAssetType,
  NormalizedSignatureAssets,
  SignatureTransformConfig,
  StampTransformConfig,
} from '../utils/signatureAssets';

export type SignatureAssetsPatch =
  | Partial<NormalizedSignatureAssets>
  | {
      signature?: Partial<SignatureTransformConfig>;
      stamp?: Partial<StampTransformConfig>;
    };

export type AssetUploadStage = 'preparing' | 'uploading' | 'saving';

export interface SignatureAssetsSectionProps {
  signatureAssets: NormalizedSignatureAssets;
  isSavingAssets: boolean;
  uploadingAsset: InvoiceAssetType | null;
  assetUploadStage: Record<InvoiceAssetType, AssetUploadStage | null>;
  onAssetBeforeUpload: (
    assetType: InvoiceAssetType,
  ) => UploadProps['beforeUpload'];
  onToggle: (checked: boolean) => Promise<void>;
  onAssetUpload: (
    assetType: InvoiceAssetType,
  ) => (info: UploadChangeParam<UploadFile>) => Promise<void>;
  onAssetReset: (assetType: InvoiceAssetType) => Promise<void>;
  onUpdate: (patch: SignatureAssetsPatch) => void;
  onTransformSave: (assetType: InvoiceAssetType) => Promise<void>;
  onTransformReset: (assetType: InvoiceAssetType) => Promise<void>;
}

export type AssetEditorProps = {
  assetType: InvoiceAssetType;
} & Omit<SignatureAssetsSectionProps, 'onToggle'>;
