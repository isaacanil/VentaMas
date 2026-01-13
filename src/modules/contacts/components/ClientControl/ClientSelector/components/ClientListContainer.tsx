// @ts-nocheck
import { Spin } from 'antd';
import { forwardRef, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import styled from 'styled-components';

import { Client } from '@/components/ui/client/Client';
import { clientHeaderStyles } from '@/components/ui/client/Client.styles';

const Body = styled.div`
  z-index: 1;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
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

const VirtuosoContainer = styled(Virtuoso)`
  height: 100%;
  width: 100%;
`;

const ListWrapper = styled.div`
  padding: 0.75em 0.6em 0.8em;
  box-sizing: border-box;
`;

const HeaderWrapper = styled.div`
  padding: 0.75em 0.6em 0.4em;
  background-color: #fff;
  box-sizing: border-box;
`;

const ItemContainer = styled.div`
  padding-bottom: 0.6em;
  box-sizing: border-box;

  &:last-child {
    padding-bottom: 0;
  }
`;

const EmptyState = styled.h3`
  color: #333;
  text-align: center;
  margin: 0;
  padding: 1em 0;
`;

const ClientsHeader = styled.div`
  ${clientHeaderStyles};
  margin-bottom: 0.2em;
  margin-right: 16px;

  @media (width <= 700px) {
    margin-right: 0;
    display: none;
  }
`;

const VirtuosoList = forwardRef(({ style, children, ...props }, ref) => (
  <ListWrapper ref={ref} style={style} {...props}>
    {children}
  </ListWrapper>
));
VirtuosoList.displayName = 'VirtuosoList';

const VirtuosoItem = forwardRef(({ style, children, ...props }, ref) => (
  <ItemContainer ref={ref} style={style} {...props}>
    {children}
  </ItemContainer>
));
VirtuosoItem.displayName = 'VirtuosoItem';

const ClientListContainerComponent = ({
  clients,
  loading,
  selectedClient,
  openUpdateClientModal,
  handleDeleteClient,
  onClose,
  searchTerm,
}) => {
  const hasClients = clients.length > 0;

  return (
    <Body>
      {loading ? (
        <LoadingContainer>
          <Spin size="large" tip="Cargando clientes...">
            <div style={{ minHeight: '100px', minWidth: '200px' }} />
          </Spin>
        </LoadingContainer>
      ) : hasClients ? (
        <>
          <HeaderWrapper>
            <ClientsHeader>
              <span>#</span>
              <span>Cliente</span>
              <span>RNC/Cédula</span>
              <span>Tel.</span>
              <span className="actions-col"></span>
            </ClientsHeader>
          </HeaderWrapper>
          <VirtuosoContainer
            data={clients}
            itemContent={(index, { client }) => (
              <Client
                client={client}
                selectedClient={selectedClient}
                updateClientMode={openUpdateClientModal}
                onDelete={handleDeleteClient}
                Close={onClose}
                searchTerm={searchTerm}
              />
            )}
            itemKey={(index, item) =>
              item?.id ?? item?.client?.id ?? item?.client?.numberId ?? index
            }
            components={{
              List: VirtuosoList,
              Item: VirtuosoItem,
            }}
          />
        </>
      ) : (
        <EmptyState>Cliente no encontrado</EmptyState>
      )}
    </Body>
  );
};

export const ClientListContainer = memo(ClientListContainerComponent);
ClientListContainer.displayName = 'ClientListContainer';
