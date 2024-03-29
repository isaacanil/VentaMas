import React, { useState } from 'react'
import { TbPlus } from 'react-icons/tb'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { Button } from '../../../../templates/system/Button/Button'
import { openModalAddProd } from '../../../../../features/modals/modalSlice'


export const AddProductButton = () => {
  const dispatch = useDispatch()
  const OpenAddProductModal = () => dispatch(openModalAddProd());
  return (
    <Button
      startIcon={<TbPlus />}
      borderRadius={'normal'}
      onClick={OpenAddProductModal}
    />
  )
}