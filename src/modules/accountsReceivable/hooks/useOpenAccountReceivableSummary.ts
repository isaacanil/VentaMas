import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { setARDetailsModal } from '@/features/accountsReceivable/accountsReceivableSlice';

import { buildAccountReceivableListUrl } from '../utils/accountReceivableNavigation';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const useOpenAccountReceivableSummary = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  return useCallback(
    (arId: string) => {
      const nextArId = toCleanString(arId);
      if (!nextArId) return;

      dispatch(setARDetailsModal({ isOpen: true, arId: nextArId }));

      const targetUrl = buildAccountReceivableListUrl(nextArId);
      const currentUrl = `${location.pathname}${location.search}`;
      if (currentUrl !== targetUrl) {
        navigate(targetUrl);
      }
    },
    [dispatch, location.pathname, location.search, navigate],
  );
};
