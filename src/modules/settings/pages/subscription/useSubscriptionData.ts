import { useCallback, useEffect, useMemo, useState } from 'react';
import { notification } from 'antd';
import {
    requestBillingOverview,
    type BillingOverviewResponse,
} from '@/firebase/billing/billingManagement';
import { mergeSubscriptionEntitlements } from './subscriptionEntitlements';
import {
    asRecord,
    normalizeNoticeWindowDays,
    resolveSubscriptionProviderId,
    toCleanString,
    toFiniteNumber,
    toMillis,
    readBusinessSubscriptionFallback,
} from './subscription.utils';
import { LIMIT_LABELS, LIMIT_USAGE_KEY_MAP } from './subscription.constants';
import type {
    LimitRow,
    PaymentRow,
    ActionKey,
    SubscriptionPlanOption,
} from './subscription.types';

export const useSubscriptionData = (activeBusinessId: string | null, business: unknown) => {
    const [overview, setOverview] = useState<BillingOverviewResponse | null>(null);
    const [loading, setLoading] = useState<ActionKey>(null);

    const handleLoadOverview = useCallback(async () => {
        if (!activeBusinessId) {
            setLoading(null);
            return;
        }
        setLoading('reload');
        try {
            const data = await requestBillingOverview(activeBusinessId);
            setOverview(data);
        } catch (error: unknown) {
            notification.error({
                message: 'No se pudo cargar billing',
                description: error instanceof Error ? error.message : 'Error inesperado.',
            });
        }
        setLoading(null);
    }, [activeBusinessId]);

    useEffect(() => {
        if (!activeBusinessId) return;

        let active = true;
        requestBillingOverview(activeBusinessId)
            .then((data) => {
                if (!active) return;
                setOverview(data);
            })
            .catch((error: unknown) => {
                if (!active) return;
                notification.error({
                    message: 'No se pudo cargar billing',
                    description: error instanceof Error ? error.message : 'Error inesperado.',
                });
            });

        return () => {
            active = false;
        };
    }, [activeBusinessId]);

    const subscription = useMemo(() => {
        const fromOverview = asRecord(overview?.activeSubscription);
        const fromBusiness = readBusinessSubscriptionFallback(business);
        const source = Object.keys(fromOverview).length > 0 ? fromOverview : asRecord(fromBusiness);
        const planId =
            toCleanString(source.planId) ||
            toCleanString(source.planCode);
        const entitlements = mergeSubscriptionEntitlements(null, source);
        const status = toCleanString(source.status)?.toLowerCase() || null;
        const sourceLimits = asRecord(source.limits);
        return {
            status,
            planId,
            displayName:
                toCleanString(source.displayName) ||
                planId,
            provider: resolveSubscriptionProviderId(toCleanString(source.provider)),
            billingCycle:
                toCleanString(source.billingCycle) ||
                'monthly',
            currency:
                toCleanString(source.currency) ||
                'DOP',
            priceMonthly:
                toFiniteNumber(source.priceMonthly) ?? null,
            periodStart: toMillis(source.periodStart),
            periodEnd: toMillis(source.periodEnd),
            trialEndsAt: toMillis(source.trialEndsAt),
            noticeWindowDays:
                source.noticeWindowDays == null
                    ? null
                    : normalizeNoticeWindowDays(source.noticeWindowDays),
            limits: sourceLimits,
            ...entitlements,
        };
    }, [business, overview]);

    const usageCurrent = useMemo(() => asRecord(asRecord(overview?.usage).current), [overview]);

    const limitRows = useMemo<LimitRow[]>(() => {
        const rows: LimitRow[] = [];
        Object.entries(subscription.limits).forEach(([key, value]) => {
            const numericLimit = toFiniteNumber(value);
            if (numericLimit == null) return;
            const usageKey = LIMIT_USAGE_KEY_MAP[key];
            const usageValue = toFiniteNumber(usageCurrent[usageKey]);
            rows.push({
                key,
                label: LIMIT_LABELS[key] || key,
                limit: numericLimit,
                usage: usageValue,
            });
        });
        return rows;
    }, [subscription.limits, usageCurrent]);

    const paymentRows = useMemo<PaymentRow[]>(() => {
        const source = Array.isArray(overview?.paymentHistory) ? overview.paymentHistory : [];
        return source.map((item, index) => {
            const row = asRecord(item);
            return {
                key: toCleanString(row.id) || `payment-${index}`,
                amount: toFiniteNumber(row.amount) || 0,
                currency: toCleanString(row.currency) || 'DOP',
                provider: toCleanString(row.provider) || resolveSubscriptionProviderId(null),
                status: toCleanString(row.status) || 'unknown',
                description: toCleanString(row.description) || '-',
                reference: toCleanString(row.reference),
                createdAt: toMillis(row.createdAt),
            };
        });
    }, [overview]);

    const availablePlans = useMemo<SubscriptionPlanOption[]>(() => {
        const source = Array.isArray(overview?.availablePlans) ? overview.availablePlans : [];
        return source
            .map((item) => {
                const row = asRecord(item);
                const planCode = toCleanString(row.planCode);
                if (!planCode) return null;
                return {
                    planCode,
                    displayName:
                        toCleanString(row.displayName) ||
                        planCode.toUpperCase(),
                    priceMonthly: toFiniteNumber(row.priceMonthly),
                    currency: toCleanString(row.currency) || 'DOP',
                    billingCycle: toCleanString(row.billingCycle) || 'monthly',
                    limits: asRecord(row.limits),
                    modules: asRecord(row.modules),
                    addons: asRecord(row.addons),
                    isCurrent: row.isCurrent === true,
                    isSelectable: row.isSelectable === true,
                };
            })
            .filter((item): item is SubscriptionPlanOption => item !== null);
    }, [overview]);

    const providersImplemented = useMemo<string[]>(() => {
        const source = Array.isArray(overview?.providersImplemented)
            ? overview.providersImplemented
            : [];
        return source
            .map((providerId) => toCleanString(providerId)?.toLowerCase() || null)
            .filter((providerId): providerId is string => providerId !== null);
    }, [overview]);

    return {
        overview,
        loading,
        subscription,
        availablePlans,
        providersImplemented,
        limitRows,
        paymentRows,
        handleLoadOverview,
    };
};
