import React from 'react'

import noImg from '../../../../../../../assets/producto/noImg.png'

import useImageFallback from '../../../../../../../hooks/image/useImageFallback';
import styled from 'styled-components';
import { useCheckForInternetConnection } from '../../../../../../../hooks/useCheckForInternetConnection';
export const ImgCell = ({img}) => {
    const isConnected = useCheckForInternetConnection();
    const [imageFallback] = useImageFallback(img, noImg)
    return (
        <ImgContainer>
            <Img
                src={(isConnected && imageFallback) || noImg}
                noFound={img ? false : true}
                alt=""
                style={img === imageFallback ? { objectFit: "cover" } : { objectFit: 'contain' }}

            />
        </ImgContainer>
    )
}

const ImgContainer = styled.div`
    max-height: 3em;
    height: 3em;
    min-width: 2.75em;
    max-width: 2.75em;
    width: 2.75em;
    position: relative;
    overflow: hidden;
    display: flex;
    border-radius: var(--border-radius-light);
    background-color: white;
    
`
const Img = styled.img`
  object-fit: cover;
  object-position: center;
  width: 100%;
  height: 100%;
  ${props => {
        switch (props.noFound) {
            case true:
                return `
        object-fit: contain;`;
            default:
                return ``;
        }
    }}
`;