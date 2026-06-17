export const TEXT_MIME_TYPE = 'text/plain;charset=utf-8';

export const downloadBlobFile = ({
  blob,
  fileName,
}: {
  blob: Blob;
  fileName: string;
}) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  try {
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
};

export const downloadTextFile = ({
  text,
  fileName,
}: {
  text: string;
  fileName: string;
}) => {
  downloadBlobFile({
    blob: new Blob([text], {
      type: TEXT_MIME_TYPE,
    }),
    fileName,
  });
};
