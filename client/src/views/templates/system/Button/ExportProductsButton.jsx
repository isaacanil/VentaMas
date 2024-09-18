import React, { useEffect, useState } from 'react'
import { Button } from './Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExport } from '@fortawesome/free-solid-svg-icons'
import { useGetProducts } from '../../../../firebase/products/fbGetProducts'
import ExcelJS from 'exceljs';
import { ExportProducts } from '../../../../hooks/exportToExcel/useExportProducts'
import { last } from 'lodash'
import { getProducts } from '../../../../utils/pricing'
import { useSelector } from 'react-redux'
import { selectTaxReceiptEnabled } from '../../../../features/taxReceipt/taxReceiptSlice'
export const ExportProductsButton = () => {
  const {products} = useGetProducts()
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const productsArray = getProducts(products, taxReceiptEnabled)
  const tax = {
    0: 'Exento',
    16: '16%',
    18: '18%',
  }
  const productsTaxTransformed = productsArray.map(product => {
    return {
      ...product,
      pricing: {
        ...product.pricing,
        tax: taxReceiptEnabled ? (product.pricing.tax ? (
          tax[product.pricing.tax]
        
        ) : 'Exento') : 'Exento',
      }
    }
  }
  )

  return (
    <Button 
        title='Exportar'
        borderRadius={'light'}
        onClick={() => ExportProducts(productsTaxTransformed)}
        startIcon={<FontAwesomeIcon icon={faFileExport}/>}
    />
  )
}
