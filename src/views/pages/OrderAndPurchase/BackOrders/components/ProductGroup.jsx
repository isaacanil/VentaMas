import { Button } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';
// Removed per-item BackorderCard view in favor of compact summaries

const ProductGroupContainer = styled(motion.div)`
  background: white;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
  overflow: hidden;
  /* Single-row compact card */
`;

const GroupHeader = styled.div`
  background: white;
`;

// Removed per-date and per-item content to keep only product totals

const ProductGroup = ({ group, onFulfill }) => {
  return (
    <ProductGroupContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <GroupHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{group.productName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap:"4px", lineHeight: 1.1 }}>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>Pendiente</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>
                {group.pendingQuantity}/{group.totalQuantity}
              </span>
              {Boolean(group.reservedPendingQuantity) && (
                <span style={{ fontSize: 12, color: '#096dd9' }}>
                  Reservado {group.reservedPendingQuantity}
                </span>
              )}
            </div>
            <div style={{ width: 140, height: 6, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${group.progress || 0}%`, height: '100%', background: '#1890ff' }} />
            </div>
            <Button
              type="primary"
              size="small"
              disabled={!group.directPendingQuantity}
              onClick={() => onFulfill?.(group)}
            >
              Cubrir
            </Button>
          </div>
        </div>
      </GroupHeader>
    </ProductGroupContainer>
  );
};

export default ProductGroup;
