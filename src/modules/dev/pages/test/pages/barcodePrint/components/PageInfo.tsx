interface BarcodeTypeOption {
  value: string;
  label: string;
}

interface PageInfoProps {
  quantity: number;
  codesPerPage: number;
  barcodeType: string;
  barcodeTypes?: BarcodeTypeOption[];
}

const PageInfo = ({
  quantity,
  codesPerPage,
  barcodeType,
  barcodeTypes,
}: PageInfoProps) => {
  const calculatePages = (quantityValue: number) => {
    return Math.ceil(quantityValue / codesPerPage);
  };

  const pages = calculatePages(quantity);
  const completePages = Math.floor(quantity / codesPerPage);
  const remainingCodes = quantity % codesPerPage;
  const selectedTypeLabel =
    barcodeTypes?.find((t) => t.value === barcodeType)?.label || barcodeType;

  return (
    <div className="page-info">
      <strong>Información de páginas:</strong>
      <br />• Códigos por página: {codesPerPage}
      <br />• Páginas necesarias: {pages}
      <br />• Total de códigos: {quantity}
      <br />• Tipo seleccionado: {selectedTypeLabel}
      {quantity > codesPerPage && (
        <>
          <br />• Distribución: {completePages} página(s) completa(s)
          {remainingCodes > 0 &&
            ` + ${remainingCodes} código(s) en la última página`}
        </>
      )}
    </div>
  );
};

export default PageInfo;
