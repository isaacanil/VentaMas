import { deleteObject, ref } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase/firebaseconfig';
import { fbUploadFiles } from '@/firebase/img/fbUploadFileAndGetURL';
import {
  findRemovedAttachments,
  normalizeAttachmentList,
  updateLocalAttachmentsWithRemoteURLs,
} from '@/utils/purchase/attachments';
import type { UserIdentity } from '@/types/users';
import type { PurchaseAttachment } from '@/utils/purchase/types';

export const deleteRemovedFiles = async (
  removedAttachments: PurchaseAttachment[],
): Promise<void> => {
  if (!removedAttachments.length) return;

  await Promise.all(
    removedAttachments.map(async (attachment) => {
      if (!attachment.url) return;
      try {
        const fileRef = ref(storage, attachment.url);
        await deleteObject(fileRef);
      } catch (error) {
        console.error(`Error deleting file ${attachment.url}:`, error);
      }
    }),
  );
};

interface SyncPurchaseAttachmentsArgs {
  user: UserIdentity;
  purchaseId: string;
  currentAttachments?: PurchaseAttachment[] | null;
  localFiles?: PurchaseAttachment[] | null;
}

export const syncPurchaseAttachments = async ({
  user,
  purchaseId,
  currentAttachments,
  localFiles,
}: SyncPurchaseAttachmentsArgs): Promise<PurchaseAttachment[]> => {
  if (!user?.businessID) {
    throw new Error('No businessID provided');
  }

  const purchaseRef = doc(
    db,
    'businesses',
    user.businessID,
    'purchases',
    purchaseId,
  );
  const previousPurchaseDoc = await getDoc(purchaseRef);
  const previousAttachments =
    (previousPurchaseDoc.data() as { attachmentUrls?: PurchaseAttachment[] } | undefined)
      ?.attachmentUrls ?? [];

  const normalizedAttachments = normalizeAttachmentList(currentAttachments);
  const removedAttachments = findRemovedAttachments(
    previousAttachments,
    normalizedAttachments,
  );
  if (removedAttachments.length > 0) {
    await deleteRemovedFiles(removedAttachments);
  }

  let uploadedFiles: PurchaseAttachment[] = [];
  const files = normalizeAttachmentList(localFiles)
    .map((item) => item.file)
    .filter(Boolean) as File[];

  if (files.length > 0) {
    uploadedFiles = (await fbUploadFiles(
      user,
      'purchaseAndOrderFiles',
      files,
      {
        customMetadata: {
          type: 'purchase_attachment',
        },
      },
    )) as PurchaseAttachment[];
  }

  return updateLocalAttachmentsWithRemoteURLs(
    normalizedAttachments,
    uploadedFiles,
  );
};
