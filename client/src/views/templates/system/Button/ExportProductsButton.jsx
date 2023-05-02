import React, { useEffect, useState } from 'react'
import { Button } from './Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExport } from '@fortawesome/free-solid-svg-icons'
import { fbGetProducts } from '../../../../firebase/products/fbGetProducts'
import ExcelJS from 'exceljs';
import { ExportProducts } from '../../../../hooks/exportToExcel/useExportProducts'

export const ExportProductsButton = () => {
  const [products , setProducts] = useState([])
  useEffect(() => {
    fbGetProducts(setProducts)
  }, [])
  
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
