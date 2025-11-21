import { Spin } from 'antd';
import { memo } from 'react';
import styled from 'styled-components';

import {
  Client,
  clientHeaderStyles,
} from '../../../../../templates/system/client/Client';

const Body = styled.div`
  z-index: 1;
  display: grid;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;

  h3 {
    color: #333;
    text-align: center;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  height: 100%;

  .ant-spin {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
`;

const ClientsList = styled.div`
  display: grid;
  gap: 0.6em;
  align-content: start;
  padding: 0.75em 0.6em 0.8em;
  overflow-y: auto;
`;

const ClientsHeader = styled.div`
  ${clientHeaderStyles};
  position: sticky;
  top: 0;
  z-index: 2;
  margin-bottom: 0.2em;

  @media (width <= 700px) {
    display: none;
  }
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
          {paginatedClients.length > 0 && (
            <ClientsHeader>
              <span>#</span>
              <span>Cliente</span>
              <span>RNC/Cédula</span>
              <span>Tel.</span>
              <span className="actions-col"></span>
            </ClientsHeader>
          )}
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
