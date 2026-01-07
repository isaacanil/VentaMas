import type { PurchaseAttachment } from '@/utils/purchase/types';

export interface UploadedAttachment {
  name?: string;
  url?: string;
  size?: number;
  mimeType?: string;
  [key: string]: unknown;
}

export const normalizeAttachmentList = (
  attachments?: PurchaseAttachment[] | null,
): PurchaseAttachment[] => attachments ?? [];

export const updateLocalAttachmentsWithRemoteURLs = (
  localAttachments: PurchaseAttachment[] = [],
  uploadedFiles: UploadedAttachment[] = [],
): PurchaseAttachment[] => {
  if (!localAttachments.length) return [];

  return localAttachments.map((attachment) => {
    if (attachment.location === 'local') {
      const uploadedFile = uploadedFiles.find(
        (file) => file.name && file.name === attachment.name,
      );
      if (uploadedFile) {
        return {
          ...attachment,
          location: 'remote',
          url: uploadedFile.url,
          size: uploadedFile.size,
          mimeType: uploadedFile.mimeType,
        };
      }
    }
    return attachment;
  });
};

export const findRemovedAttachments = (
  oldAttachments: PurchaseAttachment[] = [],
  newAttachments: PurchaseAttachment[] = [],
): PurchaseAttachment[] =>
  oldAttachments.filter(
    (oldAttachment) =>
      oldAttachment.url &&
      !newAttachments.some((newAttachment) => newAttachment.url === oldAttachment.url),
  );
