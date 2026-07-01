import { useCallback, useMemo, useState } from 'react';

import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';
import {
  DEFAULT_VENDOR_BILL_QUERY_LIMIT,
  MAX_VENDOR_BILL_QUERY_LIMIT,
  VENDOR_BILL_QUERY_LIMIT_INCREMENT,
} from '@/modules/accountsPayable/repositories/vendorBills.repository';
import { useVendorBillAggregateSummary } from '@/modules/accountsPayable/hooks/useVendorBillAggregateSummary';
import { useListenVendorBills } from '@/modules/accountsPayable/hooks/useVendorBills';
import useFilter from '@/hooks/search/useSearch';
import { isOpenVendorBill } from '@/domain/accountsPayable/vendorBills/fromPurchase';
import type { VendorBill } from '@/domain/accountsPayable/vendorBills/types';
import type {
  DataConfigMap,
  FilterOption,
  FilterState,
} from '@/modules/orderAndPurchase/public';

import {
  buildAccountsPayableRow,
  buildAccountsPayableSummary,
  ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS,
  filterAccountsPayableRowsByAgingBucket,
  filterAccountsPayableRowsByReviewScope,
  filterAccountsPayableRowsByReviewQueue,
  type AccountsPayableAgingBucket,
  type AccountsPayableFiscalFilter,
  type AccountsPayableGroupBy,
  type AccountsPayableReviewQueueKey,
  type AccountsPayableRow,
  type AccountsPayableTraceabilityFilter,
} from '../utils/accountsPayableDashboard';
import createAccountsPayableFilterConfig from '../utils/createAccountsPayableFilterConfig';

interface ProviderRecord {
  provider?: {
    id?: string;
    name?: string;
  };
}

export const resolveAccountsPayableSummaryStripLoading = ({
  aggregateSummaryErrorMessage,
  isLoading,
  visibleFallbackRowCount,
}: {
  aggregateSummaryErrorMessage?: string | null;
  isLoading?: boolean;
  visibleFallbackRowCount: number;
}): boolean =>
  Boolean(isLoading) &&
  !(Boolean(aggregateSummaryErrorMessage) && visibleFallbackRowCount > 0);

export const useAccountsPayableViewState = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [agingBucketFilter, setAgingBucketFilter] = useState<
    AccountsPayableAgingBucket | 'all'
  >('all');
  const [traceabilityFilter, setTraceabilityFilter] =
    useState<AccountsPayableTraceabilityFilter>('all');
  const [fiscalFilter, setFiscalFilter] =
    useState<AccountsPayableFiscalFilter>('all');
  const [reviewQueueFilter, setReviewQueueFilter] = useState<
    AccountsPayableReviewQueueKey | 'all'
  >('all');
  const [groupBy, setGroupBy] = useState<AccountsPayableGroupBy>('provider');
  const [vendorBillQueryLimit, setVendorBillQueryLimit] = useState(
    DEFAULT_VENDOR_BILL_QUERY_LIMIT,
  );
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const config = createAccountsPayableFilterConfig();
    return {
      filters: config.defaultValues,
      isAscending: config.defaultSort?.isAscending ?? true,
    };
  });

  const { providers = [] } = useFbGetProviders() as {
    providers?: ProviderRecord[];
  };

  const dataConfig = useMemo<DataConfigMap>(
    () => ({
      providerId: {
        data: providers,
        accessor: (item: unknown): FilterOption => {
          const providerItem = item as ProviderRecord;
          return {
            value: providerItem?.provider?.id || '',
            label: providerItem?.provider?.name || 'Sin nombre',
          };
        },
      },
    }),
    [providers],
  );

  const providerNameById = useMemo(() => {
    const entries = providers
      .map((providerItem) => {
        const providerId = providerItem?.provider?.id?.trim();
        const providerName = providerItem?.provider?.name?.trim();
        return providerId && providerName ? [providerId, providerName] : null;
      })
      .filter(Boolean) as Array<[string, string]>;

    return new Map<string, string>(entries);
  }, [providers]);

  const filterConfig = useMemo(() => createAccountsPayableFilterConfig(), []);

  const handleFilterChange = useCallback((nextFilterState: FilterState) => {
    setVendorBillQueryLimit(DEFAULT_VENDOR_BILL_QUERY_LIMIT);
    setFilterState(nextFilterState);
  }, []);

  const vendorBillFilterState = useMemo<FilterState>(
    () => ({
      ...filterState,
      filters: {
        ...filterState.filters,
        dueAtDirection: filterState.isAscending ? 'asc' : 'desc',
        limit: vendorBillQueryLimit,
      },
    }),
    [filterState, vendorBillQueryLimit],
  );

  const increaseVendorBillQueryLimit = useCallback(() => {
    setVendorBillQueryLimit((currentLimit) =>
      Math.min(
        currentLimit + VENDOR_BILL_QUERY_LIMIT_INCREMENT,
        MAX_VENDOR_BILL_QUERY_LIMIT,
      ),
    );
  }, []);

  const {
    errorMessage,
    isClientFilteredQuery,
    isQueryLimitReached,
    queryLimit,
    rawDocCount,
    vendorBills: listenedVendorBills,
    isLoading,
  } = useListenVendorBills(vendorBillFilterState) as {
    errorMessage?: string | null;
    isClientFilteredQuery?: boolean;
    isQueryLimitReached?: boolean;
    rawDocCount?: number;
    vendorBills?: VendorBill[];
    isLoading?: boolean;
    queryLimit?: number;
  };
  const canUseServerAggregateSummary =
    searchTerm.trim().length === 0 &&
    fiscalFilter === 'all' &&
    traceabilityFilter === 'all';
  const {
    errorMessage: aggregateSummaryErrorMessage,
    isLoading: isAggregateSummaryLoading,
    summary: aggregateSummary,
  } = useVendorBillAggregateSummary(vendorBillFilterState, {
    enabled: canUseServerAggregateSummary,
  });

  const matchedVendorBills = useFilter(
    listenedVendorBills,
    searchTerm,
  ) as VendorBill[];

  const openVendorBills = useMemo(
    () =>
      matchedVendorBills.filter((vendorBill) => isOpenVendorBill(vendorBill)),
    [matchedVendorBills],
  );

  const accountsPayableRows = useMemo<AccountsPayableRow[]>(
    () =>
      openVendorBills.map((vendorBill) =>
        buildAccountsPayableRow(
          vendorBill,
          vendorBill.supplierId
            ? (providerNameById.get(vendorBill.supplierId) ?? null)
            : null,
        ),
      ),
    [openVendorBills, providerNameById],
  );

  const reviewScopedRows = useMemo(
    () =>
      filterAccountsPayableRowsByReviewScope(accountsPayableRows, {
        fiscalFilter,
        traceabilityFilter,
      }),
    [accountsPayableRows, fiscalFilter, traceabilityFilter],
  );

  const filteredRows = useMemo(
    () =>
      filterAccountsPayableRowsByAgingBucket(
        filterAccountsPayableRowsByReviewQueue(
          reviewScopedRows,
          reviewQueueFilter,
        ),
        agingBucketFilter,
      ),
    [reviewScopedRows, reviewQueueFilter, agingBucketFilter],
  );

  const visibleSummary = useMemo(
    () => buildAccountsPayableSummary(reviewScopedRows),
    [reviewScopedRows],
  );
  const isSummaryAgingAggregated =
    canUseServerAggregateSummary &&
    !isAggregateSummaryLoading &&
    !aggregateSummaryErrorMessage &&
    Boolean(aggregateSummary);
  const summary = useMemo(() => {
    if (!isSummaryAgingAggregated || !aggregateSummary) {
      return visibleSummary;
    }

    return {
      ...visibleSummary,
      buckets: aggregateSummary.buckets.map((bucket) => ({
        balanceAmount: bucket.balanceAmount,
        count: bucket.count,
        key: bucket.key,
        label: ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS[bucket.key],
      })),
      totalBalanceAmount: aggregateSummary.totalBalanceAmount,
      totalCount: aggregateSummary.totalCount,
    };
  }, [aggregateSummary, isSummaryAgingAggregated, visibleSummary]);
  const hasActiveTransactionFilters = useMemo(
    () =>
      Object.values(filterState.filters ?? {}).some(
        (value) => value != null && String(value).trim() !== '',
      ),
    [filterState.filters],
  );
  const hasActiveAccountsPayableFilters =
    hasActiveTransactionFilters ||
    searchTerm.trim().length > 0 ||
    fiscalFilter !== 'all' ||
    reviewQueueFilter !== 'all' ||
    traceabilityFilter !== 'all' ||
    agingBucketFilter !== 'all';
  const isSummaryStripLoading = resolveAccountsPayableSummaryStripLoading({
    aggregateSummaryErrorMessage,
    isLoading,
    visibleFallbackRowCount: reviewScopedRows.length,
  });

  return {
    accountsPayableRows: filteredRows,
    dataConfig,
    filterConfig,
    fiscalFilter,
    groupBy,
    handleFilterChange,
    hasActiveAccountsPayableFilters,
    increaseVendorBillQueryLimit,
    loadErrorMessage: errorMessage ?? null,
    isClientFilteredQuery: Boolean(isClientFilteredQuery),
    isQueryLimitReached: Boolean(isQueryLimitReached),
    setAgingBucketFilter,
    setFiscalFilter,
    setGroupBy,
    setReviewQueueFilter,
    setTraceabilityFilter,
    isLoading: Boolean(isLoading),
    isSummaryStripLoading,
    reviewQueueFilter,
    searchTerm,
    setSearchTerm,
    summary,
    aggregateSummaryErrorMessage,
    isAggregateSummaryLoading,
    isSummaryAgingAggregated,
    canIncreaseQueryLimit:
      Boolean(isQueryLimitReached) &&
      (queryLimit ?? vendorBillQueryLimit) < MAX_VENDOR_BILL_QUERY_LIMIT,
    openAccountsPayableCount: accountsPayableRows.length,
    reviewScopedAccountsPayableCount: reviewScopedRows.length,
    queryLimit: queryLimit ?? 0,
    queryLimitMax: MAX_VENDOR_BILL_QUERY_LIMIT,
    vendorBillRawDocCount: rawDocCount ?? listenedVendorBills?.length ?? 0,
    traceabilityFilter,
    agingBucketFilter,
  };
};
