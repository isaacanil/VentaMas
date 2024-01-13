import React, { useState } from 'react'
import styled from 'styled-components';
import * as  ant from 'antd';
const { Upload, Modal, Button, message, Dropdown, Typography, Divider } = ant;
import { ArrowLeftOutlined, InboxOutlined } from '@ant-design/icons';
import { fbDeleteProductImg } from '../../../../../../firebase/products/productsImg/fbDeleteProductImg';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { imgFailed } from '../ImageManager';
import { ChangeProductImage } from '../../../../../../features/updateProduct/updateProductSlice';


export const Gallery = ({ images }) => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const itemOption = (image) => [
    {
      key: '2',
      label: 'Seleccionar',
      onClick: () => {
        message.success('Imagen seleccionada');
        dispatch(ChangeProductImage(image.url))
        
      }
    },
    {
      key: '3',
      label: 'Delete',
      onClick: () => {
        message.info('Delete');
        fbDeleteProductImg(user, image)
      }
    },
  ];

  return (
    <Container>
      {images.map((image) => (
        <Thumbnail key={image.id}>
          <Dropdown
            menu={{ items: itemOption(image) }}
            trigger={['click']}
          >
            <ImageContainer>
              <Image
                preview={false}
                src={image.url || imgFailed}
                
                alt={`Thumbnail ${image}`}
              />
            </ImageContainer>
          </Dropdown>
        </Thumbnail>
      ))}

    </Container>
  )
}

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  margin-top: 20px;
  width: 100%;
`;

const Thumbnail = styled.div`
//border: 1px solid #ccc;
  /* border: 1px solid #ccc;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  */

`;
const ImageContainer = styled.div`
    width: 100%;
    height: 110px;
  
  
    overflow: hidden;
  `;

const Image = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    object-position: center;
    ${props => {
    if (props.selectedImage) {
      return `
        border: 1px solid blue;
      `;
    } else {
      return `
        border: 1px solid #ccc;
      `;
    }
  }}
    
  `;