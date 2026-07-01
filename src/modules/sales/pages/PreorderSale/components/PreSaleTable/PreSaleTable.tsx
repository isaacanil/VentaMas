import { useState } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import { AdvancedTable } from '@/components/ui/AdvancedTable';
import type { InvoiceData } from '@/types/invoice';

import { PreorderModal } from '../PreorderModal/PreorderModal';
import { mapPreorderToRow } from './preSaleTableRows';
import { tableConfig } from './tableConfig';
import type { PreorderFirestoreDoc, PreorderRow } from '../../types';

type PreSaleTableProps = {
  preSales?: PreorderFirestoreDoc[];
  searchTerm?: string;
  loading?: boolean;
};

const EMPTY_PREORDERS: PreorderFirestoreDoc[] = [];

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

  const data: PreorderRow[] = preSales?.map(mapPreorderToRow);

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
