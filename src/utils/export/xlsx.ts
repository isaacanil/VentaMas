import { saveAs } from 'file-saver';

export const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const createXlsxBlob = (content: BlobPart): Blob =>
  new Blob([content], {
    type: XLSX_MIME_TYPE,
  });

export const saveXlsxFile = ({
  content,
  fileName,
}: {
  content: BlobPart;
  fileName: string;
}) => {
  saveAs(createXlsxBlob(content), fileName);
};
