import React, {useState} from 'react'
import { TbPlus } from 'react-icons/tb'
import styled from 'styled-components'
import { Button } from '../../../templates/system/Button/Button'

export const AddProductButton_OrderPage = ({message}) => {

    return (
      <Button
      startIcon={<TbPlus />}
        borderRadius={'normal'}
      

      />
    )
  }
const Component = styled(Button)`
    position: relative;
    border-radius: var(--border-radius);
    border: 2px solid rgb(39, 39, 39);
    color: #1f1e1e;
    font-size: 1.1em;
    background-color: transparent;
    border-radius: 50%;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    `

