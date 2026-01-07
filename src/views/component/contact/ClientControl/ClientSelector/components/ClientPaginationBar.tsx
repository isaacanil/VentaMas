// @ts-nocheck
import { memo } from 'react';
import styled from 'styled-components';

const Footer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  padding: 0.5em 1em;
  border-top: 1px solid #ddd;
`;

const ClientPaginationBarComponent = ({
  filteredClients,
  clients,
}) => {
  return (
    <Footer>
      <div style={{ whiteSpace: 'nowrap' }}>
        Clientes: {filteredClients.length}/{clients.length}
      </div>
      <div style={{ justifySelf: 'center', color: '#475569' }}>
        Listados: {filteredClients.length}
      </div>
      <div />
    </Footer>
  );
};

export const ClientPaginationBar = memo(ClientPaginationBarComponent);
ClientPaginationBar.displayName = 'ClientPaginationBar';
