import { useMediaQuery } from '@/hooks/useMediaQuery';

export const useMobile = () => useMediaQuery('(max-width: 768px)');
