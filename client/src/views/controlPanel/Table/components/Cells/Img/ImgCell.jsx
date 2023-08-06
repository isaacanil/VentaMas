import React from 'react'
import { useCheckForInternetConnection } from '../../../../../../hooks/useCheckForInternetConnection'
import noImg from '../../../../../../assets/producto/noImg.png'
import useImageFallback from '../../../../../../hooks/image/useImageFallback';
import styled from 'styled-components';
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
    width: 100%;
    max-height: 2.75em;
    height: 100%;
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