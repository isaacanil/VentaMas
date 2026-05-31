import { Switch } from 'antd';

import { SectionHeader, SectionWrapper } from '../styles';

import { AssetEditor } from './AssetEditor';
import {
  AssetNote,
  AssetTabs,
  ToggleHint,
  ToggleMeta,
  ToggleRow,
  ToggleTitle,
} from './SignatureAssetsSection.styles';
import type { SignatureAssetsSectionProps } from './SignatureAssetsSection.types';

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
  <SectionWrapper $withBottomSpace>
    <SectionHeader>
      <h3>Firma y Sello</h3>
    </SectionHeader>

    <ToggleRow>
      <ToggleMeta>
        <ToggleTitle>Firma y sello automaticos</ToggleTitle>
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
          children: (
            <AssetEditor
              assetType="signature"
              signatureAssets={signatureAssets}
              isSavingAssets={isSavingAssets}
              uploadingAsset={uploadingAsset}
              assetUploadStage={assetUploadStage}
              onAssetBeforeUpload={onAssetBeforeUpload}
              onAssetUpload={onAssetUpload}
              onAssetReset={onAssetReset}
              onUpdate={onUpdate}
              onTransformSave={onTransformSave}
              onTransformReset={onTransformReset}
            />
          ),
        },
        {
          key: 'stamp',
          label: 'Sello',
          children: (
            <AssetEditor
              assetType="stamp"
              signatureAssets={signatureAssets}
              isSavingAssets={isSavingAssets}
              uploadingAsset={uploadingAsset}
              assetUploadStage={assetUploadStage}
              onAssetBeforeUpload={onAssetBeforeUpload}
              onAssetUpload={onAssetUpload}
              onAssetReset={onAssetReset}
              onUpdate={onUpdate}
              onTransformSave={onTransformSave}
              onTransformReset={onTransformReset}
            />
          ),
        },
      ]}
    />

    <AssetNote>
      Recomendado: firma en PNG con transparencia y sello cuadrado con buen
      contraste. Puedes dejar uno de los dos vacio.
    </AssetNote>
  </SectionWrapper>
);
