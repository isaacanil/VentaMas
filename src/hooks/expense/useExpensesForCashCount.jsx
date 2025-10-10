import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectUser } from "../../features/auth/userSlice";
import { fbLoadExpensesForCashCount } from "../../firebase/cashCount/fbLoadExpensesForCashCount";

export const useExpensesForCashCount = (cashCountId) => {
  const [state, setState] = useState({
    count: 0,
    data: [],
    loading: true,
    error: null,
  });

  const user = useSelector(selectUser)

  useEffect(() => {
    if (!user?.businessID || !cashCountId) return;

    const abort = new AbortController();

    (async () => {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));

        const data = await fbLoadExpensesForCashCount(
          user,
          cashCountId,
          "all",
          { signal: abort.signal }
        );

        if (!abort.signal.aborted) setState(data); // ya trae count, invoices, loading:false
      } catch (err) {
        if (!abort.signal.aborted)
          setState((s) => ({ ...s, loading: false, error: err }));
      }
    })();

    return () => abort.abort();
  }, [user, cashCountId]);

  return state; // {count, invoices, loading, error}
};
