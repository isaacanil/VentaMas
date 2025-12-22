import {
  PlusOutlined,
  ReloadOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import { Button, Badge } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';

import DisabledReceiptsModal from '../DisabledReceiptsModal/DisabledReceiptsModal';
import { TableTaxReceipt } from '../TableTaxReceipt/TableTaxReceipt';
import TaxReceiptAuthorizationModal from '../TaxReceiptAuthorizationModal/TaxReceiptAuthorizationModal';

export const ReceiptTableSection = ({
  enabled,
  itemsLocal,
  setItemsLocal,
  onAddBlank,
  onAddPredefined,
  onRebuildLedger,
  rebuildInProgress = false,
}) => {
  const [disabledModalVisible, setDisabledModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const disabledReceipts = itemsLocal?.filter((item) => item.data?.disabled);

  const handleRestoreReceipt = (receiptId) => {
    const newArray = itemsLocal.map((item) =>
      item.data.id === receiptId
        ? { ...item, data: { ...item.data, disabled: false } }
        : item,
    );
    setItemsLocal(newArray);
  };

  if (!enabled) return null;
  return (
    <Wrapper>
      {' '}
      <Actions>
        <Left>
          {/* El botón de comprobantes inactivos se movió a la parte inferior */}
        </Left>{' '}
        <Right>
          {onRebuildLedger && (
            <Button
              icon={<ReloadOutlined />}
              onClick={onRebuildLedger}
              loading={rebuildInProgress}
              disabled={rebuildInProgress}
            >
              Reconstruir ledger
            </Button>
          )}
          {onAddBlank && (
            <Button icon={<PlusOutlined />} type="primary" onClick={onAddBlank}>
              Comprobante
            </Button>
          )}
          {onAddPredefined && (
            <Button icon={<FileAddOutlined />} onClick={onAddPredefined}>
              Plantillas
            </Button>
          )}
          <Button
            icon={<FileAddOutlined />}
            type="primary"
            onClick={() => setAuthModalVisible(true)}
          >
            Autorización
          </Button>
        </Right>
      </Actions>
      <TableTaxReceipt array={itemsLocal} setData={setItemsLocal} />
      {/* Sección inferior para mostrar el botón de comprobantes inactivos */}
      <BottomActions>
        <Left>
          {disabledReceipts.length > 0 && (
            <DisabledReceiptsButton
              onClick={() => setDisabledModalVisible(true)}
            >
              Ver Comprobantes Inactivos
              <Badge count={disabledReceipts.length} />
            </DisabledReceiptsButton>
          )}
        </Left>
      </BottomActions>
      {/* Modal de comprobantes deshabilitados */}{' '}
      <DisabledReceiptsModal
        visible={disabledModalVisible}
        onCancel={() => setDisabledModalVisible(false)}
        disabledReceipts={disabledReceipts}
        onRestore={handleRestoreReceipt}
      />
      {/* Modal de autorización de comprobantes */}
      <TaxReceiptAuthorizationModal
        visible={authModalVisible}
        onCancel={() => setAuthModalVisible(false)}
        taxReceipts={itemsLocal}
        onAuthorizationAdded={(updatedReceipt) => {
          // Actualizar el estado local con los datos de la nueva autorización
          const newArray = itemsLocal.map((item) =>
            item.data.id === updatedReceipt.id
              ? { ...item, data: updatedReceipt }
              : item,
          );
          setItemsLocal(newArray);
        }}
      />
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
  padding: 0;
  margin-bottom: 10px;
  border-radius: 8px;
`;

const Left = styled.div`
  display: flex;
`;

const Right = styled.div`
  display: flex;
  gap: 12px;
`;

// Sección para acciones en la parte inferior
const BottomActions = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0;
  margin-top: 10px;
  border-radius: 8px;
`;

// Botón para mostrar los comprobantes deshabilitados
const DisabledReceiptsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #722ed1;
  cursor: pointer;
  background-color: #f9f0ff;
  border: 1px dashed #722ed1;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background-color: #f0e6ff;
    border-color: #531dab;
  }

    .ant-badge {
    margin-left: 8px;
  }
`;
