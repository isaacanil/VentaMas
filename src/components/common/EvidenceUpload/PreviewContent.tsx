import type { EvidenceFile } from './types';
import SharedPreviewContent from '../fileUploadShared/components/PreviewContent';

interface PreviewContentProps {
  previewFile: EvidenceFile | null;
  previewVisible: boolean;
  setPreviewVisible: (value: boolean) => void;
  setPreviewFile: (file: EvidenceFile | null) => void;
}

const PreviewContent = (props: PreviewContentProps) => (
  <SharedPreviewContent {...props} />
);

export default PreviewContent;
