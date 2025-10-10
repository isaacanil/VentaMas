import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { useDispatch } from 'react-redux'

import { openModalAddProd } from '../../../../../features/modals/modalSlice'
import { Button } from '../../../../templates/system/Button/Button'


export const AddProductButton = () => {
  const dispatch = useDispatch()
  const OpenAddProductModal = () => dispatch(openModalAddProd());
  return (    <Button
      startIcon={<FontAwesomeIcon icon={faPlus} />}
      borderRadius={'normal'}
      onClick={OpenAddProductModal}
    />
  )
}