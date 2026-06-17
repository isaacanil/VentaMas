const ALLOWED_LOGO_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);
const LOGO_FETCH_TIMEOUT_MS = 5000;
const MAX_LOGO_BYTES = 1_000_000;
const SUPPORTED_LOGO_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

export function isAllowedLogoUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl));
    return url.protocol === 'https:' && ALLOWED_LOGO_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export async function fetchLogoDataUri(rawUrl) {
  if (!rawUrl || !isAllowedLogoUrl(rawUrl)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOGO_FETCH_TIMEOUT_MS);

  try {
    const resp = await fetch(rawUrl, { signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`Failed to fetch logo: ${resp.statusText}`);
    }

    const contentType = (resp.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (!SUPPORTED_LOGO_MIME_TYPES.has(contentType)) {
      throw new Error(
        `Unsupported logo content type: ${contentType || 'unknown'}`,
      );
    }

    const contentLength = Number(resp.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_LOGO_BYTES) {
      throw new Error('Logo exceeds maximum allowed size');
    }

    const arrayBuffer = await resp.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_LOGO_BYTES) {
      throw new Error('Logo exceeds maximum allowed size');
    }

    return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
  } finally {
    clearTimeout(timeout);
  }
}
