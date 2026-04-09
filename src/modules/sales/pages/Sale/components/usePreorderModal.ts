import { App } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice';
import {
  SelectSettingCart,
  loadCart,
  selectCart,
  setCartId,
} from '@/features/cart/cartSlice';
import { selectClientWithAuth } from '@/features/clientCart/clientCartSlice';
import { selectTaxReceiptType } from '@/features/taxReceipt/taxReceiptSlice';
import { fbGetPreorders } from '@/firebase/invoices/fbGetPreorders';
import { validateInvoiceCart } from '@/utils/invoiceValidation';
import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
import type { PreorderEntry, PreorderData } from './PreorderModal';

type UserIdentity = {
  businessID?: string;
  uid?: string;
};

type CartSettings = {
  billing?: {
    billingMode?: string;
  };
};

type CartState = {
  data?: {
    type?: string;
  };
};

type FirestoreTimestamp = {
  seconds?: number;
  nanoseconds?: number;
};

type PreorderDoc = { data?: PreorderData } | PreorderData;

const resolvePreorderTaxReceiptType = (preorder?: PreorderData | null) =>
  preorder?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.taxReceipt?.type ??
  null;

export const usePreorderModal = () => {
  const { notification } = App.useApp();
  const dispatch = useDispatch<any>();
  const user = useSelector(selectUser) as UserIdentity | null;
  const cart = useSelector(selectCart) as CartState | null;
  const cartSettings = useSelector(SelectSettingCart) as CartSettings | null;
  const businessID = user?.businessID;
  const navigate = useNavigate();
  const location = useLocation();
  const isDeferredBillingEnabled =
    cartSettings?.billing?.billingMode === 'deferred';

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preorders, setPreorders] = useState<PreorderDoc[]>([]);
  const [userSelectedKey, setUserSelectedKey] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const isModalOpen = isDeferredBillingEnabled && isOpen;

  useEffect(() => {
    if (!isModalOpen || !businessID) {
      return undefined;
    }

    let isSubscribed = true;
    let unsubscribe: (() => void) | undefined = undefined;

    const subscribe = async () => {
      try {
        setIsLoading(true);
        unsubscribe = await fbGetPreorders(
          user,
          (docs: any) => {
            if (!isSubscribed) return;
            setPreorders((docs as PreorderDoc[]) || []);
            setIsLoading(false);
            setLastUpdatedAt(Date.now());
          },
          (error) => {
            if (!isSubscribed) return;
            setIsLoading(false);
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Verifica tu conexion e intenta de nuevo.';
            notification.error({
              message: 'No se pudieron cargar las preventas',
              description: errorMessage,
            });
          },
        );
      } catch (error) {
        if (!isSubscribed) return;
        setIsLoading(false);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Verifica tu conexión e intenta de nuevo.';
        notification.error({
          message: 'No se pudieron cargar las preventas',
          description: errorMessage,
        });
      }
    };

    subscribe();

    return () => {
      isSubscribed = false;
      unsubscribe?.();
    };
  }, [isModalOpen, businessID, notification, reloadToken, user]);

  const handleOpen = () => {
    if (!isDeferredBillingEnabled) {
      return;
    }
    if (!businessID) {
      notification.warning({
        message: 'Acción no disponible',
        description:
          'Debes seleccionar un negocio válido antes de cargar preventas.',
      });
      return;
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRetry = () => {
    if (!isModalOpen) return;
    setLastUpdatedAt(null);
    setPreorders([]);
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  };

  const entries = useMemo<PreorderEntry[]>(() => {
    const mappedEntries = preorders.map((preorder, index) => {
      const data =
        (preorder && typeof preorder === 'object' && 'data' in preorder
          ? preorder.data
          : preorder) ?? {};
      const normalizedData = data as PreorderData;
      const keySource =
        normalizedData.id ||
        normalizedData?.preorderDetails?.numberID ||
        `preorder-${index}`;
      return {
        key: String(keySource),
        id: normalizedData.id,
        raw: normalizedData,
        number: normalizedData?.preorderDetails?.numberID || '—',
        client: normalizedData?.client?.name || 'Cliente sin nombre',
        total: Number(normalizedData?.totalPurchase?.value || 0),
        status: normalizedData?.status || 'pending',
        createdAt: (() => {
          const date = normalizedData?.preorderDetails?.date;
          if (!date) return null;
          if (
            typeof date === 'object' &&
            'seconds' in date &&
            typeof date.seconds === 'number'
          ) {
            return new Date(date.seconds * 1000);
          }
          if (typeof date === 'number') {
            return new Date(date);
          }
          return null;
        })(),
      };
    });

    mappedEntries.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return 0;
    });

    return mappedEntries;
  }, [preorders]);

  const selectedPreorderKey = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }
    if (
      userSelectedKey &&
      entries.some((entry) => entry.key === userSelectedKey)
    ) {
      return userSelectedKey;
    }
    return entries[0].key;
  }, [entries, userSelectedKey]);

  const selectorOptions = useMemo(
    () =>
      entries.map((item) => ({
        value: item.key,
        label: `#${item.number} · ${item.client} · ${formatInvoicePrice(item.total, item.raw)}`,
        data: item,
      })),
    [entries],
  );

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.key === selectedPreorderKey) || null,
    [entries, selectedPreorderKey],
  );

  const convertTimestampsToMillis = (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => convertTimestampsToMillis(item));
    }

    const converted: Record<string, unknown> = {};
    const record = obj as Record<string, unknown>;
    for (const key in record) {
      const value = record[key];

      if (
        value &&
        typeof value === 'object' &&
        'seconds' in value &&
        'nanoseconds' in value
      ) {
        const timestamp = value as FirestoreTimestamp;
        converted[key] =
          (timestamp.seconds ?? 0) * 1000 +
          Math.floor((timestamp.nanoseconds ?? 0) / 1000000);
      } else if (value && typeof value === 'object') {
        converted[key] = convertTimestampsToMillis(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  };

  const onLoadPreorder = (preorder?: PreorderData | null) => {
    if (!preorder) {
      return;
    }
    const { isValid, message } = validateInvoiceCart(preorder);
    if (!isValid) {
      notification.warning({
        message: 'No se pudo cargar la preventa',
        description: message || 'Verifica el contenido antes de continuar.',
      });
      return;
    }

    const serializedPreorder = convertTimestampsToMillis(
      preorder,
    ) as PreorderData;

    dispatch(loadCart(serializedPreorder));
    dispatch(setCartId(undefined));
    const storedTaxReceiptType =
      resolvePreorderTaxReceiptType(serializedPreorder);
    if (storedTaxReceiptType) {
      dispatch(selectTaxReceiptType(storedTaxReceiptType));
    }
    if (serializedPreorder?.client) {
      dispatch(selectClientWithAuth(serializedPreorder.client as any));
    }

    const params = new URLSearchParams(location.search);
    params.set('mode', 'preorder');
    if (serializedPreorder?.id) {
      params.set('preorderId', serializedPreorder.id);
    } else {
      params.delete('preorderId');
    }
    params.set('preserveCart', '1');
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
      },
      { replace: true },
    );

    notification.success({
      message: 'Preventa cargada',
      description: `Se cargó la preventa ${serializedPreorder?.preorderDetails?.numberID || ''} del cliente ${serializedPreorder?.client?.name || 'sin nombre'}.`,
    });
    setIsOpen(false);
  };

  useEffect(() => {
    if (location.pathname !== '/sales') return;
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const preorderIdParam = params.get('preorderId');

    if (
      mode === 'preorder' &&
      preorderIdParam &&
      cart?.data?.type !== 'preorder'
    ) {
      params.delete('preorderId');
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : '',
        },
        { replace: true },
      );
    }
  }, [
    cart?.data?.type,
    location.pathname,
    location.search,
    navigate,
  ]);

  return {
    isOpen: isModalOpen,
    isLoading,
    lastUpdatedAt,
    entries,
    selectedPreorderKey,
    selectorOptions,
    selectedEntry,
    isDeferredBillingEnabled,
    openModal: handleOpen,
    closeModal: handleClose,
    handleRetry,
    onLoadPreorder,
    setUserSelectedKey,
  };
};
