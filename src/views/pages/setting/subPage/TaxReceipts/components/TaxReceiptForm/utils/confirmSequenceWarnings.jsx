import { Modal } from "antd";

export const confirmSequenceWarnings = async (insights) => {
  const currentConflict = insights?.currentConflict;
  const availableBefore = insights?.availableBefore ?? [];
  const availableAfter = insights?.availableAfter ?? [];
  const usedBefore = insights?.usedBefore ?? [];
  const usedAfter = insights?.usedAfter ?? [];
  const lastUsed = insights?.lastUsed;

  const shouldWarn =
    !!currentConflict ||
    availableBefore.length > 0 ||
    availableAfter.length > 0 ||
    usedBefore.length > 0 ||
    usedAfter.length > 0;

  if (!shouldWarn) {
    return true;
  }

  const renderInvoiceList = (items) => (
    <ul>
      {items.map((invoice) => {
        const display = invoice.ncf ?? invoice.id ?? "Factura sin identificador";
        return <li key={invoice.id ?? display}>{display}</li>;
      })}
    </ul>
  );

  const warningContent = (
    <div>
      {currentConflict && (
        <div>
          <p>
            Ya existe un comprobante emitido con la secuencia actual:
            <strong style={{ display: "block" }}>{currentConflict.ncf}</strong>
          </p>
          {currentConflict.invoices?.length ? (
            <div>
              <p>Facturas encontradas:</p>
              {renderInvoiceList(currentConflict.invoices)}
            </div>
          ) : null}
        </div>
      )}

      {lastUsed && (
        <div style={{ marginTop: 16 }}>
          <p>
            Último comprobante emitido encontrado:
            <strong style={{ display: "block" }}>{lastUsed.ncf}</strong>
          </p>
        </div>
      )}

      {availableBefore.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p>NCF disponibles antes de la secuencia actual:</p>
          <ul>
            {availableBefore.map((item) => (
              <li key={`available-before-${item.number}`}>{item.ncf}</li>
            ))}
          </ul>
        </div>
      )}

      {availableAfter.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p>NCF disponibles después de la secuencia actual:</p>
          <ul>
            {availableAfter.map((item) => (
              <li key={`available-after-${item.number}`}>{item.ncf}</li>
            ))}
          </ul>
        </div>
      )}

      {usedBefore.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p>Ya existen facturas emitidas con estos NCF anteriores:</p>
          <ul>
            {usedBefore.map((item) => {
              const invoicesCount = item.invoices?.length ?? 0;
              const suffix = invoicesCount
                ? ` · ${invoicesCount} factura${invoicesCount > 1 ? "s" : ""}`
                : "";
              return (
                <li key={`used-before-${item.number}`}>
                  {item.ncf}
                  {suffix}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {usedAfter.length > 0 && (
        <div
          style={{
            marginTop:
              currentConflict ||
              lastUsed ||
              availableBefore.length > 0 ||
              availableAfter.length > 0 ||
              usedBefore.length > 0
                ? 16
                : 0,
          }}
        >
          <p>Ya existen facturas emitidas con estos NCF posteriores:</p>
          <ul>
            {usedAfter.map((item) => {
              const invoicesCount = item.invoices?.length ?? 0;
              const suffix = invoicesCount
                ? ` · ${invoicesCount} factura${invoicesCount > 1 ? "s" : ""}`
                : "";
              return (
                <li key={`used-after-${item.number}`}>
                  {item.ncf}
                  {suffix}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p style={{ marginTop: 16 }}>
        ¿Deseas guardar la configuración con estas observaciones?
      </p>
    </div>
  );

  return new Promise((resolve) => {
    let settled = false;
    const safeResolve = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    Modal.confirm({
      title: "Revisión de secuencia fiscal",
      content: warningContent,
      okText: "Guardar de todos modos",
      cancelText: "Cancelar",
      centered: true,
      onOk: () => safeResolve(true),
      onCancel: () => safeResolve(false),
      afterClose: () => safeResolve(false),
    });
  });
};
