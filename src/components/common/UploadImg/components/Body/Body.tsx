import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUpdateProductData } from '@/features/updateProduct/updateProductSlice';
import type { ProductImageRecord, ProductRecord } from '@/types/products';

import { GalleryAdmin } from './GalleryAdmin';
import { UploadImgAdmin } from './UploadImgAdmin';

type BodyProps = {
  images: ProductImageRecord[];
  ImgToUpload: File | null;
  setImgToUpload: React.Dispatch<React.SetStateAction<File | null>>;
};

export const Body = ({ images, ImgToUpload, setImgToUpload }: BodyProps) => {
  const { product } = useSelector(selectUpdateProductData) as {
    product: ProductRecord;
  };
  const [img, setImg] = useState<string | null>(product?.image ?? null);
  return (
    <Container>
      <BodyWrapper>
        <UploadImgAdmin
          ImgToUpload={ImgToUpload}
          setImgToUpload={setImgToUpload}
          img={img}
        />
        <GalleryAdmin images={images} setImg={setImg} />
      </BodyWrapper>
    </Container>
  );
};

const Container = styled.div`
  overflow: hidden;
  padding: 0;
  display: grid;
  grid-template-rows: 1fr;
`;
const BodyWrapper = styled.div`
  display: grid;
  gap: 1em; /* gap between rows */
  margin-bottom: 1em;
  grid-template-rows: min-content 1fr; /* this was missing */
  overflow: hidden;
`;
