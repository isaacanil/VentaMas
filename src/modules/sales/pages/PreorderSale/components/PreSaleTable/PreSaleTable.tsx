import { DateTime } from 'luxon';
import { useState } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import {
  getProductsTax,
  getProductsTotalPrice,
  getTotalItems,
} from '@/utils/pricing';
import { PreorderModal } from '@/components/modals/PreorderModal/PreorderModal';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { InvoiceData } from '@/types/invoice';

import { tableConfig } from './tableConfig';
import type { PreorderFirestoreDoc, PreorderRow } from '../../types';

type PreSaleTableProps = {
  preSales?: PreorderFirestoreDoc[];
  searchTerm?: string;
  loading?: boolean;
};

const EMPTY_PREORDERS: PreorderFirestoreDoc[] = [];

const resolveDateSeconds = (value: InvoiceData['date']): number | null => {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }
  if (typeof value === 'object') {
    if (typeof value.seconds === 'number') return value.seconds;
    if (typeof value.toMillis === 'function') {
      const millis = value.toMillis();
      return Number.isFinite(millis) ? Math.floor(millis / 1000) : null;
    }
  }
  return null;
};

export const PreSaleTable = ({
  preSales = EMPTY_PREORDERS,
  searchTerm,
  loading = false,
}: PreSaleTableProps) => {
  const [selectedPreorder, setSelectedPreorder] = useState<InvoiceData | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (row: PreorderRow) => {
    if (row?.accion?.data) {
      setSelectedPreorder(row.accion.data);
      setIsModalOpen(true);
    }
  };

  const data: PreorderRow[] = preSales?.map(({ data }) => {
    const ncf = data?.NCF ?? null;
    const taxReceiptEnabled = Boolean(
      ncf ||
      data?.selectedTaxReceiptType ||
      data?.preorderDetails?.selectedTaxReceiptType ||
      data?.preorderDetails?.taxReceipt?.type,
    );
    const dateSeconds = resolveDateSeconds(data?.preorderDetails?.date ?? null);
    const dateGroup = dateSeconds
      ? DateTime.fromSeconds(dateSeconds).toLocaleString(DateTime.DATE_FULL)
      : '';
    return {
      numberID: data?.preorderDetails?.numberID,
      ncf,
      client: data?.client?.name ?? '',
      date: dateSeconds,
      itbis: getProductsTax(data?.products ?? []),
      products: getTotalItems(data?.products ?? []),
      status: data?.status, // Estatus de la preventa
      total: getProductsTotalPrice(
        data?.products ?? [],
        0,
        0,
        taxReceiptEnabled,
      ),
      accion: { data },
      dateGroup,
    };
  });

  const total = formatPrice(
    preSales?.reduce(
      (totalValue, { data }) =>
        totalValue + Number(data?.totalPurchase?.value ?? 0),
      0,
    ),
  );

  return (
    <>
      <AdvancedTable
        columns={tableConfig}
        data={data}
        groupBy={'dateGroup'}
        emptyText="No se encontraron preventas."
        footerLeftSide={<TotalContainer>Total: {total} </TotalContainer>}
        searchTerm={searchTerm}
        elementName={'preventas'}
        tableName={'Preventas'}
        numberOfElementsPerPage={40}
        onRowClick={handleRowClick}
        loading={loading}
      />
      <PreorderModal
        preorder={selectedPreorder}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
      />
    </>
  );
};

const TotalContainer = styled.div`
  display: flex;
  gap: 0.5em;
  align-items: center;
  justify-content: flex-end;
  padding: 0.2em 0.5em;
  font-size: 1em;
  font-weight: 600;
`;
