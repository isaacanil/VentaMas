import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, DragEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PreviewableFile } from '../types';
import useFileUploadController from './useFileUploadController';
import type {
  CreateLocalUploadFileContext,
  NormalizeLocalPreviewFileContext,
} from './useFileUploadController';

const FIREBASE_IMAGE_URL =
  'https://firebasestorage.googleapis.com/v0/b/app/o/uploads%2Ffoto.jpg?alt=media';
const EXTERNAL_PDF_URL = 'https://example.com/documento.pdf';

type TestFileType = 'document' | 'invoice' | 'receipt' | 'image' | 'pdf' | 'other';

type TestLocalInput = {
  id?: string;
  name?: string;
  type?: TestFileType;
  file?: File | { name?: string };
};

type TestRemoteInput = {
  id?: string;
  name?: string;
  type?: TestFileType;
  url?: string;
};

type TestListItem = PreviewableFile & {
  id?: string;
  name: string;
  type: TestFileType;
  file?: File;
  url?: string;
  isLocal: boolean;
  preview: string | null;
};

type TestAddedFile = {
  id: string;
  name: string;
  type: TestFileType;
  file: File;
  isLocal: true;
};

type ControllerOptions = Parameters<
  typeof useFileUploadController<
    TestLocalInput,
    TestRemoteInput,
    TestListItem,
    TestAddedFile,
    TestFileType
  >
>[0];

const isBrowserFile = (value: unknown): value is File => value instanceof File;

const makeFile = (name: string, type = 'text/plain') =>
  new File(['contenido'], name, { type });

const createLocalUploadFile = (
  file: File,
  { fileType, id }: CreateLocalUploadFileContext<TestFileType>,
): TestAddedFile => ({
  id,
  name: file.name,
  type: fileType,
  file,
  isLocal: true,
});

const normalizeLocalPreviewFile = (
  file: TestLocalInput,
  { defaultFileType, getLocalURL }: NormalizeLocalPreviewFileContext<TestFileType>,
): TestListItem => {
  const browserFile = isBrowserFile(file.file) ? file.file : undefined;

  return {
    ...file,
    id: file.id,
    name: file.name ?? browserFile?.name ?? 'Archivo sin nombre',
    type: file.type ?? defaultFileType,
    file: browserFile,
    isLocal: true,
    preview: browserFile ? getLocalURL(browserFile) : null,
  };
};

const renderController = (overrides: Partial<ControllerOptions> = {}) => {
  let idCounter = 0;
  const onAddFiles =
    overrides.onAddFiles === undefined ? vi.fn() : overrides.onAddFiles;
  const onRemoveFiles =
    overrides.onRemoveFiles === undefined ? vi.fn() : overrides.onRemoveFiles;
  const notifySuccess = overrides.notifySuccess ?? vi.fn();
  const notifyError = overrides.notifyError ?? vi.fn();
  const options: ControllerOptions = {
    files: [],
    attachmentUrls: [],
    defaultFileType: 'document',
    onAddFiles,
    onRemoveFiles,
    notifySuccess,
    notifyError,
    generateId: () => `file-${++idCounter}`,
    createLocalUploadFile,
    normalizeLocalPreviewFile,
    ...overrides,
  };
  const hook = renderHook(() => useFileUploadController(options));

  return {
    ...hook,
    onAddFiles,
    onRemoveFiles,
    notifySuccess,
    notifyError,
  };
};

describe('useFileUploadController', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((file: File) => `blob:${file.name}`),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('adds files from the file input with the selected type and removes files', () => {
    const { result, onAddFiles, onRemoveFiles, notifySuccess } =
      renderController();
    const file = makeFile('factura.pdf', 'application/pdf');

    act(() => {
      result.current.setFileType('invoice');
    });
    act(() => {
      result.current.handleFileInput({
        target: { files: [file] },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
    act(() => {
      result.current.handleRemoveFile('file-1');
    });

    expect(onAddFiles).toHaveBeenCalledWith([
      {
        id: 'file-1',
        name: 'factura.pdf',
        type: 'invoice',
        file,
        isLocal: true,
      },
    ]);
    expect(notifySuccess).toHaveBeenCalledWith('1 archivo(s) agregado(s)');
    expect(onRemoveFiles).toHaveBeenCalledWith('file-1');
  });

  it('filters disallowed extensions while keeping valid dropped files', () => {
    const { result, onAddFiles, notifyError } = renderController({
      acceptedFileTypes: '.pdf, .png',
      errorFileTypeMessage: 'No permitido: {files}',
    });
    const pdfFile = makeFile('recibo.pdf', 'application/pdf');
    const invalidFile = makeFile('script.exe', 'application/octet-stream');
    const preventDefault = vi.fn();

    act(() => {
      window.dispatchEvent(new Event('dragenter'));
    });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleDrop({
        preventDefault,
        dataTransfer: { files: [pdfFile, invalidFile] },
      } as unknown as DragEvent<HTMLDivElement>);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
    expect(notifyError).toHaveBeenCalledWith('No permitido: script.exe');
    expect(onAddFiles).toHaveBeenCalledWith([
      {
        id: 'file-1',
        name: 'recibo.pdf',
        type: 'document',
        file: pdfFile,
        isLocal: true,
      },
    ]);
  });

  it('blocks additions when maxFiles would be exceeded', () => {
    const existingFile = makeFile('existente.pdf', 'application/pdf');
    const { result, onAddFiles, notifyError } = renderController({
      files: [{ id: 'existing', file: existingFile, type: 'document' }],
      maxFiles: 1,
      errorMaxFilesMessage: 'Maximo {max}',
    });

    act(() => {
      result.current.addFiles([makeFile('nuevo.pdf', 'application/pdf')]);
    });

    expect(notifyError).toHaveBeenCalledWith('Maximo 1');
    expect(onAddFiles).not.toHaveBeenCalled();
  });

  it('normalizes local and Firebase remote files and revokes local previews', () => {
    const localImage = makeFile('local.png', 'image/png');
    const { result, unmount } = renderController({
      files: [{ id: 'local-id', file: localImage }],
      attachmentUrls: [
        {
          id: 'remote-id',
          name: 'foto.jpg',
          type: 'image',
          url: FIREBASE_IMAGE_URL,
        },
        {
          id: 'external-id',
          name: 'documento.pdf',
          type: 'pdf',
          url: EXTERNAL_PDF_URL,
        },
      ],
    });

    expect(result.current.allFiles).toEqual([
      {
        id: 'local-id',
        name: 'local.png',
        type: 'document',
        file: localImage,
        isLocal: true,
        preview: 'blob:local.png',
      },
      {
        id: 'remote-id',
        name: 'foto.jpg',
        type: 'image',
        url: FIREBASE_IMAGE_URL,
        isLocal: false,
        preview: null,
      },
    ]);
    expect(result.current.imageSlides.map((slide) => slide.src)).toEqual([
      'blob:local.png',
      FIREBASE_IMAGE_URL,
    ]);

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local.png');
  });

  it('opens the lightbox for images and drawer preview state for PDFs', () => {
    const imageFile = makeFile('foto.png', 'image/png');
    const pdfFile = makeFile('documento.pdf', 'application/pdf');
    const { result } = renderController({
      files: [
        { id: 'image-id', file: imageFile, type: 'image' },
        { id: 'pdf-id', file: pdfFile, type: 'pdf' },
      ],
    });

    act(() => {
      result.current.handlePreview(result.current.allFiles[0]);
    });

    expect(result.current.lightboxOpen).toBe(true);
    expect(result.current.lightboxIndex).toBe(0);

    act(() => {
      result.current.setLightboxOpen(false);
      result.current.handlePreview(result.current.allFiles[1]);
    });

    expect(result.current.lightboxOpen).toBe(false);
    expect(result.current.previewVisible).toBe(true);
    expect(result.current.previewFile?.name).toBe('documento.pdf');

    act(() => {
      result.current.setPreviewFile((currentFile) =>
        currentFile ? { ...currentFile, name: 'renombrado.pdf' } : currentFile,
      );
    });

    expect(result.current.previewFile?.name).toBe('renombrado.pdf');
  });
});
