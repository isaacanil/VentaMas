// @ts-nocheck
import React, { useState } from 'react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { fbGetProductsImg } from '@/firebase/products/productsImg/fbGetProductsImg';

import { Body } from './components/Body/Body';
import { Header } from './components/Header/Header';

export const UploadImg = ({ isOpen, setIsOpen }) => {
  const [ImgToUpload, setImgToUpload] = useState(null);
  const [images, setImages] = useState([]);
  const user = useSelector(selectUser);
  useEffect(() => {
    fbGetProductsImg(user, setImages);
  }, [user]);

  return isOpen ? (
    <Backdrop>
      <Container>
        <Header setIsOpen={setIsOpen} />
        <Body
          images={images}
          ImgToUpload={ImgToUpload}
          setImgToUpload={setImgToUpload}
        />
      </Container>
    </Backdrop>
  ) : null;
};
const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;
const Container = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: min-content 1fr;
  width: 100%;
  height: 100%;
  padding: 0.6em 1em;
  overflow: hidden;
  background-color: #e2e2e2fd;
`;
