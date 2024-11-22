import React from 'react'
import { AdvancedTable } from '../../../../../../templates/system/AdvancedTable/AdvancedTable'
import { columns } from './columns'
export const AccountReceivableTable = ({data = [], searchTerm="", totalBalance}) => {
  return (
    <AdvancedTable
      columns={columns}
      data={data} // Aquí deberás agregar los datos reales
      tableName="accountsReceivable-list"
      elementName="cuentas"
      searchTerm={searchTerm}
      footerLeftSide={`Total: ${totalBalance}`}
      emptyText="No hay cuentas por cobrar para mostrar"
    />
  )
}
