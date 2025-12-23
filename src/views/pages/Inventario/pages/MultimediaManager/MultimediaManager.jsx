import { faTimes, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { selectUser } from '@/features/auth/userSlice';
import { fbAddProductImg } from '@/firebase/products/productsImg/fbAddProductImg';
import { fbAddProductImgData } from '@/firebase/products/productsImg/fbAddProductImgData';
import { fbDeleteProductImg } from '@/firebase/products/productsImg/fbDeleteProductImg';
import { fbGetProductsImg } from '@/firebase/products/productsImg/fbGetProductsImg';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';
import { AddFileBtn } from '@/views/templates/system/Button/AddFileBtn';
import {
  Button,
  ButtonGroup,
} from '@/views/templates/system/Button/Button';

export const MultimediaManager = () => {
  const [allImg, setAllImg] = useState([]);
  const [ImgToUpload, setImgToUpload] = useState(null);
  const user = useSelector(selectUser);
  useEffect(() => {
    fbGetProductsImg(user, setAllImg);
  }, [user]);

  const handleSubmit = () => {
    fbAddProductImg(user, ImgToUpload).then((url) => {
      fbAddProductImgData(user, url);
      setImgToUpload(null);
    });
  };

  return (
    <Container>
      <MenuApp
        sectionName={'Productos'}
        sectionNameIcon={icons.multimedia.image}
      ></MenuApp>
      <Head>
        <h2>Multimedia Manager</h2>
        <ButtonGroup>
          {ImgToUpload ? (
            <Button
              title={<FontAwesomeIcon icon={faTimes} />}
              borderRadius="normal"
              width="icon32"
              onClick={() => setImgToUpload(null)}
              bgcolor="error"
            />
          ) : null}
          <AddFileBtn
            title="Imagen"
            fn={setImgToUpload}
            startIcon={<FontAwesomeIcon icon={faUpload} />}
            id="addImg"
          />
          <Button
            title="subir"
            borderRadius="normal"
            onClick={handleSubmit}
            bgcolor="primary"
            disabled={ImgToUpload ? false : true}
          />
        </ButtonGroup>
      </Head>
      <Body>
        <BodyWrapper>
          {allImg.length > 0
            ? allImg.map((img, index) => (
                <Img key={index}>
                  <div className="head">
                    <Button
                      title={<FontAwesomeIcon icon={faTrash} />}
                      borderRadius="normal"
                      width="icon24"
                      bgcolor={'error'}
                      onClick={() => fbDeleteProductImg(user, img)}
                    />
                  </div>
                  <img src={img.url} alt="" />
                </Img>
              ))
            : null}
        </BodyWrapper>
      </Body>
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  grid-template-columns: 1fr;
  height: 100%;
`;
const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 2.5em;
  padding: 0 1.3em;

  h2 {
    margin: 0;
    font-size: 1.2em;
  }
`;
const Body = styled.div`
  display: grid;
  background-color: var(--icolor4);
`;
const BodyWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  grid-auto-rows: 130px;
  gap: 0.1em;
  justify-content: center;
  justify-items: center;
  width: 100%;
  padding: 1em;
  overflow: hidden;
`;
const Img = styled.div`
  position: relative;
  width: 100%;
  padding: 0.2em;
  overflow: hidden;
  background-color: white;
  border-radius: 8px;

  .head {
    position: absolute;
    right: 0;
    display: flex;
    justify-content: flex-end;
    width: auto;
    padding: 0 0.2em 0.2em;
    background-color: white;
    border-bottom-left-radius: 10px;

    /* box-shadow: 2px 10px 10px rgb(0 0 0 / 20%); */
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }
`;
