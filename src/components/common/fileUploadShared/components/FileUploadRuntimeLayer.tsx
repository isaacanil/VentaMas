import DragOverlay, { type DragOverlayProps } from './DragOverlay';
import ImageLightbox from './ImageLightbox';
import PreviewContent, { type PreviewContentProps } from './PreviewContent';

import type { LightboxSlide, PreviewableFile } from '../types';

type FileUploadRuntimeLayerProps<TFile extends PreviewableFile> =
  PreviewContentProps<TFile> &
    Pick<
      DragOverlayProps,
      'fileType' | 'isDragging' | 'onDragLeave' | 'onDragOver' | 'onDrop'
    > & {
      imageSlides: LightboxSlide[];
      lightboxIndex: number;
      lightboxOpen: boolean;
      setLightboxIndex?: (index: number) => void;
      setLightboxOpen: (open: boolean) => void;
    };

const FileUploadRuntimeLayer = <TFile extends PreviewableFile>({
  fileType,
  imageSlides,
  isDragging,
  lightboxIndex,
  lightboxOpen,
  onDragLeave,
  onDragOver,
  onDrop,
  previewFile,
  previewVisible,
  setLightboxIndex,
  setLightboxOpen,
  setPreviewFile,
  setPreviewVisible,
}: FileUploadRuntimeLayerProps<TFile>) => (
  <>
    <PreviewContent<TFile>
      previewFile={previewFile}
      previewVisible={previewVisible}
      setPreviewVisible={setPreviewVisible}
      setPreviewFile={setPreviewFile}
    />

    <ImageLightbox
      lightboxOpen={lightboxOpen}
      setLightboxOpen={setLightboxOpen}
      lightboxIndex={lightboxIndex}
      setLightboxIndex={setLightboxIndex}
      slides={imageSlides}
    />

    <DragOverlay
      isDragging={isDragging}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      fileType={fileType}
    />
  </>
);

export default FileUploadRuntimeLayer;
