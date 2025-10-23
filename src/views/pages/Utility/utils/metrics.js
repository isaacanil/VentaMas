import { DateTime } from 'luxon';

import { getTotalPrice, getTax } from '../../../../utils/pricing';

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toNullableNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const pickNumber = (...candidates) => {
    for (const candidate of candidates) {
        if (candidate === undefined || candidate === null) continue;
        if (typeof candidate === 'string' && candidate.trim() === '') continue;
        const numeric = toNullableNumber(candidate);
        if (numeric !== null) {
            return numeric;
        }
    }
    return null;
};

const getDateFromData = (dateLike) => {
    if (!dateLike) return null;
    if (typeof dateLike === 'number') return dateLike;
    if (dateLike instanceof Date) return dateLike.getTime();
    if (dateLike?.seconds) return dateLike.seconds * 1000;
    if (dateLike?._seconds) return dateLike._seconds * 1000;
    return null;
};

const resolveProductName = (product) => {
    const candidates = [
        product?.name,
        product?.productName,
        product?.customName,
        product?.shortName,
        product?.description,
        product?.sku,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string') {
            const trimmed = candidate.trim();
            if (trimmed) return trimmed;
        }
    }

    return null;
};

const resolvePricing = (product) => {
    if (product?.selectedSaleUnit?.pricing) {
        return product.selectedSaleUnit.pricing;
    }

    if (product?.pricing && typeof product.pricing === 'object') {
        return product.pricing;
    }

    return {};
};

const resolveQuantity = (product) => {
    const rawAmount = product?.amountToBuy;
    if (typeof rawAmount === 'number') {
        return rawAmount > 0 ? rawAmount : 0;
    }
    if (typeof rawAmount === 'string') {
        const parsed = Number(rawAmount);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    if (rawAmount && typeof rawAmount === 'object') {
        const total = Number(rawAmount.total);
        if (Number.isFinite(total) && total > 0) return total;
        const unit = Number(rawAmount.unit);
        if (Number.isFinite(unit) && unit > 0) return unit;
    }
    const fallbackCandidates = [
        product?.quantity,
        product?.units,
        product?.amount,
    ];
    const fallback = pickNumber(...fallbackCandidates);
    return fallback !== null && fallback > 0 ? fallback : 1;
};

const resolveSaleTotal = (product, taxEnabled) => {
    const computedTotal = getTotalPrice(product, taxEnabled);
    if (Number.isFinite(computedTotal) && computedTotal > 0) {
        return computedTotal;
    }

    const priceTotal =
        toNullableNumber(product?.price?.total) ??
        toNullableNumber(product?.totalPrice) ??
        null;
    if (priceTotal !== null && Number.isFinite(priceTotal)) {
        return priceTotal;
    }

    const priceUnit =
        toNullableNumber(product?.price?.unit) ??
        toNullableNumber(product?.unitPrice) ??
        null;
    const quantity = resolveQuantity(product);
    if (priceUnit !== null && Number.isFinite(priceUnit) && Number.isFinite(quantity)) {
        return priceUnit * quantity;
    }

    const directPrice = toNullableNumber(product?.price);
    if (directPrice !== null && Number.isFinite(directPrice) && Number.isFinite(quantity)) {
        return directPrice * quantity;
    }

    return 0;
};

const resolveExpenseAmount = (expenseEntry) => {
    const expense = expenseEntry?.expense ?? expenseEntry ?? {};
    const amount = pickNumber(
        expense?.amount,
        expense?.value,
        expense?.total,
        expense?.amount?.value
    );
    return amount ?? 0;
};

const resolveExpenseTimestamp = (expenseEntry) => {
    const expense = expenseEntry?.expense ?? expenseEntry ?? {};
    const dates = expense.dates ?? {};
    const candidates = [
        dates.expenseDate,
        dates.createdAt,
        dates.updatedAt,
        expense.expenseDate,
        expense.createdAt,
        expense.updatedAt,
    ];

    for (const candidate of candidates) {
        const millis = getDateFromData(candidate);
        if (Number.isFinite(millis)) {
            return millis;
        }
    }

    return null;
};

export const buildFinancialMetrics = (invoices, expenses, range) => {
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const safeExpenses = Array.isArray(expenses) ? expenses : [];

    const perProduct = new Map();
    const daily = new Map();
    const hourly = new Map();


    const ensureDailyEntry = (millis) => {
        if (!millis) return null;
        const isoDate = DateTime.fromMillis(millis).startOf('day').toISODate();
        if (!daily.has(isoDate)) {
            daily.set(isoDate, {
                sales: 0,
                cost: 0,
                taxes: 0,
                expenses: 0,
            });
        }
        return daily.get(isoDate);
    };

    const ensureHourlyEntry = (millis) => {
        if (!millis) return null;
        const hourKey = DateTime.fromMillis(millis).startOf('hour').toMillis();
        if (!hourly.has(hourKey)) {
            hourly.set(hourKey, {
                sales: 0,
                cost: 0,
                taxes: 0,
                expenses: 0,
            });
        }
        return hourly.get(hourKey);
    };

    const totalExpenses = safeExpenses.reduce(
        (acc, item) => acc + resolveExpenseAmount(item),
        0
    );

    safeExpenses.forEach((item) => {
        const expenseDate = resolveExpenseTimestamp(item);
        const expenseAmount = resolveExpenseAmount(item);

        const entry = ensureDailyEntry(expenseDate);
        if (entry) {
            entry.expenses += expenseAmount;
        }

        const hourlyEntry = ensureHourlyEntry(expenseDate);
        if (hourlyEntry) {
            hourlyEntry.expenses += expenseAmount;
        }
    });

    const summary = {
        totalSales: 0,
        totalCost: 0,
        totalTaxes: 0,
        totalExpenses,
        profitBeforeExpenses: 0,
        netProfit: 0,
    };

    safeInvoices.forEach((invoice) => {
        const invoiceData = invoice?.data ?? invoice;
        const invoiceProducts = Array.isArray(invoiceData?.products)
            ? invoiceData.products
            : [];
        const taxEnabled =
            invoiceData?.taxReceipt?.enabled ??
            invoiceData?.taxReceiptEnabled ??
            true;

        const invoiceSales =
            toNumber(invoiceData?.totalPurchase?.value) ||
            invoiceProducts.reduce((acc, entry) => {
                const product = entry?.product ?? entry ?? {};
                return acc + resolveSaleTotal(product, taxEnabled);
            }, 0);
        let invoiceCost = 0;
        let aggregatedProductTaxes = 0;

        invoiceProducts.forEach((productEntry) => {
            if (!productEntry || typeof productEntry !== 'object') return;

            const { product: nestedProduct, ...productRest } = productEntry ?? {};
            const hasNestedDetails =
                nestedProduct &&
                typeof nestedProduct === 'object' &&
                Boolean(
                    nestedProduct.pricing ||
                        nestedProduct.selectedSaleUnit ||
                        nestedProduct.amountToBuy ||
                        nestedProduct.cost ||
                        nestedProduct.quantity ||
                        nestedProduct.units
                );
            const product = hasNestedDetails
                ? { ...productRest, ...nestedProduct }
                : productRest;

            const pricing = resolvePricing(product);

            const quantity = resolveQuantity(product);
            const totalSale = resolveSaleTotal(product, taxEnabled);
            const validQuantity = Number.isFinite(quantity) && quantity > 0;

            const pricingCost = pricing?.cost;
            const costDetails =
                pricingCost && typeof pricingCost === 'object'
                    ? pricingCost
                    : null;
            const pricingCostNumber =
                pricingCost && typeof pricingCost === 'number'
                    ? toNullableNumber(pricingCost)
                    : null;

            const unitCost =
                pickNumber(
                    product?.cost?.unit,
                    product?.cost,
                    pricingCostNumber,
                    costDetails?.unit,
                    costDetails?.value,
                    costDetails?.perUnit
                ) ?? 0;

            const explicitTotalCost = pickNumber(
                product?.cost?.total,
                costDetails?.total,
                costDetails?.amountTotal,
                costDetails?.amount,
                costDetails?.totalCost
            );

            const totalCost =
                explicitTotalCost !== null
                    ? explicitTotalCost
                    : (pricingCostNumber !== null
                        ? pricingCostNumber * quantity
                        : unitCost * quantity);

            let totalTaxes = getTax(product, taxEnabled);
            if (!(totalTaxes > 0)) {
                totalTaxes = toNumber(product?.tax?.total);
            }
            if (!(totalTaxes > 0)) {
                const taxRate = toNumber(product?.tax?.value);
                if (taxRate > 0 && totalSale > 0) {
                    const saleWithoutTax = totalSale / (1 + taxRate);
                    totalTaxes = totalSale - saleWithoutTax;
                }
            }
            totalTaxes = toNumber(totalTaxes);

            invoiceCost += totalCost;
            aggregatedProductTaxes += totalTaxes;

            const productName =
                resolveProductName(product) || 'Producto sin nombre';

            const productKey =
                [
                    product?.id,
                    product?.cid,
                    product?.sku,
                    productName.toLowerCase(),
                ]
                    .filter(Boolean)
                    .join('-') ||
                product?.id ||
                productName ||
                `producto-${perProduct.size + 1}`;

            const stored = perProduct.get(productKey) || {
                name: productName,
                quantity: 0,
                sales: 0,
                cost: 0,
                taxes: 0,
                profit: 0,
                instances: 0,
            };

            if (validQuantity) {
                stored.quantity += quantity;
            }
            stored.sales += totalSale;
            stored.cost += totalCost;
            stored.taxes += totalTaxes;
            stored.profit += totalSale - totalCost - totalTaxes;
            stored.instances += 1;

            perProduct.set(productKey, stored);
        });

        const invoiceTaxes = toNumber(invoiceData?.totalTaxes?.value);
        const taxesForInvoice = invoiceTaxes || aggregatedProductTaxes;

        summary.totalSales += invoiceSales;
        summary.totalCost += invoiceCost;
        summary.totalTaxes += taxesForInvoice;

        const dateMillis = getDateFromData(invoiceData?.date);
        const dailyEntry = ensureDailyEntry(dateMillis);
        if (dailyEntry) {
            dailyEntry.sales += invoiceSales;
            dailyEntry.cost += invoiceCost;
            dailyEntry.taxes += taxesForInvoice;
        }

        const hourlyEntry = ensureHourlyEntry(dateMillis);
        if (hourlyEntry) {
            hourlyEntry.sales += invoiceSales;
            hourlyEntry.cost += invoiceCost;
            hourlyEntry.taxes += taxesForInvoice;
        }
    });

    summary.profitBeforeExpenses = summary.totalSales - summary.totalCost - summary.totalTaxes;
    summary.netProfit = summary.profitBeforeExpenses - summary.totalExpenses;

    let startDay = range?.startDate
        ? DateTime.fromMillis(range.startDate).startOf('day')
        : null;
    let endDay = range?.endDate
        ? DateTime.fromMillis(range.endDate).startOf('day')
        : null;

    if (startDay && endDay) {
        let cursor = startDay;
        while (cursor.toMillis() <= endDay.toMillis()) {
            const key = cursor.toISODate();
            if (!daily.has(key)) {
                daily.set(key, {
                    sales: 0,
                    cost: 0,
                    taxes: 0,
                    expenses: 0,
                });
            }
            cursor = cursor.plus({ days: 1 });
        }
    }

    if (range?.startDate && range?.endDate) {
        const startHour = DateTime.fromMillis(range.startDate).startOf('hour');
        const endHour = DateTime.fromMillis(range.endDate).endOf('hour');
        const totalHours = Math.max(0, Math.floor(endHour.diff(startHour, 'hours').hours));
        if (totalHours <= 24 * 7) {
            let cursor = startHour;
            while (cursor.toMillis() <= endHour.toMillis()) {
                const key = cursor.toMillis();
                if (!hourly.has(key)) {
                    hourly.set(key, {
                        sales: 0,
                        cost: 0,
                        taxes: 0,
                        expenses: 0,
                    });
                }
                cursor = cursor.plus({ hours: 1 });
            }
        }
    }

    const dailyMetrics = Array.from(daily.entries()).map(([key, value]) => {
        const date = DateTime.fromISO(key);
        const profitBeforeExpenses = value.sales - value.cost - value.taxes;
        const netProfit = profitBeforeExpenses - value.expenses;

        return {
            isoDate: key,
            timestamp: date.toMillis(),
            dateLabel: date.setLocale('es').toFormat('cccc dd/LL/yyyy'),
            sales: value.sales,
            cost: value.cost,
            taxes: value.taxes,
            expenses: value.expenses,
            profitBeforeExpenses,
            netProfit,
        };
    });

    dailyMetrics.sort((a, b) => a.timestamp - b.timestamp);

    const hourlyMetrics = Array.from(hourly.entries()).map(([key, value]) => {
        const date = DateTime.fromMillis(key);
        const profitBeforeExpenses = value.sales - value.cost - value.taxes;
        const netProfit = profitBeforeExpenses - value.expenses;

        return {
            isoDate: date.toISO(),
            timestamp: date.toMillis(),
            dateLabel: date.setLocale('es').toFormat('HH:mm'),
            sales: value.sales,
            cost: value.cost,
            taxes: value.taxes,
            expenses: value.expenses,
            profitBeforeExpenses,
            netProfit,
        };
    });

    hourlyMetrics.sort((a, b) => a.timestamp - b.timestamp);

    const productsBreakdown = Array.from(perProduct.values())
        .map((item) => ({
            ...item,
            averageUnitPrice:
                item.quantity > 0 && item.sales > 0 ? item.sales / item.quantity : 0,
        }))
        .filter((item) => item.sales > 0)
        .sort((a, b) => b.sales - a.sales);

    return { summary, productsBreakdown, dailyMetrics, hourlyMetrics };
};

export const getDistributionDetails = (summary, colors) => {
    if (!summary) return [];

    const totalCost = toNumber(summary.totalCost);
    const totalExpenses = toNumber(summary.totalExpenses);
    const totalTaxes = toNumber(summary.totalTaxes);
    const netProfitValue = toNumber(summary.netProfit);

    const segments = [
        { key: 'cost', label: 'Costos', value: totalCost, color: colors.cost },
        {
            key: 'expenses',
            label: 'Gastos operativos',
            value: totalExpenses,
            color: colors.expenses,
        },
        netProfitValue >= 0
            ? {
                key: 'netProfit',
                label: 'Ganancia neta',
                value: netProfitValue,
                color: colors.netProfit,
            }
            : {
                key: 'netLoss',
                label: 'Pérdida neta',
                value: netProfitValue,
                color: colors.netLoss,
            },
        { key: 'taxes', label: 'ITBIS', value: totalTaxes, color: colors.taxes },
    ];

    const totalForChart = segments.reduce(
        (acc, segment) => acc + Math.max(segment.value, 0),
        0
    );

    const segmentsWithPercentages = segments.map((segment) => {
        const chartValue = Math.max(segment.value, 0);
        const rawPercentage = totalForChart > 0 ? (chartValue / totalForChart) * 100 : 0;

        return {
            ...segment,
            chartValue,
            rawPercentage,
        };
    });

    const lastPositiveIndex = segmentsWithPercentages.reduce(
        (lastIndex, segment, index) => (segment.chartValue > 0 ? index : lastIndex),
        -1
    );

    let accumulatedRounded = 0;

    return segmentsWithPercentages.map((segment, index) => {
        if (segment.chartValue <= 0 || lastPositiveIndex === -1) {
            return {
                ...segment,
                percentage: 0,
                rawPercentage: segment.rawPercentage,
            };
        }

        if (index === lastPositiveIndex) {
            const adjusted = Math.max(0, Number((100 - accumulatedRounded).toFixed(1)));
            return {
                ...segment,
                percentage: adjusted,
                rawPercentage: segment.rawPercentage,
            };
        }

        const rounded = Math.round(segment.rawPercentage * 10) / 10;
        accumulatedRounded += rounded;

        return {
            ...segment,
            percentage: rounded,
            rawPercentage: segment.rawPercentage,
        };
    });
};

export const formatPercentage = (value) => {
    if (!Number.isFinite(value)) return '0%';
    const formatted = value.toFixed(1);
    return `${value >= 0 ? '+' : ''}${formatted}%`;
};

export { toNumber, getDateFromData };
