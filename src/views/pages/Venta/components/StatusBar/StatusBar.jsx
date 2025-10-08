import styled from 'styled-components'
import { motion } from 'framer-motion'
import { BusinessIndicator } from './components/BusinessIndicator/BusinessIndicator'
import { ProductCounter } from './components/Card/Card'

export const StatusBar = ({ products }) => {
    return (
        <Pill
            as={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', bottom: '0.5rem', right: '0.9rem', zIndex: 100 }}
        >
            <BusinessIndicator />
            <ProductCounter products={products} />
        </Pill>
    )
}

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
