import {
  ProgressFill,
  ProgressHeader,
  ProgressTrack,
} from '../BusinessMissingCreatedAt.styles';
import type { ScanProgress } from '../types';

export function ProgressBar({ progress }: { progress: ScanProgress }) {
  const pct = progress.total
    ? Math.min(100, Math.floor((progress.scanned / progress.total) * 100))
    : 0;

  return (
    <div>
      <ProgressHeader>
        <span>Escaneando negocios...</span>
        <span>{pct}%</span>
      </ProgressHeader>
      <ProgressTrack>
        <ProgressFill $pct={pct} />
      </ProgressTrack>
    </div>
  );
}
