import { Spin } from 'antd';
import { memo, useCallback, type Dispatch, type SetStateAction } from 'react';

import noImg from '@/assets/producto/noimg.png';
import useImageFallback from '@/hooks/image/useImageFallback';
import { useCheckForInternetConnection } from '@/hooks/useCheckForInternetConnection';
import type { ProductRecord } from '@/types/products';

import {
  FirebaseLoadingIcon,
  ImageContainer,
  ImageWrapper,
  LoadingOverlay,
  ProductImageElement,
} from './ImagenBlock.styles';

type ProductImageState = {
  imageHidden: boolean;
  isImageLoaded?: boolean;
};

type ProductImageProps = {
  product: ProductRecord;
  productState: ProductImageState;
  setProductState: Dispatch<SetStateAction<ProductImageState>>;
  isFirebaseLoading?: boolean;
};

export const ProductImage = memo(
  ({
    product,
    productState,
    setProductState,
    isFirebaseLoading,
  }: ProductImageProps) => {
    const isConnected = useCheckForInternetConnection();
    const [imageFallback] = useImageFallback(product?.image, noImg);
    const handleImageLoad = useCallback(() => {
      setProductState((prev) =>
        prev.isImageLoaded ? prev : { ...prev, isImageLoaded: true },
      );
    }, [setProductState]);

    return (
      <ImageWrapper $imageHiddenRef={productState.imageHidden}>
        <ImageContainer $imageHiddenRef={productState.imageHidden}>
          {!productState.isImageLoaded && <Spin />}
          <ProductImageElement
            src={(isConnected && imageFallback) || noImg}
            alt={product.name}
            onLoad={handleImageLoad}
            $isLoaded={productState.isImageLoaded}
          />
        </ImageContainer>
        {isFirebaseLoading && (
          <LoadingOverlay>
            <Spin indicator={<FirebaseLoadingIcon spin />} />
          </LoadingOverlay>
        )}
      </ImageWrapper>
    );
  },
);

ProductImage.displayName = 'ProductImage';

export default ProductImage;
