let pdfMakePromise = null;

export async function getPdfMake() {
  if (!pdfMakePromise) {
    pdfMakePromise = (async () => {
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      const pdfFonts = pdfFontsModule.default || pdfFontsModule;

      const vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs;
      if (vfs) {
        pdfMake.vfs = vfs;
      }

      return pdfMake;
    })();
  }

  return pdfMakePromise;
}
