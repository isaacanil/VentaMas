import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';
import { STATUS_LABELS } from './subscription.constants';
import type {
    BillingCheckoutResult,
    StatusTone,
    UnknownRecord,
} from './subscription.types';

export const asRecord = (value: unknown): UnknownRecord =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as UnknownRecord)
        : {};

export const toCleanString = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

export const toMillis = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value > 1_000_000_000_000 ? value : value * 1000;
    }
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    if (value && typeof value === 'object') {
        const withMillis = value as { toMillis?: () => number; seconds?: unknown; _seconds?: unknown };
        if (typeof withMillis.toMillis === 'function') return withMillis.toMillis();
        // Firestore Timestamp via client SDK: { seconds, nanoseconds }
        // Firestore Timestamp serialized from Admin SDK via callable: { _seconds, _nanoseconds }
        const seconds = withMillis.seconds ?? withMillis._seconds;
        if (typeof seconds === 'number' && Number.isFinite(seconds)) {
            return seconds * 1000;
        }
    }
    return null;
};

export const toFiniteNumber = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const NOTICE_WINDOW_OPTIONS = [0, 7, 15, 30, 90] as const;

export const normalizeNoticeWindowDays = (
    value: unknown,
    fallback: (typeof NOTICE_WINDOW_OPTIONS)[number] = 30,
): (typeof NOTICE_WINDOW_OPTIONS)[number] => {
    const parsed = toFiniteNumber(value);
    if (parsed == null) return fallback;
    return NOTICE_WINDOW_OPTIONS.includes(parsed as (typeof NOTICE_WINDOW_OPTIONS)[number])
        ? (parsed as (typeof NOTICE_WINDOW_OPTIONS)[number])
        : fallback;
};

export const resolveStatusTone = (status: string | null): StatusTone => {
    if (status === 'active' || status === 'trialing') return 'green';
    if (status === 'none' || status === 'past_due' || status === 'unpaid' || status === 'scheduled') {
        return 'orange';
    }
    return 'red';
};

export const getStatusLabel = (status: string | null): string =>
    status ? STATUS_LABELS[status] || status : 'Sin estado';

export const formatDateTime = (value: number | null): string =>
    value ? new Date(value).toLocaleString() : 'No disponible';

export const formatDate = (
    value: number | null,
    options?: Intl.DateTimeFormatOptions,
): string => {
    if (!value) return 'No disponible';
    return new Intl.DateTimeFormat('es-DO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...options,
    }).format(new Date(value));
};

export const formatLimit = (limit: number | null): string => {
    if (limit == null) return 'No definido';
    if (limit < 0) return 'Ilimitado';
    return limit.toLocaleString();
};

export const formatMoney = (amount: number | null, currency = 'DOP'): string => {
    if (amount == null) return 'No definido';
    try {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${amount.toLocaleString()} ${currency}`;
    }
};

export const ACTIVE_SUBSCRIPTION_PROVIDER_ID = 'cardnet';

export const getProviderLabel = (provider: string | null): string => {
    const normalizedProvider = toCleanString(provider)?.toLowerCase() || null;
    if (normalizedProvider === 'azul') return 'Azul';
    if (normalizedProvider === 'cardnet') return 'CardNET';
    if (normalizedProvider === 'manual') return 'Portal de facturación';
    if (!normalizedProvider) return 'No disponible';
    return normalizedProvider.charAt(0).toUpperCase() + normalizedProvider.slice(1);
};

export const resolveSubscriptionProviderId = (
    provider: string | null | undefined,
): string => {
    void provider;
    return ACTIVE_SUBSCRIPTION_PROVIDER_ID;
};

export const resolveSubscriptionProviderLabel = (
    provider: string | null | undefined,
): string => getProviderLabel(resolveSubscriptionProviderId(provider));

export const resolvePreferredCheckoutProvider = (
    preferredProvider: string | null | undefined,
    providersImplemented: readonly unknown[] | null | undefined,
): string | null => {
    const normalizedPreferredProvider =
        toCleanString(preferredProvider)?.toLowerCase() || null;
    if (!normalizedPreferredProvider) return null;

    const normalizedImplementedProviders = Array.isArray(providersImplemented)
        ? providersImplemented
            .map((providerId) => toCleanString(providerId)?.toLowerCase() || null)
            .filter((providerId): providerId is string => providerId !== null)
        : [];

    if (normalizedImplementedProviders.length === 0) return null;

    return normalizedImplementedProviders.includes(normalizedPreferredProvider)
        ? normalizedPreferredProvider
        : null;
};

export const isSameOriginCheckoutProxyUrl = (
    rawUrl: string,
    currentOrigin: string | null | undefined,
): boolean => {
    const normalizedOrigin = toCleanString(currentOrigin);
    const normalizedUrl = toCleanString(rawUrl);
    if (!normalizedOrigin || !normalizedUrl) return false;

    try {
        const targetUrl = new URL(normalizedUrl);
        return (
            targetUrl.origin === normalizedOrigin &&
            targetUrl.pathname === '/checkout'
        );
    } catch {
        return false;
    }
};

export const normalizePaymentStatus = (
    rawStatus: string | null,
): 'pagado' | 'pendiente' | 'fallido' | 'cancelado' | 'desconocido' => {
    const status = toCleanString(rawStatus)?.toLowerCase() || null;
    if (!status) return 'desconocido';
    if (['paid', 'pagado', 'approved', 'success', 'succeeded', 'completed'].includes(status)) {
        return 'pagado';
    }
    if (['pending', 'pendiente', 'scheduled', 'processing', 'open'].includes(status)) {
        return 'pendiente';
    }
    if (['void', 'canceled', 'cancelled', 'cancelado'].includes(status)) {
        return 'cancelado';
    }
    if (['failed', 'fallido', 'declined', 'rejected', 'unpaid'].includes(status)) {
        return 'fallido';
    }
    return 'desconocido';
};

export const isSuccessfulPaymentStatus = (rawStatus: string | null): boolean =>
    normalizePaymentStatus(rawStatus) === 'pagado';

export const resolveOwnership = (business: unknown, user: unknown) => {
    const root = asRecord(business);
    const businessNode = asRecord(root.business);
    const nestedBusinessNode = asRecord(businessNode.business);
    const userRecord = asRecord(user);
    const authUid =
        toCleanString(userRecord.uid) || toCleanString(userRecord.id) || null;
    const ownerUid =
        toCleanString(root.ownerUid) ||
        toCleanString(businessNode.ownerUid) ||
        toCleanString(nestedBusinessNode.ownerUid) ||
        null;
    const role =
        normalizeRoleId(
            userRecord.activeBusinessRole || userRecord.activeRole || userRecord.role,
        ) || null;
    return {
        isOwner: Boolean(authUid && ownerUid && authUid === ownerUid) || role === 'owner',
        isAdmin: role === 'admin',
        isPlatformDev: hasDeveloperAccess(userRecord),
    };
};

export const readBusinessSubscriptionFallback = (business: unknown) => {
    const root = asRecord(business);
    const businessNode = asRecord(root.business);
    const rootSubscription = asRecord(root.subscription);
    const nestedSubscription = asRecord(businessNode.subscription);
    return Object.keys(rootSubscription).length > 0
        ? rootSubscription
        : nestedSubscription;
};

export const parseJsonObject = (raw: string, fieldName: string): UnknownRecord => {
    const trimmed = raw.trim();
    if (!trimmed) return {};

    let parsedValue: unknown;
    try {
        parsedValue = JSON.parse(trimmed);
    } catch {
        throw new Error(`${fieldName}: JSON inválido`);
    }

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
        throw new Error(`${fieldName}: debe ser un objeto JSON`);
    }
    return parsedValue as UnknownRecord;
};

export const validateNoticeWindow = (value: number) => {
    if (!NOTICE_WINDOW_OPTIONS.includes(value as (typeof NOTICE_WINDOW_OPTIONS)[number])) {
        throw new Error('noticeWindowDays solo permite 0, 7, 15, 30 o 90');
    }
};

export const validateNumberMap = (input: UnknownRecord, fieldName: string) => {
    Object.entries(input).forEach(([key, value]) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
            throw new Error(`${fieldName}.${key} debe ser numérico`);
        }
        if (numeric < 0 && numeric !== -1) {
            throw new Error(`${fieldName}.${key} solo permite -1 o valores >= 0`);
        }
    });
};

export const validateBooleanMap = (input: UnknownRecord, fieldName: string) => {
    Object.entries(input).forEach(([key, value]) => {
        if (typeof value !== 'boolean') {
            throw new Error(`${fieldName}.${key} debe ser booleano`);
        }
    });
};

export const normalizeBillingResult = (
    rawValue: string | null,
): BillingCheckoutResult | null => {
    const value = toCleanString(rawValue)?.toLowerCase() || null;
    if (!value) return null;
    if (value === 'success' || value === 'approved' || value === 'ok') {
        return 'success';
    }
    if (value === 'cancel' || value === 'canceled' || value === 'cancelled') {
        return 'canceled';
    }
    if (value === 'fail' || value === 'failed' || value === 'declined' || value === 'error') {
        return 'failed';
    }
    return null;
};

export const resolveCheckoutResultFromSearchParams = (
    searchParams: URLSearchParams,
): BillingCheckoutResult | null => {
    const fromBillingResult = normalizeBillingResult(searchParams.get('billingResult'));
    if (fromBillingResult) return fromBillingResult;

    const responseCode = toCleanString(searchParams.get('ResponseCode'));
    const isoCode = toCleanString(searchParams.get('ISOCode'));
    if (!responseCode && !isoCode) return null;

    return responseCode === 'ISO8583' && isoCode === '00' ? 'success' : 'failed';
};

export const buildCheckoutResultAlert = (
    result: BillingCheckoutResult | null,
): {
    type: 'success' | 'warning' | 'error';
    message: string;
    description: string;
} | null => {
    if (result === 'success') {
        return {
            type: 'success',
            message: 'Pago confirmado',
            description:
                'Recibimos la confirmación del pago. Actualizamos tu suscripción para reflejar el cambio.',
        };
    }
    if (result === 'canceled') {
        return {
            type: 'warning',
            message: 'Pago cancelado',
            description:
                'No se completó el cobro. Puedes intentar nuevamente desde Checkout cuando estés listo.',
        };
    }
    if (result === 'failed') {
        return {
            type: 'error',
            message: 'Pago no completado',
            description:
                'La pasarela reportó un fallo o rechazo. Revisa los datos de pago o intenta con otro método.',
        };
    }
    return null;
};

export const clearCheckoutResultParams = (
    searchParams: URLSearchParams,
): URLSearchParams => {
    const nextSearchParams = new URLSearchParams(searchParams);
    [
        'billingResult',
        'provider',
        'ResponseCode',
        'ISOCode',
        'ResponseMessage',
        'ErrorDescription',
        'AuthorizationCode',
        'OrderNumber',
        'RRN',
        'AuthHash',
    ].forEach((key) => nextSearchParams.delete(key));
    return nextSearchParams;
};
