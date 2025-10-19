const normalize = (value) => {
    if (typeof value !== 'string') return '';
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toLowerCase();
};

const ERROR_TOKENS = [
    'cantidad insuficiente para generar ncf',
    'cantidad insuficiente',
    'no se pudo encontrar un ncf no duplicado',
    'no se pudo encontrar un ncf',
    'no quedan comprobantes',
    'sin comprobantes disponibles',
    'recibos fiscales agotados',
];

const collectTextFragments = (value, depth = 0, bucket = new Set()) => {
    if (depth > 3 || value == null) return bucket;

    if (typeof value === 'string') {
        const normalized = normalize(value);
        if (normalized) bucket.add(normalized);
        return bucket;
    }

    if (Array.isArray(value)) {
        value.forEach((item) => collectTextFragments(item, depth + 1, bucket));
        return bucket;
    }

    if (typeof value === 'object') {
        Object.values(value).forEach((child) => collectTextFragments(child, depth + 1, bucket));
    }

    return bucket;
};

export const isTaxReceiptDepletedError = (error) => {
    if (!error) return false;

    const normalizedCode = normalize(error?.code).replace(/^functions\//, '');
    if (normalizedCode && normalizedCode !== 'failed-precondition') {
        return false;
    }

    const fragments = collectTextFragments([
        error?.message,
        error?.details,
        error?.failedTask,
        error?.originalError,
    ]);

    if (!fragments.size) return false;

    return Array.from(fragments).some((text) =>
        ERROR_TOKENS.some((token) => text.includes(token))
    );
};
