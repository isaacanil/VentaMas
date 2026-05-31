import { Button } from 'antd';
import { LazyMotion, domAnimation } from 'framer-motion';

import type { BackorderGroup } from '../types';
import {
  GroupHeader,
  GroupHeaderRow,
  ProductGroupContainer,
  ProductIdentity,
  ProductName,
  ProgressFill,
  ProgressTrack,
  QuantityLabel,
  QuantitySummary,
  QuantityValue,
  ReservedValue,
  SummaryActions,
} from './ProductGroup.styles';

interface ProductGroupProps {
  group: BackorderGroup;
  onFulfill?: (group: BackorderGroup) => void;
}

const ProductGroup = ({ group, onFulfill }: ProductGroupProps) => {
  const progress = group.progress || 0;

  return (
    <LazyMotion features={domAnimation}>
      <ProductGroupContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <GroupHeader>
          <GroupHeaderRow>
            <ProductIdentity>
              <ProductName>{group.productName}</ProductName>
            </ProductIdentity>

            <SummaryActions>
              <QuantitySummary>
                <QuantityLabel>Pendiente</QuantityLabel>
                <QuantityValue>
                  {group.pendingQuantity}/{group.totalQuantity}
                </QuantityValue>
                {Boolean(group.reservedPendingQuantity) && (
                  <ReservedValue>
                    Reservado {group.reservedPendingQuantity}
                  </ReservedValue>
                )}
              </QuantitySummary>

              <ProgressTrack>
                <ProgressFill $progress={progress} />
              </ProgressTrack>

              <Button
                type="primary"
                size="small"
                disabled={!group.directPendingQuantity}
                onClick={() => onFulfill?.(group)}
              >
                Cubrir
              </Button>
            </SummaryActions>
          </GroupHeaderRow>
        </GroupHeader>
      </ProductGroupContainer>
    </LazyMotion>
  );
};

export default ProductGroup;
