// @ts-nocheck
import { faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import noImg from '@/assets/producto/noImg.png';
import { selectUser } from '@/features/auth/userSlice';
import { fbAddProductImg } from '@/firebase/products/productsImg/fbAddProductImg';
import { fbAddProductImgData } from '@/firebase/products/productsImg/fbAddProductImgData';
import { AddFileBtn } from '@/components/ui/Button/AddFileBtn';
import {
  Button,
  ButtonGroup,
} from '@/components/ui/Button/Button';

export const UploadImgAdmin = ({ ImgToUpload, setImgToUpload, img }) => {
  const user = useSelector(selectUser);

  const handleSubmit = (img) => {
    fbAddProductImg(user, img).then((url) => {
      fbAddProductImgData(user, url);
      setImgToUpload(null);
    });
  };

  return (
    <Container>
      <div className="uploadImg">
        <h2>Subir Imagen</h2>
        <br />
        <ButtonGroup>
          {ImgToUpload && (
            <Button
              borderRadius="normal"
              title={<FontAwesomeIcon icon={faTimes} />}
              width="icon32"
              onClick={() => setImgToUpload(null)}
              bgcolor="error"
            />
          )}
          <AddFileBtn
            title="Agregar"
            setFile={setImgToUpload}
            file={ImgToUpload}
            startIcon={<FontAwesomeIcon icon={faUpload} />}
            id="addImg"
            fn={handleSubmit}
          />
          <Button
            title="subir"
            borderRadius="normal"
            bgcolor="primary"
            onClick={handleSubmit}
            disabled={ImgToUpload ? false : true}
          />
        </ButtonGroup>
      </div>
      <ImgContainer>
        <img src={img || noImg} alt="" />
      </ImgContainer>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr min-content;
  height: 100%;
  padding: 0.4em 0.4em 0.4em 0.8em;
  background-color: #fafafa;
  border-radius: 8px;

  h2 {
    margin: 0;
    font-size: 18px;
  }
`;
const ImgContainer = styled.div`
  align-self: center;
  width: 5em;
  height: 5em;
  max-height: 5em;
  overflow: hidden;
  background-color: #fff;
  border-radius: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
`;
