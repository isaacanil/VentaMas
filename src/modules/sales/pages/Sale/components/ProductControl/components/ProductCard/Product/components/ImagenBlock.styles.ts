import { LoadingOutlined } from '@/constants/icons/antd';
import styled from 'styled-components';

type ImageWrapperProps = {
  $imageHiddenRef?: boolean;
};

export const ImageWrapper = styled.div<ImageWrapperProps>`
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

  ${({ $imageHiddenRef }) =>
    !$imageHiddenRef &&
    `
      position: relative;
      transform: translateX(0px) scale(1);
      transition: transform 1s ease-in-out 0.02s;
  `}
`;

export const ImageContainer = styled.div<ImageWrapperProps>`
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

export const ProductImageElement = styled.img<{ $isLoaded?: boolean }>`
  visibility: ${({ $isLoaded }) => ($isLoaded ? 'visible' : 'hidden')};
`;

export const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 80%);
  border-radius: var(--border-radius);
`;

export const FirebaseLoadingIcon = styled(LoadingOutlined)`
  font-size: 24px;
`;
