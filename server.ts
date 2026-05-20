const distRoot = new URL('./dist/', import.meta.url);
const assetBrowserCache = 'public, max-age=31536000, immutable';
const assetCdnCache = 'public, s-maxage=31536000, immutable';
const htmlBrowserCache = 'public, max-age=0, must-revalidate';
const htmlCdnCache = 'public, s-maxage=60, must-revalidate';

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.bin': 'application/octet-stream',
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
};

function resolveDistUrl(pathname: string): URL | null {
  let decodedPathname: string;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (decodedPathname.includes('\0')) {
    return null;
  }

  const segments = decodedPathname.split('/').filter(Boolean);

  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }

  const relativePath = segments.map((segment) => encodeURIComponent(segment)).join('/');
  const fileUrl = new URL(relativePath, distRoot);

  return fileUrl.href.startsWith(distRoot.href) ? fileUrl : null;
}

function getExtension(pathname: string): string {
  const lastSegment = pathname.split('/').pop() ?? '';
  const extensionStart = lastSegment.lastIndexOf('.');

  return extensionStart === -1 ? '' : lastSegment.slice(extensionStart).toLowerCase();
}

function getHeaders(pathname: string, browserCacheControl: string, cdnCacheControl: string): Headers {
  const headers = new Headers({
    'Cache-Control': browserCacheControl,
    'CDN-Cache-Control': cdnCacheControl,
    'Deno-CDN-Cache-Control': cdnCacheControl,
  });
  const contentType = contentTypes[getExtension(pathname)] ?? 'application/octet-stream';

  headers.set('Content-Type', contentType);

  return headers;
}

async function serveFile(
  pathname: string,
  method: string,
  browserCacheControl: string,
  cdnCacheControl: string,
): Promise<Response | null> {
  const fileUrl = resolveDistUrl(pathname);

  if (!fileUrl) {
    return null;
  }

  try {
    const body = await Deno.readFile(fileUrl);
    const headers = getHeaders(pathname, browserCacheControl, cdnCacheControl);
    headers.set('Content-Length', String(body.byteLength));

    return new Response(method === 'HEAD' ? null : body, { headers });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound || error instanceof Deno.errors.IsADirectory) {
      return null;
    }

    throw error;
  }
}

function emptyResponse(status: number, method: string, headers?: HeadersInit): Response {
  return new Response(method === 'HEAD' ? null : undefined, { status, headers });
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return emptyResponse(405, request.method, { Allow: 'GET, HEAD' });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  const assetRequest = pathname.startsWith('/assets/') || pathname === '/favicon.ico';
  const requestedPathname = pathname === '/' ? '/index.html' : pathname;
  const browserCacheControl = assetRequest ? assetBrowserCache : htmlBrowserCache;
  const cdnCacheControl = assetRequest ? assetCdnCache : htmlCdnCache;
  const staticResponse = await serveFile(requestedPathname, request.method, browserCacheControl, cdnCacheControl);

  if (staticResponse) {
    return staticResponse;
  }

  if (assetRequest) {
    return emptyResponse(404, request.method);
  }

  const fallbackResponse = await serveFile('/index.html', request.method, htmlBrowserCache, htmlCdnCache);

  return fallbackResponse ?? emptyResponse(404, request.method);
}

Deno.serve(handleRequest);
