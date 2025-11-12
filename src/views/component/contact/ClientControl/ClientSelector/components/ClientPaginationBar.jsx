import { Pagination } from 'antd'
import { memo } from 'react'
import styled from 'styled-components'

const Footer = styled.div`
  display: grid;
  padding: 0.5em 1em;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  border-top: 1px solid #ddd;
`

const ClientPaginationBarComponent = ({
  filteredClients,
  clients,
  currentPage,
  pageSize,
  filteredClientsToShow,
  setCurrentPage,
  setPageSize
}) => {
  return (
    <Footer>
      <div style={{ whiteSpace: 'nowrap' }}>
        Clientes: {filteredClients.length}/{clients.length}
      </div>
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredClientsToShow.length}
        onChange={(page, size) => {
          setCurrentPage(page)
          setPageSize(size)
        }}
        style={{ justifySelf: 'center' }}
      />
      <div />
    </Footer>
  )
}

export const ClientPaginationBar = memo(ClientPaginationBarComponent)
ClientPaginationBar.displayName = 'ClientPaginationBar'
