import React, { useEffect, useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { selectImageViewerShow, selectImageViewerURL, toggleImageViewer } from "../../../../features/imageViewer/imageViewerSlice";
import { useClickOutSide } from "../../../../hooks/useClickOutSide";
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'; // <-- Importa aquí
import { CenteredText } from "../CentredText";
import { Button } from "../Button/Button";
import Typography from "../Typografy/Typografy";

const ImageViewer = () => {
  const show = useSelector(selectImageViewerShow)

  const urlRef = useSelector(selectImageViewerURL)
  const imgRef = useRef(null)
  const dispatch = useDispatch()
  const [url, setUrl] = useState(urlRef)

  const onClose = () => dispatch(toggleImageViewer({ show: false, url: '' }));

  useEffect(() => { setUrl(urlRef) }, [urlRef])

  useClickOutSide(imgRef, show, onClose)

  return (
    <Overlay show={show} >
      <Header>
        <Typography
          disableMargins
          variant="h2"
          color="light"
        >
          Visualizador de imagen
        </Typography>
        <Button
          title={<MdClose />}
          onClick={onClose}
        />
      </Header>
      {url &&
        <ImageContainer ref={imgRef} >
          <TransformWrapper
            minScale={1}
            maxScale={2}
            wheel={{ step: 50 }}
          >
            <TransformComponent
              contentStyle={{ width: '100%', height: '100%' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            >
              <img
                src={url}
                alt="Visualización de imagen"
                style={{ width: '100%', objectFit: 'contain' }}
              />
            </TransformComponent>
          </TransformWrapper>
        </ImageContainer>}
      {!url &&
        <CenteredText
          textVariant="h2"
          containerVariant="contained"
          text={'No se proporciono una imagen para visualizar'}
        />}

    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.692);
  display: grid;
  gap: 0.5em;
  align-items: start;
  padding: 0.3em;
  opacity: ${({ show }) => (show ? 1 : 0)};
  pointer-events: ${({ show }) => (show ? 'all' : 'none')};
  z-index: 9999;
 
`;

const ImageContainer = styled.div`
    background-color: #000;
    width: calc(100%);
    height: calc(88vh);
    overflow: hidden;
   
    border-radius: 10px;
    object-fit: contain;

/* .content-style {
    width: 100%;
    height: 100%;
} */

 img{
  width: 100%;
  height: 100%;
  object-fit: contain;
 
  }
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #2e2e2e;
  border-radius: 10px;
  z-index: 9999;
  padding: 0.5em 1em;
`;
export default ImageViewer;