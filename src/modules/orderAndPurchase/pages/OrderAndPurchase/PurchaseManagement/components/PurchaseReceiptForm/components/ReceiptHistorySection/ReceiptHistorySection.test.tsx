import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ReceiptHistorySection from './ReceiptHistorySection';

describe('ReceiptHistorySection', () => {
  it('does not forward styled-only props to DOM nodes', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const { container } = render(
      <ReceiptHistorySection
        receiptHistory={[
          {
            id: 'evt-1',
            receivedAt: Date.UTC(2026, 2, 20),
            receivedBy: { name: 'Usuario Demo' },
            warehouseName: 'Principal',
            workflowStatusAfter: 'pending_receipt',
            summary: {
              receivedQuantity: 3,
              remainingPurchasePendingQuantity: 2,
              lineCount: 1,
            },
            items: [
              {
                id: 'line-1',
                name: 'Producto A',
                receivedQuantity: 3,
                pendingQuantity: 2,
              },
            ],
          } as any,
        ]}
      />,
    );

    const toggleButton = container.querySelector(
      'button[aria-expanded="false"]',
    ) as HTMLButtonElement | null;

    expect(toggleButton).not.toBeNull();
    fireEvent.click(toggleButton!);

    const loggedMessages = [
      ...consoleErrorSpy.mock.calls,
      ...consoleWarnSpy.mock.calls,
    ]
      .map((args) => args.join(' '))
      .join('\n');

    expect(loggedMessages).not.toContain(
      'does not recognize the `isFirst` prop',
    );
    expect(loggedMessages).not.toContain(
      'styled-components: it looks like an unknown prop "isFirst"',
    );
    expect(loggedMessages).not.toContain(
      'styled-components: it looks like an unknown prop "pending"',
    );
    expect(loggedMessages).not.toContain(
      'Received `false` for a non-boolean attribute `pending`',
    );
    expect(loggedMessages).not.toContain(
      'styled-components: it looks like an unknown prop "received"',
    );

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
});
