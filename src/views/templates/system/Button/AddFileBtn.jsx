import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { toggleImageViewer } from '../../../../features/imageViewer/imageViewerSlice';
import { toggleLoader } from '../../../../features/loader/loaderSlice';
import {
  selectUploadImageLoading,
  selectUploadImageStatus,
  selectUploadImageUrl,
} from '../../../../features/uploadImg/uploadImageSlice';

export const AddFileBtn = ({ title, startIcon, endIcon, id, fn }) => {
  const process = useSelector(selectUploadImageStatus);
  const loading = useSelector(selectUploadImageLoading);
  const url = useSelector(selectUploadImageUrl);
  const [progress, setProgress] = useState(0);
  const [titleBtn, setTitleBtn] = useState(title);
  const [startIconBtn, setStartIconBtn] = useState(startIcon);
  const [endIconBtn, setEndIconBtn] = useState(endIcon);
  const dispatch = useDispatch();
  const handleOnchange = async (e) => {
    fn(e.target.files[0]);
  };

  useEffect(() => {
    setProgress(process);
  }, [process]);

  useEffect(() => {
    if (progress === 0 && loading === true) {
      dispatch(toggleLoader({ show: true, message: '0' }));
      setTitleBtn(title);
      setStartIconBtn(startIcon);
      setEndIconBtn(endIcon);
    }
    if (progress > 0 && progress < 100) {
      dispatch(
        toggleLoader({
          show: true,
          message: `cargando... ${progress.toFixed(1)}%`,
        }),
      );
      setTitleBtn(`cargando...`);
      setStartIconBtn(<FontAwesomeIcon icon={faSpinner} spin />);
      setEndIconBtn(null);
    }
    if (progress === 100) {
      setStartIconBtn(null);
      setEndIconBtn(null);
      setTitleBtn('Listo');
      dispatch(toggleLoader({ show: true, message: `Listo` }));

      const timer = setTimeout(() => {
        dispatch(toggleLoader({ show: false, message: '' }));
        setTitleBtn('Cambiar');
        dispatch(toggleImageViewer({ show: true, url }));
      }, 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [progress, url, loading, title, dispatch, endIcon, startIcon]);

  return (
    <Container $spin={progress > 0 && progress < 100}>
      <Progress $progressStatus={progress}></Progress>
      <label htmlFor={id}>
        {startIconBtn}
        {titleBtn}
        {endIconBtn}
        <input
          type="file"
          name=""
          id={id}
          onChange={(e) => handleOnchange(e)}
          accept="imagen/*"
        />
      </label>
    </Container>
  );
};

const Container = styled.div`
  overflow: hidden;
  height: 2em;
  border: 1px solid rgb(0 0 0 / 22.6%);
  position: relative;
  border-radius: 4px;
  transition: width 600ms ease-in-out;

  input {
    display: none;
  }

  label {
    display: flex;
    gap: 0.6em;
    align-items: center;
    height: 100%;
    padding: 0 0.6em;

    svg {
      font-size: 1.2em;
    }
  }
  ${({ $spin }) => {
    switch ($spin) {
      case true:
        return `
                label{
                    pointer-events: none;
                    &:hover{
                        cursor: not-allowed;
                    }
                    svg{
                        transform: rotate(360deg);
                        animation: spin 2s linear infinite;
                        @keyframes spin {
                            0% {
                                transform: rotate(0deg);
                            }
                            100% {
                                transform: rotate(360deg);
                            }
                        }
                    }
                }
                `;
      default:
        break;
    }
  }}
`;

const Progress = styled.div`
  position: absolute;
  width: ${({ $progressStatus }) => $progressStatus}%;
  height: 100%;
  pointer-events: none;
  background-color: rgb(66 164 245 / 55.5%);
  transition: width 600ms ease-in-out;
`;
