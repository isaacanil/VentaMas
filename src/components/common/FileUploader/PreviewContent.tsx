import type { Dispatch, SetStateAction } from 'react';

import SharedPreviewContent from '../fileUploadShared/components/PreviewContent';
import type { PreviewableFile } from '../fileUploadShared/types';

type PreviewContentProps = {
  previewFile: PreviewableFile | null;
  previewVisible: boolean;
  setPreviewVisible: (visible: boolean) => void;
  setPreviewFile: Dispatch<SetStateAction<PreviewableFile | null>>;
};

const PreviewContent = ({
  previewFile,
  previewVisible,
  setPreviewVisible,
  setPreviewFile,
}: PreviewContentProps) => (
  <SharedPreviewContent
    previewFile={previewFile}
    previewVisible={previewVisible}
    setPreviewVisible={setPreviewVisible}
    setPreviewFile={(file) => setPreviewFile(file)}
  />
);

export default PreviewContent;
