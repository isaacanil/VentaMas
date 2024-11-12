import { memo } from 'react';
import styled from 'styled-components';
import { Product } from '../../../../../templates/system/Product/Product/Product';
import { CustomProduct } from '../../../../../templates/system/Product/CustomProduct';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

const StyledItemRow = styled.div`
  display: grid;
  grid-template-columns: ${({ columns }) => `repeat(${columns}, 1fr)`};
  gap: 0.4em;
  position: absolute;
  top: ${({ top }) => `${top}px`};
  left: 0;
  width: 100%;
  height: ${({ height }) => `${height}px`};
`;

const ItemRow = memo(({ columns, top, height, products, virtualRow }) => {
  const columnArray = useMemo(() => Array.from({ length: columns }), [columns]);
  return (
    <StyledItemRow columns={columns} top={top} height={height}>
      {columnArray.map((_, columnIndex) => {
        const itemIndex = virtualRow.index * columns + columnIndex;
        const product = products[itemIndex];
        if (product) {
          if (product.custom) {
            return <CustomProduct key={product.id} product={product} />;
          }
          return <Product key={product.id} product={product} />;
        }
        return null;
      })}
    </StyledItemRow>
  );
});

ItemRow.propTypes = {
  columns: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  products: PropTypes.array.isRequired,
  virtualRow: PropTypes.object.isRequired,
};

export default ItemRow;
