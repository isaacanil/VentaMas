export function printPdfBase64(base64Data, options = {}) {
  // Detect mobile devices via simple UA check
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || ""
  );

  const defaultOptions = {
    showModal: true,
  };

  // Lazy‐load print-js only when needed to keep bundle size unchanged for callers
  const tryPrintJs = () => {
    try {
      // Dynamically import to avoid including print-js in every chunk
      return import("print-js").then((module) => {
        const printJS = module.default || module;
        printJS({
          printable: base64Data,
          type: "pdf",
          base64: true,
          ...defaultOptions,
          ...options,
        });
        return true;
      });
    } catch (e) {
      console.warn("print-js import/print failed", e);
      return Promise.resolve(false);
    }
  };

  // Fallback using Blob and window.open for mobile or if print-js fails
  const fallbackPrint = () => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank");

      if (newWindow) {
        const onLoad = () => {
          try {
            newWindow.focus();
            newWindow.print();
          } catch (e) {
            console.warn("window.print() failed inside newWindow", e);
          }
        };
        // Some browsers fire load immediately, others need listener
        if (newWindow.document?.readyState === "complete") {
          onLoad();
        } else {
          newWindow.addEventListener("load", onLoad);
        }
      } else {
        // As a last resort, trigger download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "document.pdf";
        link.click();
      }
    } catch (e) {
      console.error("PDF fallback printing failed", e);
    }
  };

  // Strategy: On desktop try print-js first. On mobile go directly to fallback (due to cross-origin issues).
  if (isMobile) {
    fallbackPrint();
  } else {
    tryPrintJs().then((success) => {
      if (!success) {
        fallbackPrint();
      }
    });
  }
} 