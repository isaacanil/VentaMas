import { Tooltip } from 'antd'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import { selectCart } from '../../../../../features/cart/cartSlice'

import { BusinessIndicator } from './components/BusinessIndicator/BusinessIndicator'
import { ProductCounter } from './components/Card/Card'


export const StatusBar = ({ products, statusMeta }) => {
    const cart = useSelector(selectCart)
    const isPreorder = cart?.data?.type === 'preorder'
    const preorderNumber = cart?.data?.preorderDetails?.numberID
    const productCount = statusMeta?.productCount ?? (products?.length || 0)
    const visibleStockTotal = Number.isFinite(statusMeta?.visibleStockTotal)
        ? statusMeta.visibleStockTotal
        : products?.reduce((sum, product) => sum + (Number(product?.stock ?? 0) || 0), 0)
    const filterActive = !!statusMeta?.filterActive

    return (
        <Pill
            as={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', bottom: '0.5rem', right: '0.9rem', zIndex: 100 }}
        >
            <BusinessIndicator />
            {isPreorder && preorderNumber && (
                <Tooltip title="Número de Preventa">
                    <PreorderIndicator>
                        #{preorderNumber}
                    </PreorderIndicator>
                </Tooltip>
            )}
            <ProductCounter
                productCount={productCount}
                visibleStockTotal={visibleStockTotal}
                filterActive={filterActive}
            />
        </Pill>
    )
}

const PreorderIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.6rem;
    border-radius: 14px;
    background: rgba(255, 182, 4, 0.2);
    color: #ffb604;
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
`;

const Pill = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 22px;
  padding: 0.4rem 0.4rem;
  
  box-shadow: 
    0 3px 8px rgba(0, 0, 0, 0.12),
    0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(95, 95, 95, 0.3);
  font-size: 1rem;
`

export default StatusBar
