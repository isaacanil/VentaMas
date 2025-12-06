import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { ChangeProductImage } from '../../../../../features/updateProduct/updateProductSlice';

export const GalleryAdmin = ({ images, setImg }) => {
  const dispatch = useDispatch();
  const AddImg = (img) => {
    dispatch(ChangeProductImage(img));
  };
  return (
    <Container>
      <Header>
        <h2>Elige una img</h2>
      </Header>
      <Body>
        <div className="wrapper">
          {images.length > 0
            ? images.map((img, index) => (
                <div
                  className="imgContainer"
                  key={index}
                  onClick={() => {
                    setImg(img.url);
                    AddImg(img.url);
                  }}
                >
                  <img src={img.url} alt="" />
                </div>
              ))
            : null}
        </div>
      </Body>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0.8em;
  align-items: stretch;
  padding: 0.4em;
  overflow: hidden;
  background-color: #fafafa;
  border-radius: 8px;
`;
const Header = styled.div`
  h2 {
    margin: 0;
    font-size: 18px;
  }
`;
const Body = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: 1fr;
  padding: 0.4em;
  margin: 0;
  overflow-y: scroll;
  background-color: var(--white-3);
  border-radius: var(--border-radius);

  .wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    grid-auto-rows: min-content;
    gap: 1em;
    place-content: flex-start center;
    place-items: flex-start center;
    padding: 0 1em;
    margin: 0;

    /* grid-template-rows: repeat(3, minmax(100px, 1fr)); */
  }

  .imgContainer {
    width: 100px;
    height: 100px;
    overflow: hidden;
    background-color: white;
    border-radius: 8px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
`;
