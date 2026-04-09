import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { fbGetBusinessesList } from '@/firebase/dev/businesses/fbGetBusinessesList';
import { db } from '@/firebase/firebaseconfig';

import { analyzeInvoices } from './invoiceAnalysis';
import { toFriendlyFirestoreError } from './errors';

import type {
  AuditIssue,
  BusinessAuditResult,
  BusinessRecord,
  InvoiceAnalysisResult,
} from '../types';

type AuditProgressUpdate = {
  currentBusiness?: string | null;
  progressDone?: number;
  progressTotal?: number;
};

type RunFiscalReceiptsAuditResult =
  | {
      issues: AuditIssue[];
      results: BusinessAuditResult[];
      status: 'success';
    }
  | {
      error: AuditIssue;
      status: 'error';
    };

const EMPTY_AUDIT_RESULT: Omit<
  BusinessAuditResult,
  'businessId' | 'businessName'
> = {
  totalInvoices: 0,
  invoicesWithNcf: 0,
  missingNcf: 0,
  skippedWithoutDate: 0,
  ncfLengthStats: [],
  lengthChangeEvents: [],
  duplicates: [],
  duplicatesNormalized: [],
  zeroCollapsedDuplicates: [],
  uniqueNcfCount: 0,
  observedLengths: [],
  currentLength: null,
};

const resolveBusinessName = (business: BusinessRecord) =>
  business?.business?.name ||
  business?.business?.fantasyName ||
  business?.name ||
  business?.id;

const buildEmptyBusinessResult = (
  businessId: string,
  businessName: string,
): BusinessAuditResult => ({
  businessId,
  businessName,
  ...EMPTY_AUDIT_RESULT,
});

export const runFiscalReceiptsAudit = async ({
  endDate,
  onProgress,
  startDate,
}: {
  endDate: Date | null;
  onProgress?: (update: AuditProgressUpdate) => void;
  startDate: Date | null;
}): Promise<RunFiscalReceiptsAuditResult> => {
  try {
    const businesses = (await fbGetBusinessesList()) as BusinessRecord[];

    onProgress?.({
      progressTotal: businesses.length,
      progressDone: 0,
      currentBusiness: null,
    });

    if (!businesses.length) {
      return {
        status: 'success',
        results: [],
        issues: [],
      };
    }

    const aggregated: BusinessAuditResult[] = [];
    const issues: AuditIssue[] = [];

    for (let index = 0; index < businesses.length; index += 1) {
      const business = businesses[index];
      const businessName = resolveBusinessName(business);

      onProgress?.({
        currentBusiness: businessName,
      });

      try {
        const taxSettingsRef = doc(
          db,
          'businesses',
          business.id,
          'settings',
          'taxReceipt',
        );
        const taxSettingsSnap = await getDoc(taxSettingsRef);
        const taxEnabled =
          taxSettingsSnap.exists() &&
          Boolean(taxSettingsSnap.data()?.taxReceiptEnabled);

        if (!taxEnabled) {
          aggregated.push(buildEmptyBusinessResult(business.id, businessName));
          continue;
        }

        const invoicesRef = collection(db, 'businesses', business.id, 'invoices');
        const invoicesQuery =
          startDate && endDate
            ? query(
                invoicesRef,
                where('data.date', '>=', startDate),
                where('data.date', '<=', endDate),
                orderBy('data.date', 'asc'),
              )
            : query(invoicesRef, orderBy('data.date', 'asc'));

        const invoicesSnapshot = await getDocs(invoicesQuery);

        if (invoicesSnapshot.empty) {
          aggregated.push(buildEmptyBusinessResult(business.id, businessName));
          continue;
        }

        const invoices = invoicesSnapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .filter(
            (invoice) =>
              (invoice as { data?: { status?: string } })?.data?.status !==
              'cancelled',
          );

        const analysis = analyzeInvoices(
          invoices as Array<Record<string, unknown>>,
        ) as InvoiceAnalysisResult;

        aggregated.push({
          businessId: business.id,
          businessName,
          ...analysis,
        });
      } catch (businessError: unknown) {
        console.error(`Error analizando negocio ${business?.id}`, businessError);
        issues.push({
          businessId: business.id,
          businessName,
          message: toFriendlyFirestoreError(businessError),
        });
      } finally {
        onProgress?.({
          progressDone: index + 1,
        });
      }
    }

    aggregated.sort((a, b) => {
      if (b.duplicates.length !== a.duplicates.length) {
        return b.duplicates.length - a.duplicates.length;
      }
      if (b.invoicesWithNcf !== a.invoicesWithNcf) {
        return b.invoicesWithNcf - a.invoicesWithNcf;
      }
      return (a.businessName || '').localeCompare(b.businessName || '');
    });

    return {
      status: 'success',
      results: aggregated,
      issues,
    };
  } catch (error: unknown) {
    console.error('Error general al analizar comprobantes', error);
    return {
      status: 'error',
      error: {
        businessId: 'general',
        businessName: 'General',
        message: toFriendlyFirestoreError(error),
      },
    };
  } finally {
    onProgress?.({
      currentBusiness: null,
    });
  }
};
