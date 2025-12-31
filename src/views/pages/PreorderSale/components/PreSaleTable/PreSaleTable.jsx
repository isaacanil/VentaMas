import { DateTime } from 'luxon';
import { useState } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import {
  getProductsTax,
  getProductsTotalPrice,
  getTotalItems,
} from '@/utils/pricing';
import { PreorderModal } from '@/views/component/modals/PreorderModal/PreorderModal';
import { AdvancedTable } from '@/views/templates/system/AdvancedTable/AdvancedTable';

import { tableConfig } from './tableConfig.jsx';


export const PreSaleTable = ({ preSales = [], searchTerm }) => {
  const [selectedPreorder, setSelectedPreorder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (row) => {
    if (row?.accion?.data) {
      setSelectedPreorder(row.accion.data);
      setIsModalOpen(true);
    }
  };

  const data = preSales?.map(({ data }) => {
    const nfc = data?.NCF;
    return {
      numberID: data?.preorderDetails?.numberID,
      ncf: data?.NCF,
      client: data?.client?.name,
      date: data?.preorderDetails?.date?.seconds,
      itbis: getProductsTax(data?.products || []),
      products: getTotalItems(data?.products || []),
      status: data?.status, // Estatus de la preventa
      total: getProductsTotalPrice(data?.products || [], 0, 0, nfc),
      accion: { data },
      dateGroup: DateTime.fromMillis(
        data?.preorderDetails?.date?.seconds * 1000,
      ).toLocaleString(DateTime.DATE_FULL),
    };
  });

  const total = formatPrice(
    preSales?.reduce(
      (total, { data }) => total + data?.totalPurchase?.value,
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
