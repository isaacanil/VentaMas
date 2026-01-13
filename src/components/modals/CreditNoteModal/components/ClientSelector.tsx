// @ts-nocheck
import { PlusOutlined, CloseOutlined } from '@/constants/icons/antd';
import { Input, Drawer } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { normalizeText } from '@/utils/text';

/*
  Selector de Clientes
  --------------------
  Inspirado en ProviderSelector pero con una paleta sobria más corporativa.
  Permite buscar y seleccionar un cliente con un Drawer de listado.
*/

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 8px;
  height: 100%;
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
  align-content: start;
  padding: 0 1em 1.5em;
  overflow-y: auto;
`;

const ClientCard = styled.div`
  padding: 12px 14px;
  cursor: pointer;
  background-color: ${(props: { $isSelected?: any }) => props.$isSelected ($isSelected ? '#F0F5FF' : '#fff')};
  border: 1px solid
    ${(props: { $isSelected?: any }) => props.$isSelected ($isSelected ? '#1890ff' : '#d9d9d9')};
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 6px rgb(0 0 0 / 6%);
  }

  .name {
    margin-bottom: 4px;
    font-size: 15px;
    font-weight: 600;
    color: #262626;
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
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  cursor: ${(props: { $disabled?: any }) => props.$disabled ($disabled ? 'not-allowed' : 'pointer')};
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  opacity: ${(props: { $disabled?: any }) => props.$disabled ($disabled ? 0.6 : 1)};
  transition: border-color 0.2s;

  &:hover {
    border-color: ${(props: { $disabled?: any }) => props.$disabled ($disabled ? '#d9d9d9' : '#1890ff')};
  }

  &.empty {
    align-items: center;
    justify-content: center;
    min-height: 64px;
    color: #8c8c8c;
  }

  .client-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
      font-size: 11px;
      color: #8c8c8c;
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
          .some((field) =>
            normalizeText(field).includes(normalizeText(search)),
          ),
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

  const clearSelection = (e: any) => {
    e.stopPropagation();
    onSelectClient?.(null);
  };

  return (
    <SelectorContainer>
      <Label>{label}</Label>
      <ClientInfo
        onClick={openDrawer}
        className={!selectedClient ? 'empty' : ''}
        $disabled={disabled}
      >
        {!selectedClient ? (
          <>
            <PlusOutlined style={{ marginRight: 8 }} /> Seleccionar Cliente
          </>
        ) : (
          <>
            <div className="client-header">
              <span className="client-name">{selectedClient.name}</span>
              {!disabled && (
                <CloseOutlined
                  style={{ color: '#8c8c8c' }}
                  onClick={clearSelection}
                />
              )}
            </div>
            <div className="client-details">
              <span className="detail-label">RNC/Cédula:</span>
              <span>
                {selectedClient.rnc || selectedClient.personalID || 'N/A'}
              </span>
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
                  <span>
                    RNC/Céd.: {client.rnc || client.personalID || 'N/A'}
                  </span>
                  <span>Teléfono: {client.tel || 'N/A'}</span>
                </div>
              </ClientCard>
            ))}
            {filteredClients.length === 0 && !loading && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: '#8c8c8c',
                  padding: '1rem',
                }}
              >
                {search
                  ? 'No se encontraron clientes'
                  : 'No hay clientes disponibles'}
              </div>
            )}
          </ClientsContainer>
        </Wrapper>
      </Drawer>
    </SelectorContainer>
  );
};

export default ClientSelector;
