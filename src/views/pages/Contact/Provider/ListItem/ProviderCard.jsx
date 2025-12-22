import { Button, Popconfirm, message } from 'antd';
import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { icons } from '../../../../../constants/icons/icons';
import { OPERATION_MODES } from '../../../../../constants/modes';
import { selectUser } from '../../../../../features/auth/userSlice';
import { toggleProviderModal } from '../../../../../features/modals/modalSlice';
import { fbDeleteProvider } from '../../../../../firebase/provider/fbDeleteProvider';
import { formatPhoneNumber } from '../../../../../utils/format/formatPhoneNumber';
import { truncateString } from '../../../../../utils/text/truncateString';
import { ButtonGroup } from '../../../../templates/system/Button/Button';

const UPDATE_MODE = OPERATION_MODES.UPDATE.id;

export const ProviderCard = ({ Row, Col, e: provider = {}, index = 0 }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedPhone = useMemo(() => {
    if (!provider?.tel) return 'Sin teléfono';
    return formatPhoneNumber(provider.tel);
  }, [provider?.tel]);

  const providerAddress = useMemo(() => {
    if (!provider?.address) return 'Sin dirección';
    return truncateString(provider.address, 42);
  }, [provider?.address]);

  const handleEditProvider = () => {
    if (!provider) return;
    dispatch(
      toggleProviderModal({
        mode: UPDATE_MODE,
        data: provider,
      }),
    );
  };

  const handleDeleteProvider = async () => {
    if (!provider?.id || !user) return;
    try {
      setIsDeleting(true);
      await fbDeleteProvider(provider.id, user);
      message.success('Proveedor eliminado correctamente');
    } catch (error) {
      console.error('Error deleting provider:', error);
      message.error('No se pudo eliminar el proveedor');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!Row || !Col) return null;

  return (
    <Row border="border-bottom">
      <Col>{String(index + 1).padStart(2, '0')}</Col>
      <Col size="limit">{provider?.name || 'Sin nombre'}</Col>
      <Col size="limit">{formattedPhone}</Col>
      <Col size="limit">{providerAddress}</Col>
      <Col position="right">
        <ButtonGroup>
          <Button
            icon={icons.operationModes.edit}
            onClick={handleEditProvider}
            disabled={!provider?.id}
            size="small"
          />
          <Popconfirm
            title="Eliminar proveedor"
            description={`¿Eliminar a ${provider?.name || 'este proveedor'}?`}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true, loading: isDeleting }}
            onConfirm={handleDeleteProvider}
            disabled={!provider?.id}
          >
            <Button
              danger
              icon={icons.operationModes.delete}
              loading={isDeleting}
              disabled={!provider?.id}
              size="small"
            />
          </Popconfirm>
        </ButtonGroup>
      </Col>
    </Row>
  );
};
