import type { ReactNode } from 'react';

import { VmSkeleton } from '@/components/heroui';

interface AccountingWorkspaceShellProps {
  children: ReactNode;
  loading?: boolean;
  navigation?: ReactNode;
  notices?: ReactNode;
}

export const AccountingWorkspaceShell = ({
  children,
  loading = false,
  navigation,
  notices,
}: AccountingWorkspaceShellProps) => (
  <section className="flex w-full flex-col gap-3">
    {notices ? <div className="flex flex-col gap-3">{notices}</div> : null}

    <section className="flex min-w-0 flex-col">
      {navigation ? (
        <div className="border-b border-default">{navigation}</div>
      ) : null}
      <div className="min-w-0">
        {loading ? (
          <div className="flex flex-col gap-4 py-6">
            <p className="m-0 text-sm leading-normal text-secondary">
              Preparando datos del modulo contable…
            </p>
            <div className="flex flex-col gap-2">
              <VmSkeleton className="h-4 w-full rounded-lg" />
              <VmSkeleton className="h-4 w-3/4 rounded-lg" />
              <VmSkeleton className="h-4 w-full rounded-lg" />
              <VmSkeleton className="h-4 w-1/2 rounded-lg" />
              <VmSkeleton className="h-4 w-full rounded-lg" />
              <VmSkeleton className="h-4 w-2/3 rounded-lg" />
              <VmSkeleton className="h-4 w-full rounded-lg" />
              <VmSkeleton className="h-4 w-3/4 rounded-lg" />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  </section>
);

