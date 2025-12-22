import {
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { db, storage } from '../firebaseconfig';
import { fbUploadFiles } from '../img/fbUploadFileAndGetURL';

const updateLocalAttachmentsWithRemoteURLs = (
  localAttachments,
  uploadedFiles,
) => {
  return localAttachments.map((attachment) => {
    if (attachment.location === 'local') {
      const uploadedFile = uploadedFiles.find(
        (uf) => uf.name === attachment.name,
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

export const findRemovedAttachments = (oldAttachments, newAttachments) => {
  return oldAttachments.filter(
    (oldAtt) =>
      oldAtt.url && !newAttachments.some((newAtt) => newAtt.url === oldAtt.url),
  );
};

export const deleteRemovedFiles = async (removedAttachments) => {
  const deletePromises = removedAttachments.map(async (attachment) => {
    try {
      if (attachment.url) {
        const fileRef = ref(storage, attachment.url);
        await deleteObject(fileRef);
        console.log(`Deleted file: ${attachment.url}`);
      }
    } catch (error) {
      console.error(`Error deleting file ${attachment.url}:`, error);
    }
  });
  await Promise.all(deletePromises);
};

export const fbUpdatePurchase = async ({
  user,
  purchase,
  localFiles = [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setLoading = () => { },
}) => {
  try {
    setLoading(true);
    // Updating purchase data
    const purchaseRef = doc(
      db,
      'businesses',
      user.businessID,
      'purchases',
      purchase.id,
    );

    // Get previous version of purchase
    const previousPurchaseDoc = await getDoc(purchaseRef);
    const previousPurchase = previousPurchaseDoc.data();

    // Find and delete removed attachments
    if (previousPurchase?.attachmentUrls) {
      const removedAttachments = findRemovedAttachments(
        previousPurchase.attachmentUrls,
        purchase.attachmentUrls || [],
      );
      if (removedAttachments.length > 0) {
        await deleteRemovedFiles(removedAttachments);
      }
    }

    let uploadedFiles = [];
    if (localFiles && localFiles.length > 0) {
      const files = localFiles.map(({ file }) => file);
      uploadedFiles = await fbUploadFiles(
        user,
        'purchaseAndOrderFiles',
        files,
        {
          customMetadata: {
            type: 'purchase_attachment',
          },
        },
      );
    }

    const existingAttachments = purchase.attachmentUrls || [];
    const updatedAttachments = updateLocalAttachmentsWithRemoteURLs(
      existingAttachments,
      uploadedFiles,
    );

    // Safely convert dates to timestamps
    const safeTimestamp = (date) => {
      if (!date) return serverTimestamp();
      const milliseconds =
        typeof date === 'number' ? date : new Date(date).getTime();
      if (isNaN(milliseconds)) return serverTimestamp();
      return Timestamp.fromMillis(milliseconds);
    };

    const updatedData = {
      ...purchase,
      createdAt: purchase.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      deliveryAt: safeTimestamp(purchase.deliveryAt),
      paymentAt: safeTimestamp(purchase.paymentAt),
      completedAt: purchase.completedAt
        ? safeTimestamp(purchase.completedAt)
        : null,
      attachmentUrls: updatedAttachments,
    };

    await updateDoc(purchaseRef, updatedData);
    setLoading(false);
    return updatedData;
  } catch (error) {
    setLoading(false);
    console.error('Error updating purchase:', error);
    throw error;
  }
};
