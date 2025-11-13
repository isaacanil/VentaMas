import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import React from 'react';
import styled from 'styled-components';

import noImg from '../../../../../../assets/producto/noimg.png';
import useImageFallback from '../../../../../../hooks/image/useImageFallback';
import { useCheckForInternetConnection } from '../../../../../../hooks/useCheckForInternetConnection';

const ImageWrapper = styled.div`
  position: absolute;
  transform: translateX(-90px) scale(0);
  transition: transform 0.6s ease-in-out 0.02s;

  .ant-spin {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    transform: translate(-50%, -50%);
  }

  ${({ imageHiddenRef }) =>
    !imageHiddenRef &&
    `
      position: relative;
      transform: translateX(0px) scale(1);
      transition: transform 1s ease-in-out 0.02s;
  `}
`;

const ImageContainer = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  padding: 4px;
  overflow: hidden;
  transition: transform 0.4s ease-in-out;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    border-radius: 7px;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 80%);
  border-radius: var(--border-radius);
`;

/**
 * ProductImage component
 * @param {object} props
 * @param {object} props.product - Product data
 * @param {object} props.productState - Local state for image loading/visibility
 * @param {function} props.setProductState - Setter for productState
 */
export const ProductImage = React.memo(
  ({ product, productState, setProductState, isFirebaseLoading }) => {
    const isConnected = useCheckForInternetConnection();
    const [imageFallback] = useImageFallback(product?.image, noImg);

    return (
      <ImageWrapper imageHiddenRef={productState.imageHidden}>
        <ImageContainer imageHiddenRef={productState.imageHidden}>
          {!productState.isImageLoaded && <Spin />}
          <img
            src={(isConnected && imageFallback) || noImg}
            alt={product.name}
            onLoad={() =>
              setProductState((prev) => ({ ...prev, isImageLoaded: true }))
            }
            style={{
              visibility: productState.isImageLoaded ? 'visible' : 'hidden',
            }}
          />
        </ImageContainer>
        {isFirebaseLoading && (
          <LoadingOverlay>
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            />
          </LoadingOverlay>
        )}
      </ImageWrapper>
    );
  },
);

ProductImage.displayName = 'ProductImage';

export default ProductImage;
