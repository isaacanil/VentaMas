import { useEffect } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';

type UseGlobalFileDragOverlayOptions = {
  setDragging: (value: boolean) => void;
  onFilesDrop: (files: File[]) => void;
};

const useGlobalFileDragOverlay = ({
  setDragging,
  onFilesDrop,
}: UseGlobalFileDragOverlayOptions) => {
  useEffect(() => {
    const handleDragEnter = (event: globalThis.DragEvent) => {
      event.preventDefault();
      setDragging(true);
    };

    const handleDragLeave = (event: globalThis.DragEvent) => {
      event.preventDefault();
      if (event.relatedTarget === null) {
        setDragging(false);
      }
    };

    window.addEventListener('dragenter', handleDragEnter as EventListener);
    window.addEventListener('dragleave', handleDragLeave as EventListener);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter as EventListener);
      window.removeEventListener('dragleave', handleDragLeave as EventListener);
    };
  }, [setDragging]);

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) {
      onFilesDrop(files);
    }
  };

  const handleDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragLeave = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.relatedTarget === null) {
      setDragging(false);
    }
  };

  return {
    handleDrop,
    handleDragOver,
    handleDragLeave,
  };
};

export default useGlobalFileDragOverlay;
