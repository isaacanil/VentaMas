import React, { useEffect, useState } from 'react'
import { Button } from './Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExport } from '@fortawesome/free-solid-svg-icons'
import { useGetProducts } from '../../../../firebase/products/fbGetProducts'
import ExcelJS from 'exceljs';
import { ExportProducts } from '../../../../hooks/exportToExcel/useExportProducts'

export const ExportProductsButton = () => {
  const {products} = useGetProducts()
  
  console.log('products', products)
  return (
    <Button 
        title='Exportar'
        borderRadius={'light'}
        onClick={() => ExportProducts(products)}
        startIcon={<FontAwesomeIcon icon={faFileExport}/>}
    />
  )
}