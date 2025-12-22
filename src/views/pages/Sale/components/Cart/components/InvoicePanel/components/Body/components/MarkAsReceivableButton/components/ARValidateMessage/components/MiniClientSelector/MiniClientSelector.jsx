import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { Modal, Input, List, Avatar, Typography, Empty, Spin } from 'antd';
import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { addClient } from '../../../../../../../../../../../../../../../features/clientCart/clientCartSlice';
import { useFbGetClientsOnOpen } from '../../../../../../../../../../../../../../../firebase/client/useFbGetClientsOnOpen';
import { filtrarDatos } from '../../../../../../../../../../../../../../../hooks/useSearchFilter';

const { Search } = Input;
const { Text } = Typography;

export const MiniClientSelector = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { clients, loading } = useFbGetClientsOnOpen({ isOpen });

  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar clientes que no sean genéricos
  const nonGenericClients = useMemo(
    () =>
      clients.filter(({ client }) => client.name && client.name.trim() !== ''),
    [clients],
  );

  const filteredClients = useMemo(
    () => filtrarDatos(nonGenericClients, searchTerm),
    [nonGenericClients, searchTerm],
  );

  const handleSelectClient = (clientData) => {
    // dispatch(setClient(clientData.client));
    dispatch(addClient(clientData.client));
    onClose();
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  return (
    <Modal
      title="Seleccionar Cliente"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      style={{ top: 20 }}
      styles={{
        header: { padding: '16px 24px' },
        body: { padding: '0' },
        content: { padding: 0, borderRadius: 8, overflow: 'hidden' },
      }}
    >
      <div style={{ marginBottom: 16, padding: '0 16px' }}>
        <Search
          placeholder="Buscar cliente..."
          allowClear
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : filteredClients.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No se encontraron clientes"
          />
        ) : (
          <List
            dataSource={filteredClients}
            renderItem={(clientData) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: 6,
                  marginBottom: 4,
                  transition: 'all 0.2s',
                }}
                className="client-list-item"
                onClick={() => handleSelectClient(clientData)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                      size="small"
                    />
                  }
                  title={
                    <Text strong style={{ fontSize: 14 }}>
                      {clientData.client.name}
                    </Text>
                  }
                  description={
                    <div>
                      {clientData.client.phone && (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, display: 'block' }}
                        >
                          📞 {clientData.client.phone}
                        </Text>
                      )}
                      {clientData.client.email && (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, display: 'block' }}
                        >
                          📧 {clientData.client.email}
                        </Text>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
};
