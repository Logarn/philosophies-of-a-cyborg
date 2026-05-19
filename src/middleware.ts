import { defineMiddleware } from 'astro:middleware';
import { createHash, timingSafeEqual } from 'node:crypto';

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests'
  ].join('; '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'index, follow'
};

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseBasicAuth(header: string | null) {
  if (!header?.startsWith('Basic ')) return null;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator < 0) return null;
  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1)
  };
}

function authRequired(message = 'Admin auth required') {
  return new Response(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Philosophies Of A Cyborg Admin", charset="UTF-8"',
      'Cache-Control': 'no-store'
    }
  });
}

function secureResponse(response: Response, pathname: string) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminPath) {
    const configuredUser = import.meta.env.ADMIN_USERNAME;
    const configuredHash = import.meta.env.ADMIN_PASSWORD_SHA256;

    if (!configuredUser || !configuredHash) {
      return secureResponse(
        new Response('Admin is locked. Set ADMIN_USERNAME and ADMIN_PASSWORD_SHA256 on the server.', {
          status: 503,
          headers: { 'Cache-Control': 'no-store' }
        }),
        pathname
      );
    }

    const credentials = parseBasicAuth(context.request.headers.get('authorization'));
    if (
      !credentials ||
      !safeEqual(credentials.username, configuredUser) ||
      !safeEqual(sha256(credentials.password), configuredHash)
    ) {
      return secureResponse(authRequired(), pathname);
    }
  }

  const response = await next();
  return secureResponse(response, pathname);
});
