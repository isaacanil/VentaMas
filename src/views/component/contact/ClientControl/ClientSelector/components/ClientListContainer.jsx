import { Spin } from 'antd';
import { memo } from 'react';
import styled from 'styled-components';

import { Client } from '../../../../../templates/system/client/Client';

const Body = styled.div`
  z-index: 1;
  width: 100%;
  display: grid;
  height: 100%;
  overflow: hidden;
  padding: 0;

  h3 {
    color: #333;
    text-align: center;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex-direction: column;
  gap: 1rem;

  .ant-spin {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ClientsList = styled.div`
  display: grid;
  padding: 0.5em;
  overflow-y: auto;
  gap: 0.4em;
  align-content: start;
`;

const ClientListContainerComponent = ({
  paginatedClients,
  loading,
  selectedClient,
  openUpdateClientModal,
  handleDeleteClient,
  onClose,
  searchTerm,
}) => {
  return (
    <Body>
      {loading ? (
        <LoadingContainer>
          <Spin size="large" tip="Cargando clientes...">
            <div style={{ minHeight: '100px', minWidth: '200px' }} />
          </Spin>
        </LoadingContainer>
      ) : (
        <ClientsList>
          {paginatedClients.length > 0 ? (
            paginatedClients.map(({ client }, idx) => (
              <Client
                key={idx}
                client={client}
                selectedClient={selectedClient}
                updateClientMode={openUpdateClientModal}
                onDelete={handleDeleteClient}
                Close={onClose}
                searchTerm={searchTerm}
              />
            ))
          ) : (
            <h3>Cliente no encontrado</h3>
          )}
        </ClientsList>
      )}
    </Body>
  );
};

export const ClientListContainer = memo(ClientListContainerComponent);
ClientListContainer.displayName = 'ClientListContainer';
