import {
  FileOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Tooltip, Modal, message } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import { updateTaxReceipt } from '../../../../../../../firebase/taxReceipt/updateTaxReceipt';
import { settingDataTaxTable } from '../../taxConfigTable';
import TaxReceiptAuthorizationModal from '../TaxReceiptAuthorizationModal/TaxReceiptAuthorizationModal';
import TaxReceiptForm from '../TaxReceiptForm/TaxReceiptForm';

export const TableTaxReceipt = ({ array, setData }) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const user = useSelector(selectUser);

  const activeReceipts = array?.filter((item) => !item.data?.disabled);

  // Si no hay elementos activos, mostramos mensaje
  if (!activeReceipts || activeReceipts.length === 0) {
    return (
      <Container>
        <EmptyMessage>No hay comprobantes disponibles.</EmptyMessage>
      </Container>
    );
  }

  const handleToggleDisabled = async (index) => {
    const item = array[index];
    const isCurrentlyDisabled = item.data?.disabled === true;
    const actionText = isCurrentlyDisabled ? 'habilitar' : 'deshabilitar';
    const statusText = isCurrentlyDisabled ? 'activo' : 'inactivo';

    Modal.confirm({
      title: `¿Estás seguro de ${actionText} este comprobante?`,
      icon: <ExclamationCircleOutlined />,
      content: `El comprobante se marcará como ${statusText}.`,
      okText: isCurrentlyDisabled ? 'Habilitar' : 'Deshabilitar',
      okType: isCurrentlyDisabled ? 'primary' : 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const newDisabledState = !isCurrentlyDisabled;
          const dataToUpdate = {
            id: item.data.id,
            ...item.data,
            disabled: newDisabledState,
          };
          await updateTaxReceipt(user, dataToUpdate);
          message.success(
            `Comprobante ${isCurrentlyDisabled ? 'habilitado' : 'deshabilitado'} correctamente`,
          );
          const newArray = array.map((it, i) =>
            i === index
              ? { ...it, data: { ...it.data, disabled: newDisabledState } }
              : it,
          );
          setData(newArray);
        } catch (error) {
          console.error(`Error al ${actionText} comprobante:`, error);
          message.error(`Error al ${actionText} el comprobante`);
        }
      },
    });
  };

  const handleEditTaxReceipt = (index) => {
    const itemToEdit = array[index];
    if (itemToEdit && itemToEdit.data) {
      setCurrentEditItem({ ...itemToEdit.data });
      setEditModalVisible(true);
    } else {
      console.error(
        'Intento de editar un elemento inválido en el índice:',
        index,
        itemToEdit,
      );
      message.error('No se pudieron cargar los datos para editar.');
    }
  };

  const formatSequence = (seq, length) => {
    if (seq === undefined || length === undefined) return seq;
    return String(seq).padStart(length, '0');
  };

  const handleAuthorizationAdded = (updatedReceipt) => {
    // Update the local state with the new authorization data
    const newArray = array.map((item) =>
      item.data.id === updatedReceipt.id
        ? { ...item, data: updatedReceipt }
        : item,
    );
    setData(newArray);
  };

  const calculateLimit = (data) => {
    try {
      if (!data) return 'N/A';
      const { type, serie, sequence, quantity, sequenceLength } = data;
      if (!type || !serie || sequence === undefined || !quantity) return 'N/A';
      const limitSequence = parseInt(sequence, 10) + parseInt(quantity, 10);
      return `${type}${serie}${String(limitSequence).padStart(sequenceLength || 8, '0')}`;
    } catch (error) {
      console.error('Error al calcular el límite:', error);
      return 'Error';
    }
  };

  const headers = [
    ...settingDataTaxTable,
    { name: 'LÍMITE (NCF)' },
    { name: 'ACCIÓN' },
  ];

  return (
    <Container>
      <Row>
        {headers.map((item, idx) => (
          <Col key={idx}>
            <h4>{item.name}</h4>
          </Col>
        ))}
      </Row>
      {activeReceipts.map((item, idx) => (
        <Row
          key={idx}
          onDoubleClick={() => handleEditTaxReceipt(array.indexOf(item))}
        >
          <Col>
            <span>{item.data?.name}</span>
          </Col>
          <Col>
            <span>{item.data?.type}</span>
          </Col>
          <Col>
            <span>{item.data?.serie}</span>
          </Col>
          <Col>
            <span>
              {formatSequence(item.data.sequence, item.data.sequenceLength)}
            </span>
          </Col>
          <Col>
            <span>{item.data?.increase}</span>
          </Col>
          <Col>
            <span>{item.data?.quantity}</span>
          </Col>
          <Col>
            <Tooltip title="Número del último comprobante que se generará">
              <LimitDisplay>
                <FileOutlined style={{ marginRight: 5 }} />
                {calculateLimit(item.data)}
              </LimitDisplay>
            </Tooltip>
          </Col>
          <Col>
            <ActionButtonsContainer>
              <ActionButton
                onClick={() => handleEditTaxReceipt(array.indexOf(item))}
                className="edit-button"
                title="Editar"
              >
                <EditOutlined />
              </ActionButton>
              <ActionButton
                onClick={() => handleToggleDisabled(array.indexOf(item))}
                className="delete-button"
                title="Deshabilitar"
              >
                <StopOutlined />
              </ActionButton>
            </ActionButtonsContainer>
          </Col>
        </Row>
      ))}{' '}
      <TaxReceiptForm
        editModalVisible={editModalVisible}
        setEditModalVisible={setEditModalVisible}
        currentEditItem={currentEditItem}
      />
      {/* Modal de autorización de comprobantes */}
      <TaxReceiptAuthorizationModal
        visible={authModalVisible}
        onCancel={() => setAuthModalVisible(false)}
        taxReceipts={array}
        onAuthorizationAdded={handleAuthorizationAdded}
      />
    </Container>
  );
};

const Container = styled.div`
  overflow: hidden;
  border: 1px solid var(--gray1);
  border-radius: 10px;
`;

const EmptyMessage = styled.div`
  padding: 2em;
  font-size: 14px;
  color: #666;
  text-align: center;
`;

const Row = styled.div`
  align-items: center;
  background-color: ${(props) => (props.disabled ? '#f5f5f5' : 'transparent')};
  border-bottom: 1px solid var(--gray1);
  display: grid;
  grid-template-columns:
    minmax(150px, 0.7fr) minmax(40px, 0.2fr) minmax(40px, 0.2fr) minmax(
      90px,
      0.5fr
    )
    minmax(80px, 0.3fr) minmax(80px, 0.3fr) minmax(100px, 0.6fr) 80px;
  height: 2.75em;
  position: relative;

  &:last-child {
    border-bottom: 0;
  }

  ${(props) =>
    props.disabled &&
    `
    & span { text-decoration: line-through; color: #999; }
    & div[class^="LimitDisplay"] { opacity: 0.7; }
    & div[class^="LimitDisplay"] span { text-decoration: none; color: #1890ff; }
    & button.enable-button { opacity: 1; position: relative; z-index: 1; box-shadow: 0 0 8px rgba(82,196,26,0.2); }
    & button.enable-button span { color: inherit; text-decoration: none; }
  `}
`;

const Col = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 0.6em;
  border-right: 1px solid var(--gray1);

  &:last-child {
    border-right: 0;
  }

  &:first-child {
    border-left: 0;
  }

  input[type='text'],
  input[type='number'] {
    width: 100%;
    height: 100%;
    padding: 0;
    font-size: 12px;
    border: 0;

    &:focus {
      outline: none;
    }
  }

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    margin: 0;
    appearance: none;
  }

  h4 {
    width: 100%;
    padding: 0 !important;
    margin: 0;
    font-size: 12px;
    text-align: left;
  }
`;

const LimitDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #1890ff;
  letter-spacing: 0.5px;
  background-color: #f0f8ff;
  border: 1px dashed #1890ff;
  border-radius: 4px;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 100%;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  font-size: 18px;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;
  transition: all 0.2s;

  &.edit-button {
    color: #474747;

    &:hover {
      color: #414141;
    }
  }

  &.delete-button {
    color: #ff4d4f;

    &:hover {
      color: #ff7875;
      background-color: rgb(255 77 79 / 10%);
    }
  }

  &.enable-button {
    position: relative;
    z-index: 300;
    font-weight: 500;
    color: #52c41a;
    background-color: transparent;
    box-shadow: none;
    opacity: 1 !important;

    &:hover {
      color: #73d13d;
      background-color: #fff;
    }
  }

  &:focus {
    outline: none;
  }
`;
