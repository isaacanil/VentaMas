import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchErrorReports } from './errorReports.repository';

import type { ErrorReportRow, ErrorReportSummary } from './types';

export const useErrorReports = () => {
  const [rows, setRows] = useState<ErrorReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reports = await fetchErrorReports();
      setRows(reports);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los errores reportados.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const summary = useMemo<ErrorReportSummary>(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === 'resolved') {
          acc.resolved += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { pending: 0, resolved: 0, total: 0 },
    );
  }, [rows]);

  return {
    error,
    loading,
    reload: loadReports,
    rows,
    summary,
  };
};
