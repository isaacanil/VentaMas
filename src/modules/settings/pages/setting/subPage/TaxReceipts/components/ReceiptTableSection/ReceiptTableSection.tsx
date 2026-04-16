import { PlusOutlined } from '@/constants/icons/antd';
import { Button, Radio } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';

import { TableTaxReceipt } from '@/modules/settings/pages/setting/subPage/TaxReceipts/components/TableTaxReceipt/TableTaxReceipt';
import type { TaxReceiptDocument } from '@/types/taxReceipt';

type SetTaxReceiptItems = (
  next:
    | TaxReceiptDocument[]
    | ((prev: TaxReceiptDocument[]) => TaxReceiptDocument[]),
) => void;

interface ReceiptTableSectionProps {
  enabled: boolean;
  itemsLocal: TaxReceiptDocument[];
  setItemsLocal: SetTaxReceiptItems;
  isUnchanged: boolean;
  onAddBlank?: () => void;
}

export const ReceiptTableSection = ({
  enabled,
  itemsLocal,
  setItemsLocal,
  isUnchanged: _isUnchanged,
  onAddBlank,
}: ReceiptTableSectionProps) => {
  const [viewFilter, setViewFilter] = useState<'active' | 'archived'>('active');
  if (!enabled) return null;
  return (
    <Wrapper>
      <Actions>
        <Left>
          <Radio.Group
            value={viewFilter}
            onChange={(event) => setViewFilter(event.target.value)}
            size="middle"
          >
            <Radio.Button value="active">Activas</Radio.Button>
            <Radio.Button value="archived">Archivadas</Radio.Button>
          </Radio.Group>
        </Left>
        <Right>
          {onAddBlank && (
            <Button icon={<PlusOutlined />} type="primary" onClick={onAddBlank}>
              Agregar serie
            </Button>
          )}
        </Right>
      </Actions>
      <TableTaxReceipt array={itemsLocal} setData={setItemsLocal} filter={viewFilter} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const Left = styled.div`
  display: flex;
`;

const Right = styled.div`
  display: flex;
  gap: var(--ds-space-3);
`;
