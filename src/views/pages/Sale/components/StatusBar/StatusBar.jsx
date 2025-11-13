import { Tooltip } from 'antd';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCart } from '../../../../../features/cart/cartSlice';

import { BusinessIndicator } from './components/BusinessIndicator/BusinessIndicator';
import { ProductCounter } from './components/Card/Card';

export const StatusBar = ({ products, statusMeta, className }) => {
  const cart = useSelector(selectCart);
  const isPreorder = cart?.data?.type === 'preorder';
  const preorderNumber = cart?.data?.preorderDetails?.numberID;
  const productCount = statusMeta?.productCount ?? (products?.length || 0);
  const visibleStockTotal = Number.isFinite(statusMeta?.visibleStockTotal)
    ? statusMeta.visibleStockTotal
    : products?.reduce(
        (sum, product) => sum + (Number(product?.stock ?? 0) || 0),
        0,
      );
  const filterActive = !!statusMeta?.filterActive;

  return (
    <Pill
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <BusinessIndicator />
      {isPreorder && preorderNumber && (
        <Tooltip title="Número de Preventa">
          <PreorderIndicator>#{preorderNumber}</PreorderIndicator>
        </Tooltip>
      )}
      <ProductCounter
        productCount={productCount}
        visibleStockTotal={visibleStockTotal}
        filterActive={filterActive}
      />
    </Pill>
  );
};

const PreorderIndicator = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.4rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffb604;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: rgb(255 182 4 / 20%);
  border-radius: 14px;
`;

const Pill = styled(motion.div)`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  align-self: flex-end;
  padding: 0.4rem;
  margin: 0.6rem 0.9rem 0.9rem;
  font-size: 1rem;
  background: rgb(255 255 255 / 95%);
  border: 1px solid rgb(95 95 95 / 30%);
  border-radius: 22px;
  box-shadow:
    0 3px 8px rgb(0 0 0 / 12%),
    0 1px 3px rgb(0 0 0 / 8%);
  backdrop-filter: blur(8px);
`;

export default StatusBar;
