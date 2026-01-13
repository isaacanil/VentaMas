import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import type { ProviderDocument } from './types';

export const getProvidersCollection = (
  businessId: string,
): CollectionReference<ProviderDocument> =>
  collection(db, 'businesses', businessId, 'providers') as CollectionReference<
    ProviderDocument
  >;

export const getProviderDoc = (
  businessId: string,
  providerId: string,
): DocumentReference<ProviderDocument> =>
  doc(db, 'businesses', businessId, 'providers', providerId) as DocumentReference<
    ProviderDocument
  >;
