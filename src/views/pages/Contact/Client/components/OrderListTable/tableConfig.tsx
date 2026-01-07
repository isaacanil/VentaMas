// @ts-nocheck
import { Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';


import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { selectUser } from '@/features/auth/userSlice';
import { toggleClientModal } from '@/features/modals/modalSlice';
import { fbDeleteClient } from '@/firebase/client/fbDeleteClient';
import { formatPrice } from '@/utils/format';
import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { ButtonGroup } from '@/views/templates/system/Button/Button';
import { Message } from '@/views/templates/system/message/Message';


export const useTableConfig = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const updateMode = OPERATION_MODES.UPDATE.id;
  const noData = <Message title="(vacio)" fontSize="small" bgColor="error" />;

  const handleDeleteClient = async (id) =>
    await fbDeleteClient(user?.businessID, id);

  const openModalUpdateMode = (client) => {
    dispatch(toggleClientModal({ mode: updateMode, data: client }));
  };

  const columns = [
    {
      Header: 'Nombre',
      accessor: 'name',
      minWidth: '220px',
      maxWidth: '1fr',
    },
    {
      Header: 'Telefono',
      accessor: 'phone',
      cell: ({ value }) => (value ? formatPhoneNumber(value) : noData),
      minWidth: '140px',
    },
    {
      Header: 'RNC/Cedula',
      accessor: 'rnc',
      cell: ({ value }) => (value ? value : noData),
      minWidth: '150px',
    },
    {
      Header: 'Dirección',
      accessor: 'address',

      cell: ({ value }) =>
        value ? <CellText title={value}>{value}</CellText> : noData,
      minWidth: '220px',
      maxWidth: '3fr',

    },
    {
      Header: 'Balance',
      accessor: 'balance',
      align: 'right',
      cell: ({ value }) => formatPrice(value || 0),
      minWidth: '150px',
    },
    {
      Header: 'Acciones',
      accessor: 'actions',
      minWidth: '100px',
      align: 'right',
      cell: ({ value }) => {
        return (
          <ButtonGroup>
            <Button
              icon={icons.operationModes.edit}
              onClick={() => openModalUpdateMode(value)}
            ></Button>
            <Button
              danger
              icon={icons.operationModes.delete}
              onClick={() => handleDeleteClient(value.id)}
            ></Button>
          </ButtonGroup>
        );
      },
    },
  ];
  return { columns };
};

const CellText = styled.span`
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;