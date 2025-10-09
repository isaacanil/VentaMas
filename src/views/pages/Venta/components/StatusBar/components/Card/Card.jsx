import React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Tooltip } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons'
import { SelectTotalShoppingItems } from '../../../../../../../features/cart/cartSlice'
import { AnimatedNumber } from '../../../../../../templates/system/AnimatedNumber/AnimatedNumber'
import { useFormatNumber } from '../../../../../../../hooks/useFormatNumber'

export const ProductCounter = ({ products }) => {
    const totalShoppingItems = useSelector(SelectTotalShoppingItems)
    const productLength = products?.length || 0

    return (
        <Tooltip title="Productos en el carrito">
            <Container>
                <FontAwesomeIcon icon={faShoppingCart} size="sm" />
                <CounterContent>
                    {totalShoppingItems ? (
                        <>
                            <AnimatedNumber value={`${useFormatNumber(totalShoppingItems)}`} />
                            <CounterSeparator>/</CounterSeparator>
                        </>
                    ) : null}
                    <AnimatedNumber value={useFormatNumber(productLength)} />
                </CounterContent>
            </Container>
        </Tooltip>
    )
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  border-radius: 14px;
  background: var(--Gray8);
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

const CounterContent = styled.div`
  display: flex;
  align-items: center;
`

const CounterSeparator = styled.span`
  font-weight: 600;
  margin: 0 0.25rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
`
