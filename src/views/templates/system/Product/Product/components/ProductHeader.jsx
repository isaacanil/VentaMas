import PropTypes from 'prop-types';
import React, { memo } from 'react';
import styled from 'styled-components';

import { icons } from '../../../../../../constants/icons/icons';
import { truncateString } from '../../../../../../utils/text/truncateString';
import { Button } from '../../../Button/Button';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.1em 0.4em 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--Gray6);
  letter-spacing: 0.4px;
`;

const Title = styled.div`
  color: #2c3e50;
  width: 100%;
  font-size: 13px;
  line-height: 1.1;
  padding: 0.4em 0.4em 0;
  display: -webkit-box;
  font-weight: 600;
  letter-spacing: 0.2px;
  overflow: hidden;
  hyphens: auto;
`;

/**
 * ProductHeader – muestra título y botón de descartar
 * @param {{ product: { name: string }, isProductInCart: boolean, deleteProductFromCart: ()=>void }} props
 */
function ProductHeader({ product, isProductInCart, deleteProductFromCart }) {
  return (
    <Header>
      <Title>{truncateString(product.name, 40)}</Title>
      {isProductInCart && (
        <Button
          startIcon={icons.operationModes.discard}
          width="icon24"
          color="on-error"
          borderRadius="normal"
          onClick={deleteProductFromCart}
        />
      )}
    </Header>
  );
}

ProductHeader.propTypes = {
  product: PropTypes.shape({ name: PropTypes.string.isRequired }).isRequired,
  isProductInCart: PropTypes.bool,
  deleteProductFromCart: PropTypes.func,
};
ProductHeader.displayName = 'ProductHeader';

export default memo(ProductHeader);
