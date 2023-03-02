import React, { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { selectImageViewerShow, selectImageViewerURL, toggleImageViewer } from "../../../../features/imageViewer/imageViewerSlice";

const ImageViewer = () => {
    const show = useSelector(selectImageViewerShow)
  const urlRef = useSelector(selectImageViewerURL)
  const dispatch = useDispatch()
  const [url, setUrl] = useState(urlRef)
  const onClose = () => {
    dispatch(toggleImageViewer({ show: false, url: ''}))
    }
    useEffect(()=>{
        setUrl(urlRef)
    }, [urlRef])
    console.log(url)
  return (
    <Overlay show={show}>
      <ImageContainer>
        <img src={url} alt="Visualización de imagen" />
        <CloseButton onClick={onClose}><MdClose/></CloseButton>
      </ImageContainer>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.692);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ show }) => (show ? 1 : 0)};
  pointer-events: ${({ show }) => (show ? 'all' : 'none')};
  z-index: 9999;
`;

const ImageContainer = styled.div`
  max-width: 100%;
  max-height: 100%;
  
  /* display: flex; */
  /* justify-content: center;
  align-items: center; */
  img{
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;



  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 20px;
  color: white;
  background-color: transparent;
  border: none;
  cursor: pointer;
`;
export default ImageViewer;