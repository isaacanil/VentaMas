import type { Dispatch, SetStateAction } from 'react';

import SharedPreviewContent from '../fileUploadShared/components/PreviewContent';

type PreviewFile = {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  preview?: string | null;
  file?: File;
};

type PreviewContentProps = {
  previewFile: PreviewFile | null;
  previewVisible: boolean;
  setPreviewVisible: (visible: boolean) => void;
  setPreviewFile: Dispatch<SetStateAction<PreviewFile | null>>;
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
