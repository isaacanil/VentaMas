import {
  collection,
  onSnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

type ChangelogDateValue =
  | Timestamp
  | Date
  | {
      seconds?: number;
    }
  | null
  | undefined;

export interface ChangelogEntry {
  id?: string;
  content?: string;
  createdAt?: ChangelogDateValue;
  [key: string]: unknown;
}

export interface ChangelogDocument {
  changelog?: ChangelogEntry;
  [key: string]: unknown;
}

export interface NormalizedChangelogEntry {
  id?: string;
  content?: string;
  createdAt: Date;
  [key: string]: unknown;
}

export interface ChangelogListItem {
  changelog: NormalizedChangelogEntry;
  [key: string]: unknown;
}

const toChangelogDate = (createdAt: ChangelogDateValue): Date => {
  if (createdAt instanceof Date) return createdAt;

  const seconds =
    createdAt && typeof createdAt === 'object' ? createdAt.seconds : undefined;

  return typeof seconds === 'number' ? new Date(seconds * 1000) : new Date(0);
};

export const normalizeChangelogDocument = (
  data: ChangelogDocument,
): ChangelogListItem => ({
  ...data,
  changelog: {
    ...data.changelog,
    id: data.changelog?.id,
    content: data.changelog?.content,
    createdAt: toChangelogDate(data.changelog?.createdAt),
  },
});

interface SubscribeToChangelogListArgs {
  onChange: (items: ChangelogListItem[]) => void;
  onError: (message: string) => void;
}

export const subscribeToChangelogList = ({
  onChange,
  onError,
}: SubscribeToChangelogListArgs): Unsubscribe => {
  const changelogsRef = collection(db, 'changelogs');

  return onSnapshot(
    changelogsRef,
    (snapshot) => {
      onChange(
        snapshot.docs.map((docSnap) =>
          normalizeChangelogDocument(docSnap.data() as ChangelogDocument),
        ),
      );
    },
    (err) => {
      onError(err instanceof Error ? err.message : String(err));
    },
  );
};
