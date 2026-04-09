import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentReference,
  type QueryConstraint,
} from 'firebase/firestore';
import { DateTime } from 'luxon';
import { db } from '@/firebase/firebaseconfig';
import { toMillis } from '@/utils/firebase/toTimestamp';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord, CashCountState } from '@/utils/cashCount/types';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';
import { getEmployeeData } from './getEmployeeData';

interface CashCountQueryParams {
  startDate?: Date | null;
  endDate?: Date | null;
  status?: CashCountState | CashCountState[] | null;
  sortField?: string;
  userRef?: DocumentReference | null;
  sortAsc?: boolean;
}

export const buildQueryConstraints = ({
  startDate = null,
  endDate = null,
  status,
  sortField = 'cashCount.createdAt',
  userRef = null,
  sortAsc = true,
}: CashCountQueryParams = {}): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [];
  if (startDate) constraints.push(where(sortField, '>=', startDate));
  if (endDate) constraints.push(where(sortField, '<=', endDate));

  if (status) {
    if (status === 'active') {
      constraints.push(where('cashCount.state', 'in', ['open', 'closing']));
    } else if (Array.isArray(status)) {
      constraints.push(where('cashCount.state', 'in', status));
    } else {
      constraints.push(where('cashCount.state', '==', status));
    }
  }

  if (userRef) {
    constraints.push(where('cashCount.opening.employee', '==', userRef));
  }
  constraints.push(orderBy(sortField, sortAsc ? 'asc' : 'desc'));
  return constraints;
};

const transformCashCount = async (
  raw: CashCountRecord,
): Promise<CashCountRecord> => {
  const opening = raw.opening || {};
  const closing = raw.closing || {};

  const [opener, openerApproval, closer, closerApproval] = await Promise.all([
    getEmployeeData(opening.employee as DocumentReference | null),
    getEmployeeData(opening.approvalEmployee as DocumentReference | null),
    getEmployeeData(closing.employee as DocumentReference | null),
    getEmployeeData(closing.approvalEmployee as DocumentReference | null),
  ]);

  const openingDate = opening.date ? toMillis(opening.date) : null;

  return {
    ...raw,
    updatedAt: toMillis(raw.updatedAt ?? null) ?? raw.updatedAt,
    createdAt: toMillis(raw.createdAt ?? null) ?? raw.createdAt,
    opening: {
      ...opening,
      date: openingDate,
      employee: opener,
      approvalEmployee: openerApproval,
    },
    closing: {
      ...closing,
      date: toMillis(closing.date ?? null) ?? closing.date,
      employee: closer,
      approvalEmployee: closerApproval,
    },
    sales: raw.sales ?? [],
  };
};

const convertToJSDate = (ms?: number | null): Date | null =>
  ms ? DateTime.fromMillis(ms).toJSDate() : null;

interface CashCountsDateRange {
  startDate?: number | null;
  endDate?: number | null;
}

interface CashCountsFilterState {
  filters: {
    status?: CashCountState | CashCountState[] | null;
    user?: string | null;
  };
  isAscending?: boolean;
}

export const fbListenCashCounts = (
  user: UserIdentity | null | undefined,
  setCashCounts: (counts: CashCountRecord[]) => void,
  dateRange: CashCountsDateRange,
  filterState: CashCountsFilterState,
  searchTerm: string,
  onLoad?: () => void,
): (() => void) | undefined => {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId) return undefined;
  const ref = collection(db, 'businesses', businessId, 'cashCounts');

  const startDateJS = convertToJSDate(dateRange?.startDate ?? null);
  const endDateJS = convertToJSDate(dateRange?.endDate ?? null);

  const userDocRef = filterState.filters.user
    ? doc(db, 'users', filterState.filters.user)
    : null;
  const constraints = buildQueryConstraints({
    startDate: startDateJS,
    endDate: endDateJS,
    status: filterState.filters.status,
    userRef: userDocRef,
    sortAsc: filterState.isAscending,
  });
  const q = query(ref, ...constraints);

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        setCashCounts([]);
        if (onLoad) onLoad();
        return;
      }
      const cashCountsArray = snapshot.docs.map(async (d) => {
        return transformCashCount(d.data().cashCount as CashCountRecord);
      });
      const parsed = await Promise.all(cashCountsArray);

      if (searchTerm && searchTerm.trim() !== '') {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const searched = parsed.filter((cc) => {
          const employeeName =
            cc.opening?.employee &&
            typeof cc.opening.employee === 'object' &&
            'name' in cc.opening.employee
              ? String((cc.opening.employee as { name?: string }).name || '')
              : '';
          return (
            cc.incrementNumber
              ?.toString()
              .toLowerCase()
              .includes(lowerSearchTerm) ||
            employeeName.toLowerCase().includes(lowerSearchTerm) ||
            cc.state?.toLowerCase().includes(lowerSearchTerm)
          );
        });
        setCashCounts(searched);
      } else {
        setCashCounts(parsed);
      }
      if (onLoad) onLoad();
    },
    (error) => {
      console.error('Error listening to cash counts:', error);
      setCashCounts([]);
      if (onLoad) onLoad();
    },
  );

  return unsubscribe;
};
