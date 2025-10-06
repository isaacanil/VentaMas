import styled from 'styled-components'
import { motion } from 'framer-motion'
import { BusinessIndicator } from './components/BusinessIndicator/BusinessIndicator'
import { ProductCounter } from './components/Card/Card'
import { usePreorderModal } from '../PreorderQuickActions'
import { Button } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../../../features/auth/userSlice'

export const StatusBar = ({ products }) => {
    const { openModal, isDeferredBillingEnabled, Modal } = usePreorderModal()
    const user = useSelector(selectUser)
    const isCashier = user?.role === 'cashier'

    // Show only Pill if user is cashier OR deferred billing is not enabled
    if (isCashier || !isDeferredBillingEnabled) {
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

    // Show Container with preorder button only if deferred billing is enabled and user is not cashier
    return (
        <>
            <Container
                as={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <PreorderButton
                    type="primary"
                    size="small"
                    icon={<FileTextOutlined />}
                    onClick={openModal}
                >
                    Cargar preventa
                </PreorderButton>
                <Pill>
                    <BusinessIndicator />
                    <ProductCounter products={products} />
                </Pill>
            </Container>
            {Modal}
        </>
    )
}

const Container = styled.div`
  position: absolute;
  bottom: 0.5rem;
  left: 0.9rem;
  right: 0.9rem;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  
  /* Glass morphism effect */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.25) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 0.5rem 0.6rem;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.15),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.2);
`

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

const PreorderButton = styled(Button)`
  height: 32px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border: none;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`

export default StatusBar
