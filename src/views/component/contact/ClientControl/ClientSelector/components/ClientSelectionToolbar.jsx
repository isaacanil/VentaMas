import { faFilter, faPlus, faCopy } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Tooltip, Dropdown, Badge, Typography } from 'antd'
import { memo } from 'react'
import styled from 'styled-components'

const { Title } = Typography

const ButtonText = styled.div`
  @media (width < 700px) {
    display: none;
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4em 1em;
  border-bottom: 1px solid #ddd;
  background-color: #f9f9f9;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5em;
`

export const ClientSelectionToolbar = memo(({ 
  filter, 
  filteredClientsToShow, 
  handleMenuClick, 
  openAddClientModal, 
  onClose 
}) => {
  const filterItems = [
    { key: 'all', label: 'Todos los clientes' },
    { key: 'duplicates', label: 'Clientes duplicados', icon: <FontAwesomeIcon icon={faCopy} /> }
  ]

  return (
    <Header>
      <Title level={5} style={{ margin: 0 }}>Seleccionar Cliente</Title>
      <ButtonGroup>
        <Tooltip title="Filtrar clientes">
          <Dropdown menu={{ items: filterItems, onClick: handleMenuClick }}>
            <Badge count={filter === 'all' ? 0 : filteredClientsToShow.length} size="small">
              <Button icon={<FontAwesomeIcon icon={faFilter} />}>
                <ButtonText> Filtrar</ButtonText>
              </Button>
            </Badge>
          </Dropdown>
        </Tooltip>
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
})
