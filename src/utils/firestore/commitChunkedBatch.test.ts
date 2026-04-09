import { beforeEach, describe, expect, it, vi } from 'vitest';

const writeBatchMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  writeBatch: (...args: unknown[]) => writeBatchMock(...args),
}));

import { commitChunked } from './commitChunkedBatch';

describe('commitChunked', () => {
  beforeEach(() => {
    writeBatchMock.mockReset();
  });

  it('skips work when there are no operations to apply', async () => {
    await commitChunked({} as never, []);

    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it('commits operations in chunks', async () => {
    const batches: Array<{ commit: ReturnType<typeof vi.fn> }> = [];
    writeBatchMock.mockImplementation(() => {
      const batch = {
        commit: vi.fn().mockResolvedValue(undefined),
      };
      batches.push(batch);
      return batch;
    });

    const applyFns = Array.from({ length: 5 }, () => vi.fn());

    await commitChunked({} as never, applyFns, 2);

    expect(writeBatchMock).toHaveBeenCalledTimes(3);
    expect(applyFns[0]).toHaveBeenCalledWith(batches[0]);
    expect(applyFns[1]).toHaveBeenCalledWith(batches[0]);
    expect(applyFns[2]).toHaveBeenCalledWith(batches[1]);
    expect(applyFns[3]).toHaveBeenCalledWith(batches[1]);
    expect(applyFns[4]).toHaveBeenCalledWith(batches[2]);
    expect(batches[0]?.commit).toHaveBeenCalledTimes(1);
    expect(batches[1]?.commit).toHaveBeenCalledTimes(1);
    expect(batches[2]?.commit).toHaveBeenCalledTimes(1);
  });
});
