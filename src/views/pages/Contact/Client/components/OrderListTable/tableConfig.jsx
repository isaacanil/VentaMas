import * as antd from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { icons } from '../../../../../../constants/icons/icons';
import { OPERATION_MODES } from '../../../../../../constants/modes';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { toggleClientModal } from '../../../../../../features/modals/modalSlice';
import { fbDeleteClient } from '../../../../../../firebase/client/fbDeleteClient';
import { useFormatPhoneNumber } from '../../../../../../hooks/useFormatPhoneNumber';
import { truncateString } from '../../../../../../utils/text/truncateString';
import { ButtonGroup } from '../../../../../templates/system/Button/Button';
import { Message } from '../../../../../templates/system/message/Message';

const { Button } = antd;

export const tableConfig = () => {
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
    },
    {
      Header: 'Telefono',
      accessor: 'phone',
      cell: ({ value }) => (value ? useFormatPhoneNumber(value) : noData),
    },
    {
      Header: 'RNC/Cedula',
      accessor: 'rnc',
      cell: ({ value }) => (value ? value : noData),
    },
    {
      Header: 'Direccion',
      accessor: 'address',

      cell: ({ value }) => (value ? truncateString(value, 14) : noData),
    },
    {
      Header: 'Acciones',
      accessor: 'actions',
      minWidth: '300px',
      maxWidth: '1fr',
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

  const filterConfig = [
    {
      label: 'Cliente',
      accessor: 'name',
    },
  ];
  return {
    columns,
    filterConfig,
  };
};
