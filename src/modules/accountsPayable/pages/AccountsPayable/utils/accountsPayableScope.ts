interface AccountsPayableQueryScopeNoticeParams {
  isClientFilteredQuery: boolean;
  isQueryLimitReached: boolean;
  queryLimit: number;
  queryLimitMax?: number | null;
  rawDocCount: number;
}

interface AccountsPayableLimitedSelectionNoticeParams
  extends AccountsPayableQueryScopeNoticeParams {
  actionLabel: string;
  hasSelectedRows: boolean;
}

export const buildAccountsPayableQueryScopeNotice = ({
  isClientFilteredQuery,
  isQueryLimitReached,
  queryLimit,
  queryLimitMax,
  rawDocCount,
}: AccountsPayableQueryScopeNoticeParams): string => {
  const notices = [] as string[];

  if (isClientFilteredQuery) {
    notices.push(
      `Modo compatibilidad: se leyeron ${rawDocCount} registros y algunos filtros se aplicaron en el navegador.`,
    );
  }

  if (isQueryLimitReached) {
    notices.push(
      `Consulta acotada a ${queryLimit} registros${
        queryLimitMax ? ` de un maximo operativo de ${queryLimitMax}` : ''
      }.`,
    );
  }

  return notices.join(' ');
};

export const appendAccountsPayableQueryScopeNotice = (
  description: string,
  notice: string,
): string => {
  const trimmedDescription = description.trim();
  const trimmedNotice = notice.trim();

  return trimmedNotice
    ? `${trimmedDescription} ${trimmedNotice}`
    : trimmedDescription;
};

export const buildAccountsPayableLimitedSelectionNotice = ({
  actionLabel,
  hasSelectedRows,
  isClientFilteredQuery,
  isQueryLimitReached,
  queryLimit,
  queryLimitMax,
  rawDocCount,
}: AccountsPayableLimitedSelectionNoticeParams): string | null => {
  if (hasSelectedRows || (!isClientFilteredQuery && !isQueryLimitReached)) {
    return null;
  }

  return appendAccountsPayableQueryScopeNotice(
    `Selecciona filas específicas antes de ${actionLabel} con alcance limitado.`,
    buildAccountsPayableQueryScopeNotice({
      isClientFilteredQuery,
      isQueryLimitReached,
      queryLimit,
      queryLimitMax,
      rawDocCount,
    }),
  );
};
