import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { toggleImageViewer } from '@/features/imageViewer/imageViewerSlice';
import { toggleLoader } from '@/features/loader/loaderSlice';
import {
  selectUploadImageLoading,
  selectUploadImageStatus,
  selectUploadImageUrl,
} from '@/features/uploadImg/uploadImageSlice';

type AddFileBtnProps = {
  title: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  id: string;
  fn: (file: File) => void;
};

export const AddFileBtn = ({
  title,
  startIcon,
  endIcon,
  id,
  fn,
}: AddFileBtnProps) => {
  const process = useSelector(selectUploadImageStatus);
  const loading = useSelector(selectUploadImageLoading);
  const url = useSelector(selectUploadImageUrl);
  const progress = process;
  const dispatch = useDispatch();
  const handleOnchange = async (e: any) => {
    fn(e.target.files[0]);
  };

  const buttonState = useMemo(() => {
    if (progress > 0 && progress < 100) {
      return {
        title: 'cargando...',
        startIcon: <FontAwesomeIcon icon={faSpinner} spin />,
        endIcon: null,
      };
    }

    if (progress === 100) {
      return {
        title: 'Listo',
        startIcon: null,
        endIcon: null,
      };
    }

    return {
      title,
      startIcon,
      endIcon,
    };
  }, [endIcon, progress, startIcon, title]);

  useEffect(() => {
    if (progress === 0 && loading === true) {
      dispatch(toggleLoader({ show: true, message: '0' }));
    }
    if (progress > 0 && progress < 100) {
      dispatch(
        toggleLoader({
          show: true,
          message: `cargando... ${progress.toFixed(1)}%`,
        }),
      );
    }
    if (progress === 100) {
      dispatch(toggleLoader({ show: true, message: `Listo` }));

      const timer = setTimeout(() => {
        dispatch(toggleLoader({ show: false, message: '' }));
        dispatch(toggleImageViewer({ show: true, url }));
      }, 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [dispatch, loading, progress, url]);

  return (
    <Container $spin={progress > 0 && progress < 100}>
      <Progress $progressStatus={progress}></Progress>
      <label htmlFor={id}>
        {buttonState.startIcon}
        {buttonState.title}
        {buttonState.endIcon}
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

const Container = styled.div<{ $spin?: boolean }>`
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
  ${(props) => {
    switch (props.$spin) {
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

const Progress = styled.div<{ $progressStatus?: number }>`
  position: absolute;
  width: ${(props) => props.$progressStatus}%;
  height: 100%;
  pointer-events: none;
  background-color: rgb(66 164 245 / 55.5%);
  transition: width 600ms ease-in-out;
`;
