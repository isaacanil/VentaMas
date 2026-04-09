type PrintPdfOptions = {
  showModal?: boolean;
  [key: string]: unknown;
};

type PrintJsFn = (configuration: {
  printable: string;
  type: 'pdf';
  base64?: boolean;
  showModal?: boolean;
  [key: string]: unknown;
}) => void;

export async function printPdfBase64(
  base64Data: string,
  options: PrintPdfOptions = {},
): Promise<void> {
  // Detect mobile devices via simple UA check
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || '',
    );

  const defaultOptions = {
    showModal: true,
  };

  // Lazy‐load print-js only when needed to keep bundle size unchanged for callers
  const tryPrintJs = async (): Promise<boolean> => {
    try {
      // Dynamically import to avoid including print-js in every chunk
      const module = await import('print-js');
      const printJS = (module.default || module) as PrintJsFn;
      printJS({
        printable: base64Data,
        type: 'pdf',
        base64: true,
        ...defaultOptions,
        ...options,
      });
      return true;
    } catch (e) {
      console.warn('print-js import/print failed', e);
      return false;
    }
  };

  // Fallback using Blob and window.open for mobile or if print-js fails
  const fallbackPrint = (): boolean => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, '_blank');

      if (newWindow) {
        const onLoad = () => {
          try {
            newWindow.focus();
            newWindow.print();
          } catch (e) {
            console.warn('window.print() failed inside newWindow', e);
          }
        };
        // Some browsers fire load immediately, others need listener
        if (newWindow.document?.readyState === 'complete') {
          onLoad();
        } else {
          newWindow.addEventListener('load', onLoad);
        }
      } else {
        // As a last resort, trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'document.pdf';
        link.click();
      }
      return true;
    } catch (e) {
      console.error('PDF fallback printing failed', e);
      return false;
    }
  };

  // Strategy: On desktop try print-js first. On mobile go directly to fallback (due to cross-origin issues).
  if (isMobile) {
    if (!fallbackPrint()) {
      throw new Error('No se pudo abrir el PDF en este dispositivo.');
    }
  } else {
    const success = await tryPrintJs();
    if (!success && !fallbackPrint()) {
      throw new Error('No se pudo abrir el PDF para imprimir.');
    }
  }
}
