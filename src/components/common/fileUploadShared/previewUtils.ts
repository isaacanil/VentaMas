import { isImageFile } from '@/utils/fileUtils';

import type { LightboxSlide, PreviewableFile } from './types';

const FIREBASE_STORAGE_HOST = 'firebasestorage.googleapis.com';

type RemoteAttachmentLike = {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  url?: string | null;
};

type LocalPreviewLike = PreviewableFile & {
  isLocal?: boolean;
};

export type FirebaseRemoteAttachmentPreviewItem<TType extends string = string> = {
  id: string;
  name: string;
  type: TType;
  url: string;
  isLocal: false;
  preview: null;
};

type NormalizeFirebaseRemoteAttachmentsOptions<
  TAttachment extends RemoteAttachmentLike,
  TType extends string,
> = {
  fallbackName?: string;
  fallbackType?: TType;
  fallbackUrl?: string;
  resolveType?: (attachment: TAttachment, url: string) => TType | null | undefined;
  resolveUrl?: (attachment: TAttachment) => string | null | undefined;
};

export const isFirebaseStorageUrl = (url?: string | null): boolean =>
  Boolean(url?.includes(FIREBASE_STORAGE_HOST));

export const createRemoteAttachmentId = (
  attachment: RemoteAttachmentLike,
  index: number,
): string =>
  attachment.id ||
  attachment.url ||
  `${attachment.name || 'attachment'}-${index}`;

export const normalizeFirebaseRemoteAttachments = <
  TAttachment extends RemoteAttachmentLike,
  TType extends string = string,
>(
  attachments: readonly TAttachment[] | null | undefined,
  options: NormalizeFirebaseRemoteAttachmentsOptions<TAttachment, TType> = {},
): FirebaseRemoteAttachmentPreviewItem<TType>[] => {
  const {
    fallbackName = 'Archivo sin nombre',
    fallbackType = 'other' as TType,
    fallbackUrl = '',
    resolveType,
    resolveUrl,
  } = options;

  const normalizedAttachments: FirebaseRemoteAttachmentPreviewItem<TType>[] = [];

  (attachments ?? []).forEach((attachment, index) => {
    const url = resolveUrl?.(attachment) || attachment.url || fallbackUrl;
    if (!isFirebaseStorageUrl(url)) return;

    normalizedAttachments.push({
      id: createRemoteAttachmentId({ ...attachment, url }, index),
      name: attachment.name || fallbackName,
      type:
        (attachment.type as TType | null | undefined) ||
        resolveType?.(attachment, url) ||
        fallbackType,
      url,
      isLocal: false,
      preview: null,
    });
  });

  return normalizedAttachments;
};

export const getFilePreviewSource = (file: PreviewableFile): string =>
  file.preview || file.url || '';

export const createImageLightboxSlides = (
  files: PreviewableFile[],
): LightboxSlide[] =>
  files
    .filter((file) => isImageFile(file.name ?? '') && getFilePreviewSource(file))
    .map((file) => ({
      src: getFilePreviewSource(file),
      title: file.name,
      description: `Tipo: ${file.type}`,
    }));

export const getImageLightboxIndex = (
  slides: LightboxSlide[],
  file: PreviewableFile,
): number => {
  const fileName = file.name ?? '';
  const fileSource = getFilePreviewSource(file);
  const index = slides.findIndex(
    (slide) => slide.title === fileName && slide.src === fileSource,
  );

  return Math.max(0, index);
};

export const revokeLocalPreviewUrls = (
  files: LocalPreviewLike[],
  revokeUrl: (url: string) => void,
): void => {
  files.forEach((file) => {
    if (file.isLocal && file.preview) {
      revokeUrl(file.preview);
    }
  });
};
