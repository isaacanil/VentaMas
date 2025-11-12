import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Tooltip, Typography } from 'antd'
import styled from 'styled-components'

// import { ClientFilterDropdown } from './ClientFilterDropdown' // TODO: Componente no existe

const { Title } = Typography;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4em 1em;
  border-bottom: 1px solid #ddd;
  background-color: #f9f9f9;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5em;
`;

const ButtonText = styled.div`
  @media (width < 700px) {
    display: none;
  }
`;

export const ClientSelectorHeader = ({ 
  openAddClientModal, 
  onClose 
}) => {
  return (
    <Header>
      <Title level={5} style={{ margin: 0 }}>Seleccionar Cliente</Title>
      <ButtonGroup>
        {/* <ClientFilterDropdown
          filter={filter}
          filteredClientsToShow={filteredClientsToShow}
          handleMenuClick={handleMenuClick}
        /> */}
        <Tooltip title="Crear cliente">
          <Button onClick={openAddClientModal} icon={<FontAwesomeIcon icon={faPlus} />}>
            <ButtonText> Cliente</ButtonText>
          </Button>
        </Tooltip>
        <Tooltip title="Cerrar">
          <Button onClick={onClose}>
            <ButtonText> Cerrar</ButtonText>
          </Button>
        </Tooltip>
      </ButtonGroup>
    </Header>
  )
}
