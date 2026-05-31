import type { CSSProperties } from 'react';

import { m } from 'framer-motion';
import styled from 'styled-components';

export const FULL_SIZE_TRANSFORM_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
};

export const Overlay = styled(m.div)`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  display: grid;
  gap: 0.5em;
  align-items: start;
  width: 100vw;
  height: 100%;
  padding: 0.3em;
  background-color: rgb(0 0 0 / 80%);
`;

export const ImageContainer = styled.div`
  width: 100%;
  height: 88vh;
  overflow: hidden;
  object-fit: contain;
  background-color: #000;
  border-radius: 10px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

export const ViewerImage = styled.img`
  width: 100%;
  object-fit: contain;
`;

export const Header = styled.div`
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5em 1em;
  background-color: #2e2e2e;
  border-radius: 10px;
`;
