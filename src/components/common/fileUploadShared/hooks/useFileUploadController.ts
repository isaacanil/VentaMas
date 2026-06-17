import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

import {
  getFileTypeFromUrl,
  getLocalURL,
  isImageFile,
  isPDFFile,
  revokeLocalURL,
} from '@/utils/fileUtils';

import {
  createImageLightboxSlides,
  getImageLightboxIndex,
  normalizeFirebaseRemoteAttachments,
  revokeLocalPreviewUrls,
  type FirebaseRemoteAttachmentPreviewItem,
} from '../previewUtils';
import type { LightboxSlide, PreviewableFile } from '../types';
import useGlobalFileDragOverlay from './useGlobalFileDragOverlay';

type FileTypeKey = string;

type RemoteAttachmentLike = {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  url?: string | null;
};

export type CreateLocalUploadFileContext<TFileType extends FileTypeKey> = {
  fileType: TFileType;
  id: string;
};

export type NormalizeLocalPreviewFileContext<TFileType extends FileTypeKey> = {
  defaultFileType: TFileType;
  getLocalURL: (file: File) => string;
};

type UseFileUploadControllerOptions<
  TLocalFile,
  TRemoteAttachment extends RemoteAttachmentLike,
  TListFile extends PreviewableFile,
  TAddedFile,
  TFileType extends FileTypeKey,
> = {
  files: readonly TLocalFile[];
  attachmentUrls: readonly TRemoteAttachment[];
  defaultFileType: TFileType;
  onAddFiles?: ((files: TAddedFile[]) => void) | null;
  onRemoveFiles?: ((fileId: string) => void) | null;
  maxFiles?: number | null;
  acceptedFileTypes?: string | null;
  successMessage?: string;
  errorMaxFilesMessage?: string;
  errorFileTypeMessage?: string;
  notifySuccess?: (message: string) => void;
  notifyError?: (message: string) => void;
  generateId?: () => string;
  createLocalUploadFile: (
    file: File,
    context: CreateLocalUploadFileContext<TFileType>,
  ) => TAddedFile;
  normalizeLocalPreviewFile: (
    file: TLocalFile,
    context: NormalizeLocalPreviewFileContext<TFileType>,
  ) => TListFile;
  mapRemotePreviewFile?: (
    file: FirebaseRemoteAttachmentPreviewItem<TFileType>,
  ) => TListFile;
  resolveRemoteType?: (
    attachment: TRemoteAttachment,
    url: string,
  ) => TFileType | null | undefined;
};

type FileUploadUiState<TListFile extends PreviewableFile, TFileType extends string> = {
  fileType: TFileType;
  isDragging: boolean;
  previewFile: TListFile | null;
  previewVisible: boolean;
  lightboxOpen: boolean;
  lightboxIndex: number;
};

type FileUploadUiAction<TListFile extends PreviewableFile, TFileType extends string> =
  | { type: 'setFileType'; fileType: TFileType }
  | { type: 'setDragging'; value: boolean }
  | { type: 'openPreview'; file: TListFile }
  | { type: 'setPreviewVisible'; value: boolean }
  | { type: 'setPreviewFile'; file: TListFile | null }
  | { type: 'openLightbox'; index: number }
  | { type: 'setLightboxOpen'; value: boolean }
  | { type: 'setLightboxIndex'; index: number };

const createInitialFileUploadUiState = <
  TListFile extends PreviewableFile,
  TFileType extends string,
>(
  defaultFileType: TFileType,
): FileUploadUiState<TListFile, TFileType> => ({
  fileType: defaultFileType,
  isDragging: false,
  previewFile: null,
  previewVisible: false,
  lightboxOpen: false,
  lightboxIndex: 0,
});

const fileUploadUiReducer = <
  TListFile extends PreviewableFile,
  TFileType extends string,
>(
  state: FileUploadUiState<TListFile, TFileType>,
  action: FileUploadUiAction<TListFile, TFileType>,
): FileUploadUiState<TListFile, TFileType> => {
  switch (action.type) {
    case 'setFileType':
      return { ...state, fileType: action.fileType };
    case 'setDragging':
      return { ...state, isDragging: action.value };
    case 'openPreview':
      return {
        ...state,
        previewFile: action.file,
        previewVisible: true,
      };
    case 'setPreviewVisible':
      return { ...state, previewVisible: action.value };
    case 'setPreviewFile':
      return { ...state, previewFile: action.file };
    case 'openLightbox':
      return {
        ...state,
        lightboxIndex: action.index,
        lightboxOpen: true,
      };
    case 'setLightboxOpen':
      return { ...state, lightboxOpen: action.value };
    case 'setLightboxIndex':
      return { ...state, lightboxIndex: action.index };
    default:
      return state;
  }
};

const createFileId = () => Math.random().toString(36).slice(2, 11);

const getNormalizedAcceptedExtensions = (
  acceptedFileTypes?: string | null,
): string[] =>
  acceptedFileTypes
    ? acceptedFileTypes
        .split(',')
        .map((extension) => extension.trim().toLowerCase())
        .filter(Boolean)
    : [];

const getFileExtension = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return extension ? `.${extension}` : '';
};

export const useFileUploadController = <
  TLocalFile,
  TRemoteAttachment extends RemoteAttachmentLike,
  TListFile extends PreviewableFile,
  TAddedFile,
  TFileType extends FileTypeKey = FileTypeKey,
>({
  files,
  attachmentUrls,
  defaultFileType,
  onAddFiles = null,
  onRemoveFiles = null,
  maxFiles = null,
  acceptedFileTypes = null,
  successMessage = '{count} archivo(s) agregado(s)',
  errorMaxFilesMessage = 'Solo puede subir un maximo de {max} archivos',
  errorFileTypeMessage = 'Tipo(s) de archivo no permitido(s): {files}',
  notifySuccess,
  notifyError,
  generateId = createFileId,
  createLocalUploadFile,
  normalizeLocalPreviewFile,
  mapRemotePreviewFile,
  resolveRemoteType,
}: UseFileUploadControllerOptions<
  TLocalFile,
  TRemoteAttachment,
  TListFile,
  TAddedFile,
  TFileType
>) => {
  const [uiState, dispatchUi] = useReducer(
    fileUploadUiReducer<TListFile, TFileType>,
    defaultFileType,
    createInitialFileUploadUiState<TListFile, TFileType>,
  );
  const {
    fileType,
    isDragging,
    previewFile,
    previewVisible,
    lightboxOpen,
    lightboxIndex,
  } = uiState;

  const acceptedExtensions = useMemo(
    () => getNormalizedAcceptedExtensions(acceptedFileTypes),
    [acceptedFileTypes],
  );

  const setFileType = useCallback((value: TFileType) => {
    dispatchUi({ type: 'setFileType', fileType: value });
  }, []);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      if (maxFiles && files.length + newFiles.length > maxFiles) {
        notifyError?.(errorMaxFilesMessage.replace('{max}', String(maxFiles)));
        return;
      }

      let filesToAdd = newFiles;

      if (acceptedExtensions.length > 0) {
        const invalidFiles = filesToAdd.filter(
          (file) => !acceptedExtensions.includes(getFileExtension(file)),
        );

        if (invalidFiles.length > 0) {
          notifyError?.(
            errorFileTypeMessage.replace(
              '{files}',
              invalidFiles.map((file) => file.name).join(', '),
            ),
          );

          filesToAdd = filesToAdd.filter((file) =>
            acceptedExtensions.includes(getFileExtension(file)),
          );

          if (filesToAdd.length === 0) return;
        }
      }

      if (!onAddFiles) return;

      const filesWithType = filesToAdd.map((file) =>
        createLocalUploadFile(file, {
          fileType,
          id: generateId(),
        }),
      );

      onAddFiles(filesWithType);
      notifySuccess?.(
        successMessage.replace('{count}', String(filesToAdd.length)),
      );
    },
    [
      acceptedExtensions,
      createLocalUploadFile,
      errorFileTypeMessage,
      errorMaxFilesMessage,
      fileType,
      files.length,
      generateId,
      maxFiles,
      notifyError,
      notifySuccess,
      onAddFiles,
      successMessage,
    ],
  );

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      if (selectedFiles.length > 0) {
        addFiles(selectedFiles);
      }
    },
    [addFiles],
  );

  const setDragging = useCallback((value: boolean) => {
    dispatchUi({ type: 'setDragging', value });
  }, []);

  const { handleDrop, handleDragOver, handleDragLeave } =
    useGlobalFileDragOverlay({
      setDragging,
      onFilesDrop: addFiles,
    });

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      onRemoveFiles?.(fileId);
    },
    [onRemoveFiles],
  );

  const allFiles = useMemo<TListFile[]>(() => {
    const localFiles = files.map((file) =>
      normalizeLocalPreviewFile(file, {
        defaultFileType,
        getLocalURL,
      }),
    );
    const remoteFiles = normalizeFirebaseRemoteAttachments<
      TRemoteAttachment,
      TFileType
    >(attachmentUrls, {
      resolveType:
        resolveRemoteType ??
        ((_attachment, url) => getFileTypeFromUrl(url) as TFileType),
    }).map((file) =>
      mapRemotePreviewFile
        ? mapRemotePreviewFile(file)
        : (file as unknown as TListFile),
    );

    return [...localFiles, ...remoteFiles];
  }, [
    attachmentUrls,
    defaultFileType,
    files,
    mapRemotePreviewFile,
    normalizeLocalPreviewFile,
    resolveRemoteType,
  ]);

  const imageSlides = useMemo<LightboxSlide[]>(
    () => createImageLightboxSlides(allFiles),
    [allFiles],
  );

  useEffect(() => {
    return () => {
      revokeLocalPreviewUrls(allFiles, revokeLocalURL);
    };
  }, [allFiles]);

  const handlePreview = useCallback(
    (file: TListFile) => {
      const fileName = file.name ?? '';

      if (isImageFile(fileName)) {
        dispatchUi({
          type: 'openLightbox',
          index: getImageLightboxIndex(imageSlides, file),
        });
      } else if (isPDFFile(fileName)) {
        dispatchUi({ type: 'openPreview', file });
      }
    },
    [imageSlides],
  );

  const setPreviewVisible = useCallback((value: boolean) => {
    dispatchUi({ type: 'setPreviewVisible', value });
  }, []);

  const setPreviewFile = useCallback<
    Dispatch<SetStateAction<TListFile | null>>
  >(
    (nextValue) => {
      const value =
        typeof nextValue === 'function' ? nextValue(previewFile) : nextValue;
      dispatchUi({ type: 'setPreviewFile', file: value });
    },
    [previewFile],
  );

  const setLightboxOpen = useCallback((value: boolean) => {
    dispatchUi({ type: 'setLightboxOpen', value });
  }, []);

  const setLightboxIndex = useCallback((index: number) => {
    dispatchUi({ type: 'setLightboxIndex', index });
  }, []);

  return {
    fileType,
    setFileType,
    isDragging,
    previewFile,
    previewVisible,
    lightboxOpen,
    lightboxIndex,
    allFiles,
    imageSlides,
    addFiles,
    handleFileInput,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleRemoveFile,
    handlePreview,
    setPreviewVisible,
    setPreviewFile,
    setLightboxOpen,
    setLightboxIndex,
  };
};

export default useFileUploadController;
