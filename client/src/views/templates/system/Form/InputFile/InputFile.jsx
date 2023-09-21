import { useRef } from 'react';

import styled from 'styled-components';
import { InputV4 } from '../../Inputs/GeneralInput/InputV4';
import { Button, ButtonGroup } from '../../Button/Button';
import { useDispatch } from 'react-redux';
import { toggleImageViewer } from '../../../../../features/imageViewer/imageViewerSlice';
import { isFirebaseStorageUrl } from '../../../../../utils/url/isValidUrl';
import { isImageFile } from '../../../../../utils/file/isValidFile';

const InputFile = ({ 
    label = 'Nombre del archivo: ', 
    labelVariant = 'label2',
    title = 'Subir', 
    img, 
    setImg, 
    showNameFile, 
    marginBottom = true
 }) => {
    const inputRef = useRef(null);
    const dispatch = useDispatch();

    const handleFile = (e) => {
        setImg(e.target.files[0]);
        e.target.value = null;
    };
    const handleOpenFile = () => {
        inputRef.current.click();
    };
    const resolveImgURL = (img) => {
        if (isFirebaseStorageUrl(img)) return img;
        if (isImageFile(img)) return URL.createObjectURL(img);
        return null;
    }

    const handleViewImage = () => {
        dispatch(toggleImageViewer({ show: true, url: resolveImgURL(img) }))
    };
    const getDisplayValue = () => {
        if (isImageFile(img)) return img.name;     
        if (isFirebaseStorageUrl(img)) return img;
        return ''; // valor por defecto si no se cumple ninguna condición
    }
    return (
        <div>
            <input type="file" ref={inputRef} style={{ display: 'none' }} onChange={handleFile} />
            <Group
                marginBottom = {marginBottom}
            >
                {showNameFile &&
                    <InputV4
                        label={label}
                        labelVariant={labelVariant}
                        readOnly
                        placeholder='[Nombre del archivo]'
                        value={
                            isImageFile(img) ? img.name :
                            isFirebaseStorageUrl(img) ? img :
                                    ''
                        }
                        size='medium'
                    />
                }
                {
                    !img &&
                    <Button
                        onClick={handleOpenFile}
                        title={title}
                        size='medium'
                        bgcolor='primary'
                    />
                }
                {
                    img &&
                    <ButtonGroup style={{ marginTop: "16px" }}>
                        <Button
                            onClick={handleViewImage}
                            title='Ver'
                            bgcolor='gray'
                        />
                        <Button
                            onClick={() => setImg("")}
                            title='Eliminar'
                            bgcolor='error'
                        />
                    </ButtonGroup>
                }
            </Group>
        </div>
    );
};

export default InputFile;

const Group = styled.div`
    display: grid;
    align-items: end;
    grid-template-columns: 1fr min-content ;
    gap: 1em;
    ${({ marginBottom }) => marginBottom && `
    margin-bottom: 1em;
    `}
`;

const IMG = styled.img`
    width: 50px; 
    height: 50px;   
`;
