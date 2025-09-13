import { useEffect, useRef, useState } from 'react';
import { Input, Drawer } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { normalizeText } from '../../../../../utils/text';

/*
  Selector de Clientes
  --------------------
  Inspirado en ProviderSelector pero con una paleta sobria más corporativa.
  Permite buscar y seleccionar un cliente con un Drawer de listado.
*/

const Wrapper = styled.div`
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 8px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 0 1em;

  .search-container {
    flex: 1;
  }
`;

const ClientsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding: 0 1em 1.5em;
  overflow-y: auto;
  align-content: start;
`;

const ClientCard = styled.div`
  background-color: ${({ $isSelected }) => ($isSelected ? '#F0F5FF' : '#fff')};
  border: 1px solid ${({ $isSelected }) => ($isSelected ? '#1890ff' : '#d9d9d9')};
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .name {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
    margin-bottom: 4px;
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: #595959;

    span {
      font-family: monospace;
    }
  }
`;

const ClientInfo = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: border-color 0.2s;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  &:hover {
    border-color: ${({ $disabled }) => ($disabled ? '#d9d9d9' : '#1890ff')};
  }

  &.empty {
    justify-content: center;
    align-items: center;
    color: #8c8c8c;
    min-height: 64px;
  }

  .client-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .client-name {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .client-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 16px;
    font-size: 13px;
    color: #595959;

    .detail-label {
      color: #8c8c8c;
      font-size: 11px;
    }
  }
`;

const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span`
  font-size: 12px;
  color: #8c8c8c;
`;

const ClientSelector = ({
  clients = [],
  selectedClient,
  onSelectClient,
  loading = false,
  disabled = false,
  label = 'Cliente',
}) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    if (visible && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 120);
    }
  }, [visible]);

  const filteredClients = search
    ? clients.filter((c) =>
        [c.name, c.rnc, c.personalID, c.tel]
          .filter(Boolean)
          .some((field) => normalizeText(field).includes(normalizeText(search)))
      )
    : clients;

  const openDrawer = () => {
    if (!disabled) setVisible(true);
  };

  const closeDrawer = () => setVisible(false);

  const handleSelect = (client) => {
    onSelectClient?.(client);
    closeDrawer();
    setSearch('');
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onSelectClient?.(null);
  };

  return (
    <SelectorContainer>
      <Label>{label}</Label>
      <ClientInfo onClick={openDrawer} className={!selectedClient ? 'empty' : ''} $disabled={disabled}>
        {!selectedClient ? (
          <>
            <PlusOutlined style={{ marginRight: 8 }} /> Seleccionar Cliente
          </>
        ) : (
          <>
            <div className="client-header">
              <span className="client-name">{selectedClient.name}</span>
              {!disabled && (
                <CloseOutlined style={{ color: '#8c8c8c' }} onClick={clearSelection} />
              )}
            </div>
            <div className="client-details">
              <span className="detail-label">RNC/Cédula:</span>
              <span>{selectedClient.rnc || selectedClient.personalID || 'N/A'}</span>
              <span className="detail-label">Teléfono:</span>
              <span>{selectedClient.tel || 'N/A'}</span>
            </div>
          </>
        )}
      </ClientInfo>

      <Drawer
        title="Seleccionar Cliente"
        placement="bottom"
        open={visible}
        onClose={closeDrawer}
        height="80%"
        styles={{ body: { padding: '1em' } }}
      >
        <Wrapper>
          <Header>
            <div className="search-container">
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                ref={searchRef}
                allowClear
                loading={loading}
              />
            </div>
          </Header>

          <ClientsContainer>
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                onClick={() => handleSelect(client)}
                $isSelected={selectedClient?.id === client.id}
              >
                <div className="name">{client.name}</div>
                <div className="details">
                  <span>RNC/Céd.: {client.rnc || client.personalID || 'N/A'}</span>
                  <span>Teléfono: {client.tel || 'N/A'}</span>
                </div>
              </ClientCard>
            ))}
            {filteredClients.length === 0 && !loading && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#8c8c8c', padding: '1rem' }}>
                {search ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
              </div>
            )}
          </ClientsContainer>
        </Wrapper>
      </Drawer>
    </SelectorContainer>
  );
};

export default ClientSelector; 