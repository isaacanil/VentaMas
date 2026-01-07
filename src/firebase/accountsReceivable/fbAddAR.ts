import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import type { UserIdentity } from '@/types/users';
import type {
  AccountsReceivableDoc,
  TimestampLike,
} from '@/utils/accountsReceivable/types';

interface FbAddARParams {
  user?: UserIdentity | null;
  accountsReceivable?: AccountsReceivableDoc;
}

const toMillis = (value?: TimestampLike): number | null => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const asNum = Number(value);
    return Number.isNaN(asNum) ? new Date(value).getTime() : asNum;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
  }
  return null;
};

export async function fbAddAR({
  user,
  accountsReceivable,
}: FbAddARParams): Promise<AccountsReceivableDoc | undefined> {
  if (!user?.businessID) return undefined;
  if (!accountsReceivable) return undefined;

  const id = nanoid();
  const arRef = doc(
    db,
    'businesses',
    user.businessID,
    'accountsReceivable',
    id,
  );

  const ar: AccountsReceivableDoc = {
    ...accountsReceivable,
    arBalance: accountsReceivable.totalReceivable,
    numberId: await getNextID(user, 'lastAccountReceivableId'),
    id,
    createdBy: user?.uid,
    updatedBy: user?.uid,
  };

  const createdAt = toMillis(ar.createdAt) ?? Date.now();
  const updatedAt = toMillis(ar.updatedAt) ?? createdAt;
  const paymentDate = toMillis(ar.paymentDate);

  const arData = {
    ...ar,
    createdAt: Timestamp.fromMillis(createdAt),
    updatedAt: Timestamp.fromMillis(updatedAt),
    paymentDate: paymentDate ? Timestamp.fromMillis(paymentDate) : null,
    lastPaymentDate: null,
  };

  await setDoc(arRef, arData);
  return ar;
}
