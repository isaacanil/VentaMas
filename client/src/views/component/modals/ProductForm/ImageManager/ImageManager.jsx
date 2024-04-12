import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as  ant from 'antd';
const { Upload, Button, message, Dropdown, Typography, Divider } = ant;
import { ArrowLeftOutlined, InboxOutlined } from '@ant-design/icons';
import noImg from '../../../../../assets/product/noImg.png';
import { fbAddProductImg } from '../../../../../firebase/products/productsImg/fbAddProductImg';
import { fbAddProductImgData } from '../../../../../firebase/products/productsImg/fbAddProductImgData';
import { selectUser } from '../../../../../features/auth/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fbGetProductsImg } from '../../../../../firebase/products/productsImg/fbGetProductsImg';
import { Gallery } from './components/Gallery';
import { ChangeProductImage, selectUpdateProductData } from '../../../../../features/updateProduct/updateProductSlice';

const Container = styled.div`
  display: grid;
  gap: 1em;
  padding: 20px;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: min-content min-content;
  justify-content: space-between;
  width: 100%;
`;
const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;




// const Button = styled.button`
//   background-color: blue;
//   color: white;
//   padding: 10px 20px;
//   border: none;
//   cursor: pointer;
// `;

const SelectedImage = styled.div`
  
  /* width: 110px;
  height: 110px; */
  
  overflow: hidden;
    img{
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
`;

const SelectedImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: end;
  width: 100%;
  min-width: 200px;
  
`;
const UploadImage = styled.div`
 
  width: 200px;

  max-width: 300px;
`;

// React component
const ImageManager = ({ hideImageManager }) => {
  // You would manage state and functionality here
  const user = useSelector(selectUser);
  const [images, setImages] = useState([]);
  const [fileList, setFileList] = useState([]);
  const {product} = useSelector(selectUpdateProductData);
  const productImg = product?.productImageURL;
  const dispatch = useDispatch();
  const updateFileListWithProgress = (file, progress) => {
    console.log(file)
    setFileList(prevFileList => prevFileList.map(f => {
      if (f.uid === file.uid) {
        return { ...f, percent: progress, name: file.name, status: 'uploading' };
      }
      return f;
    }));
  };

  const props = {
    name: 'file',
    multiple: false,
    fileList,
    action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188',
    customRequest: async ({ file, onProgress }) => {
      try {
        const newFile = { ...file, percent: 0, status: 'uploading' };
        setFileList([newFile]);

        const updateProgress = (progress) => {
          updateFileListWithProgress(file, progress);
          if (onProgress) {
            onProgress({ percent: progress });
          }
        };

        const url = await fbAddProductImg(user, file, updateProgress);
        await fbAddProductImgData(user, url);
        message.success(`Imagen subida exitosamente.`);
        setFileList([{ ...newFile, status: 'done', url }]);
      } catch (error) {
        message.error(`${file.name} imagen no subida.`);
        setFileList([{ ...file, status: 'error' }]);
      } finally {
        setFileList([]);
      }
    },

  };
 
      
      
  console.log(fileList)

  useEffect(() => { fbGetProductsImg(user, setImages) }, [user])
  const uploadProgress = fileList.length > 0 ? fileList[0].percent : 0;
  return (
    <Container>
      <Toolbar>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={hideImageManager}
        >
          Atrás
        </Button>
      </Toolbar>
      <Divider orientation='left' style={{ margin: 0 }}>
        Cargar Imagen
      </Divider>
      <Header>
        <UploadImage>
          <Upload.Dragger {...props}  >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p>Haz clic o arrastra la imagen a esta área para subirla</p> 
            {
              fileList.length > 0 ? (<p>Subiendo {uploadProgress}%</p>) : null
            }  
          </Upload.Dragger>
        
        </UploadImage>
        <SelectedImageContainer>
          <SelectedImage>
            <ant.Image
              height={110}
              width={110}
            
              //src={selectedImage || noImg}
              src={productImg || noImg}
              alt="Selected"
              preview={productImg ? true : false}
              fallback={imgFailed}
            />
          </SelectedImage>
          <Button
            disabled={!productImg}
          onClick={() => dispatch(ChangeProductImage(null))}
          >
            Deselecionar
          </Button>
        </SelectedImageContainer>
      </Header>
      <Divider
        orientation='left'
        style={{ margin: 0 }}
      >
        Imágenes Subidas
      </Divider>
      <Typography.Text type='secondary'>
        Click en las imágenes para seleccionarlas
      </Typography.Text>
      <Gallery
        
        images={images}
      />
    </Container>
  );
};

export default ImageManager;


export const imgFailed = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg=="