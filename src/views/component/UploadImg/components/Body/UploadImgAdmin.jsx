import { faTimes, faUpload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import noImg from '../../../../../assets/producto/noImg.png'
import { selectUser } from '../../../../../features/auth/userSlice'
import { fbAddProductImg } from '../../../../../firebase/products/productsImg/fbAddProductImg'
import { fbAddProductImgData } from '../../../../../firebase/products/productsImg/fbAddProductImgData'
import { AddFileBtn } from '../../../../templates/system/Button/AddFileBtn'
import { Button, ButtonGroup } from '../../../../templates/system/Button/Button'

export const UploadImgAdmin = ({ ImgToUpload, setImgToUpload, img }) => {
    const user = useSelector(selectUser);

    const handleSubmit = (img) => {
        fbAddProductImg(user, img)
            .then((url) => {
                fbAddProductImgData(user, url)
                setImgToUpload(null)
            })
    }

    return (
        <Container>
            <div className='uploadImg'>
                <h2>Subir Imagen</h2>
                <br />
                <ButtonGroup>
                    {
                        ImgToUpload &&
                        <Button
                            borderRadius='normal'
                            title={<FontAwesomeIcon icon={faTimes} />}
                            width='icon32'
                            onClick={() => setImgToUpload(null)}
                            bgcolor='error'
                        />
                    }
                    <AddFileBtn
                        title="Agregar"
                        setFile={setImgToUpload}
                        file={ImgToUpload}
                        startIcon={<FontAwesomeIcon icon={faUpload} />}
                        id="addImg"
                        fn={handleSubmit}
                    />
                    <Button
                        title='subir'
                        borderRadius='normal'
                        bgcolor='primary'
                        onClick={handleSubmit}
                        disabled={ImgToUpload ? false : true}
                    />
                </ButtonGroup>
            </div>
            <ImgContainer>
                <img src={img || noImg} alt="" />
            </ImgContainer>
        </Container>
    )
}

const Container = styled.div`
box-sizing: border-box;
h2{
    margin: 0;
    font-size: 18px;
}
height: 100%;
background-color: #fafafa;
display: grid;
padding: 0.4em 0.4em 0.4em 0.8em;
grid-template-columns: 1fr min-content;
border-radius: 8px;
position: relative;

            
        
`
const ImgContainer = styled.div`

align-self: center;
max-height: 5em;
height: 5em;
width: 5em;
background-color: #fff;
border-radius: 8px;
overflow: hidden;
img{
    object-fit: cover;
    object-position: center;
    height: 100%;
    width: 100%;
}
            
`