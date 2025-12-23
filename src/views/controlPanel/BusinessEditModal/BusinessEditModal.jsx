import { faUser, faStore, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, Button, Typography, Divider, Card, Space } from 'antd';
import React from 'react';
import { useDispatch } from 'react-redux';

import { toggleSignUpUser } from '@/features/modals/modalSlice';

export const BusinessEditModal = ({ isOpen, onClose, business }) => {
  const dispatch = useDispatch();

  const handleOpenSignUpModal = (e) => {
    // Evitar propagación del evento
    e.stopPropagation();
    dispatch(
      toggleSignUpUser({
        isOpen: true,
        businessID: business?.id,
      }),
    );
  };
  // Asegurarse de que el modal capture el evento de cierre
  const handleCancel = (e) => {
    if (e) {
      e.stopPropagation();
    }
    onClose();
  };

  const { Title, Text, Paragraph } = Typography;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FontAwesomeIcon
            icon={faStore}
            style={{ color: '#1890ff', fontSize: '20px' }}
          />
          <span>Editar Negocio: {business?.name}</span>
        </div>
      }
      open={isOpen}
      onCancel={handleCancel}
      maskClosable={true}
      keyboard={true}
      width={600}
      footer={[
        <Button key="close" onClick={handleCancel}>
          Cerrar
        </Button>,
      ]}
    >
      {/* Sección de información del negocio */}
      <div style={{ marginBottom: '20px' }}>
        <Title level={4}>Información del Negocio</Title>
        <Paragraph>
          Aquí podrás gestionar la información y configuraciones de este
          negocio.
        </Paragraph>

        <div
          style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          <Text strong>ID:</Text> <Text>{business?.id}</Text>
          <br />
          <Text strong>Dirección:</Text>{' '}
          <Text>{business?.address || 'No especificada'}</Text>
          <br />
          <Text strong>Teléfono:</Text>{' '}
          <Text>{business?.tel || 'No especificado'}</Text>
        </div>
      </div>

      <Divider />

      {/* Sección de Usuarios */}
      <div>
        {' '}
        <Title
          level={4}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FontAwesomeIcon icon={faUser} /> Gestión de Usuarios
        </Title>
        <Paragraph>
          Administra los usuarios que tienen acceso a este negocio. Puedes
          agregar nuevos usuarios asignándoles diferentes roles y permisos.
        </Paragraph>
        <Card
          style={{
            marginTop: '16px',
            backgroundColor: '#f0f7ff',
            borderColor: '#d6e8fd',
          }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text>
              Agrega un nuevo usuario a este negocio para darle acceso al
              sistema.
            </Text>{' '}
            <Button
              type="primary"
              icon={<FontAwesomeIcon icon={faUserPlus} />}
              size="large"
              block
              onClick={handleOpenSignUpModal}
            >
              Agregar Usuario
            </Button>
          </Space>
        </Card>
      </div>
    </Modal>
  );
};
