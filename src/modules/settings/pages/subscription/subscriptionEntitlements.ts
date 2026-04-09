import type { UnknownRecord } from './subscription.types';
import { asRecord } from './subscription.utils';

type BooleanRecord = Record<string, boolean>;

const MODULE_KEYS = new Set([
    'sales',
    'preorders',
    'inventory',
    'orders',
    'purchases',
    'expenses',
    'cashReconciliation',
    'accountsReceivable',
    'creditNote',
    'utility',
    'authorizations',
    'taxReceipt',
    'insurance',
]);

const LEGACY_FEATURE_TO_MODULE_KEY: Record<string, string> = {
    accountsReceivable: 'accountsReceivable',
    insuranceModule: 'insurance',
    authorizationsPinFlow: 'authorizations',
};

const LEGACY_FEATURE_TO_ADDON_KEY: Record<string, string> = {
    advancedReports: 'advancedReports',
    salesAnalyticsPanel: 'salesAnalyticsPanel',
    apiAccess: 'api',
    aiInsights: 'ai',
};

const LEGACY_CAPABILITY_TO_MODULE_KEY: Record<string, string> = {
    authorizationsPinFlow: 'authorizations',
};

const LEGACY_CAPABILITY_TO_ADDON_KEY: Record<string, string> = {
    advancedReports: 'advancedReports',
    salesAnalyticsPanel: 'salesAnalyticsPanel',
};

const LEGACY_MODULE_ACCESS_TO_ADDON_KEY: Record<string, string> = {
    api: 'api',
    ai: 'ai',
};

export const ENTITLEMENT_LABELS: Record<string, string> = {
    sales: 'Ventas',
    preorders: 'Pre-ordenes',
    inventory: 'Inventario',
    orders: 'Pedidos',
    purchases: 'Compras',
    expenses: 'Gastos',
    cashReconciliation: 'Conciliacion de caja',
    accountsReceivable: 'Cuentas por cobrar',
    creditNote: 'Notas de credito',
    utility: 'Utilidades',
    authorizations: 'Autorizaciones',
    taxReceipt: 'Comprobantes fiscales',
    insurance: 'Seguros',
    advancedReports: 'Reportes avanzados',
    salesAnalyticsPanel: 'Panel de analitica',
    api: 'API',
    ai: 'Inteligencia artificial',
    insuranceModule: 'Seguros',
    apiAccess: 'Acceso API',
    aiInsights: 'Inteligencia artificial',
};

export interface SubscriptionEntitlements {
    modules: BooleanRecord;
    addons: BooleanRecord;
    features: BooleanRecord;
    moduleAccess: BooleanRecord;
}

const normalizeBooleanValue = (value: unknown): boolean | null => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    if (typeof value !== 'string') return null;

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
    return null;
};

const setBooleanIfPresent = (
    target: BooleanRecord,
    key: string,
    value: unknown,
) => {
    const normalized = normalizeBooleanValue(value);
    if (normalized !== null) {
        target[key] = normalized;
    }
};

const applyKeyMap = (
    target: BooleanRecord,
    source: UnknownRecord,
    keyMap: Record<string, string>,
) => {
    Object.entries(keyMap).forEach(([sourceKey, targetKey]) => {
        setBooleanIfPresent(target, targetKey, source[sourceKey]);
    });
};

const applyBooleanRecord = (target: BooleanRecord, source: unknown) => {
    Object.entries(asRecord(source)).forEach(([key, value]) => {
        setBooleanIfPresent(target, key, value);
    });
};

const applyModuleAccessToModules = (
    target: BooleanRecord,
    source: UnknownRecord,
) => {
    Object.keys(source).forEach((key) => {
        if (!MODULE_KEYS.has(key)) return;
        setBooleanIfPresent(target, key, source[key]);
    });
};

const resolveMultiBusinessAccess = (source: unknown): boolean | null => {
    const root = asRecord(source);
    const limits = asRecord(root.limits);
    const maxBusinesses = Number(limits.maxBusinesses);
    if (Number.isFinite(maxBusinesses)) {
        return maxBusinesses < 0 || maxBusinesses > 1;
    }

    const legacyModuleAccess = asRecord(root.moduleAccess);
    if (typeof legacyModuleAccess.multiBusiness === 'boolean') {
        return legacyModuleAccess.multiBusiness;
    }

    const legacyCapabilities = asRecord(root.capabilities);
    if (typeof legacyCapabilities.multiBusiness === 'boolean') {
        return legacyCapabilities.multiBusiness;
    }

    return null;
};

export const normalizeSubscriptionEntitlements = (
    source: unknown,
): SubscriptionEntitlements => {
    const root = asRecord(source);
    const legacyFeatures = asRecord(root.features);
    const legacyModuleAccess = asRecord(root.moduleAccess);
    const legacyCapabilities = asRecord(root.capabilities);

    const modules: BooleanRecord = {};
    const addons: BooleanRecord = {};

    applyBooleanRecord(modules, root.modules);
    applyBooleanRecord(addons, root.addons);

    applyModuleAccessToModules(modules, legacyModuleAccess);
    applyKeyMap(modules, legacyFeatures, LEGACY_FEATURE_TO_MODULE_KEY);
    applyKeyMap(modules, legacyCapabilities, LEGACY_CAPABILITY_TO_MODULE_KEY);
    applyKeyMap(addons, legacyFeatures, LEGACY_FEATURE_TO_ADDON_KEY);
    applyKeyMap(addons, legacyCapabilities, LEGACY_CAPABILITY_TO_ADDON_KEY);
    applyKeyMap(addons, legacyModuleAccess, LEGACY_MODULE_ACCESS_TO_ADDON_KEY);

    const features: BooleanRecord = {};
    applyBooleanRecord(features, legacyFeatures);
    Object.entries(LEGACY_FEATURE_TO_MODULE_KEY).forEach(
        ([legacyKey, canonicalKey]) => {
            setBooleanIfPresent(features, legacyKey, modules[canonicalKey]);
        },
    );
    Object.entries(LEGACY_FEATURE_TO_ADDON_KEY).forEach(
        ([legacyKey, canonicalKey]) => {
            setBooleanIfPresent(features, legacyKey, addons[canonicalKey]);
        },
    );
    setBooleanIfPresent(features, 'authorizationsPinFlow', modules.authorizations);

    const moduleAccess: BooleanRecord = {};
    applyBooleanRecord(moduleAccess, legacyModuleAccess);
    applyBooleanRecord(moduleAccess, modules);
    Object.entries(LEGACY_MODULE_ACCESS_TO_ADDON_KEY).forEach(
        ([legacyKey, canonicalKey]) => {
            setBooleanIfPresent(moduleAccess, legacyKey, addons[canonicalKey]);
        },
    );
    const multiBusiness = resolveMultiBusinessAccess(source);
    if (multiBusiness !== null) {
        moduleAccess.multiBusiness = multiBusiness;
    }

    return {
        modules,
        addons,
        features,
        moduleAccess,
    };
};

export const mergeSubscriptionEntitlements = (
    base: unknown,
    override: unknown,
): SubscriptionEntitlements => {
    const baseEntitlements = normalizeSubscriptionEntitlements(base);
    const overrideEntitlements = normalizeSubscriptionEntitlements(override);

    return normalizeSubscriptionEntitlements({
        modules: {
            ...baseEntitlements.modules,
            ...overrideEntitlements.modules,
        },
        addons: {
            ...baseEntitlements.addons,
            ...overrideEntitlements.addons,
        },
        features: {
            ...baseEntitlements.features,
            ...overrideEntitlements.features,
        },
        moduleAccess: {
            ...baseEntitlements.moduleAccess,
            ...overrideEntitlements.moduleAccess,
        },
    });
};
