import React from 'react';
import styled from 'styled-components';

import noImg from '@/assets/producto/noimg.png';
import useImageFallback from '@/hooks/image/useImageFallback';
import { useCheckForInternetConnection } from '@/hooks/useCheckForInternetConnection';

interface ImgCellProps {
  img?: string | null;
}

export const ImgCell = ({ img }: ImgCellProps) => {
  const isConnected = useCheckForInternetConnection();
  const [imageFallback] = useImageFallback(img ?? '', noImg);
  return (
    <ImgContainer>
      <Img
        src={(isConnected && imageFallback) || noImg}
        noFound={!img}
        alt=""
        style={
          img === imageFallback
            ? { objectFit: 'cover' }
            : { objectFit: 'contain' }
        }
      />
    </ImgContainer>
  );
};

const ImgContainer = styled.div`
  position: relative;
  display: flex;
  width: 2.75em;
  min-width: 2.75em;
  max-width: 2.75em;
  height: 3em;
  max-height: 3em;
  overflow: hidden;
  background-color: white;
  border-radius: var(--border-radius-light);
`;
const Img = styled.img<{ noFound?: boolean }>`
  height: 100%;
  object-fit: cover;
  object-position: center;
  width: 100%;
  ${(props) => {
    switch (props.noFound) {
      case true:
        return `
        object-fit: contain;`;
      default:
        return ``;
    }
  }}
`;
