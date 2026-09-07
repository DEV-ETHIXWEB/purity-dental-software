import { NextResponse, type NextRequest } from "next/server";

// NOTE (Next 16): the `middleware.ts` file convention is deprecated in favor
// of `proxy.ts` (same behavior, renamed export) — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md.
// It still works identically in 16.3.2 ("all functionality remains the
// same"), and this file is named per the task spec; renaming to `proxy.ts`
// is a trivial follow-up whenever the codebase does its next Next.js
// version bump / codemod pass.

/**
 * Edge/Node middleware: route-group gating by path prefix + baseline
 * security headers (including a nonce-based CSP) on every response.
 *
 * IMPORTANT — this is necessary but NOT sufficient RBAC. It only decides
 * "can this request continue to the page it asked for." It does NOT (and
 * cannot, cheaply, at this layer) re-verify Server Actions invoked directly
 * by a client bundle without a matching page navigation, or verify
 * resource-level ownership (e.g. "does this invoice belong to this user's
 * organization"). Every Server Action / Route Handler that mutates data
 * must independently call `requireSession`/`requireRole` from
 * `src/lib/auth/authorize.ts` — see that file's header comment.
 *
 * Session validation here is done via a lightweight check (cookie
 * presence) rather than a full DB lookup: Next.js middleware runs on the
 * Edge runtime by default, where Prisma's Node-only driver adapter
 * (`@prisma/adapter-pg`) is not available. The authoritative
 * expiry/isActive/role check happens in `getCurrentSession()` inside each
 * page/layout and each Server Action — middleware here only short-circuits
 * the *obviously* unauthenticated case (no cookie at all) and, once a
 * cookie is present, still lets the request through to the actual
 * page/action to do the real check. This keeps middleware fast and
 * Edge-compatible while keeping the DB-backed check as the source of truth.
 */

const SESSION_COOKIE_NAME = "purity_session";

// Path prefixes gated to a single role. The Dentist portal is the one
// root-level portal (no `/dentist` prefix) — its routes are the bare
// `/dashboard`, `/schedule`, `/patients`, `/billing`, `/settings` prefixes.
const DENTIST_PREFIXES = ["/dashboard", "/schedule", "/patients", "/billing", "/settings"];
const HYGIENIST_PREFIX = "/hygienist";
const RECEPTIONIST_PREFIX = "/receptionist";
const PATIENT_PREFIX = "/patient";

const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
]);

type PortalRole = "DENTIST" | "HYGIENIST" | "RECEPTIONIST" | "PATIENT";

function matchPortal(pathname: string): PortalRole | null {
  if (pathname.startsWith(HYGIENIST_PREFIX)) return "HYGIENIST";
  if (pathname.startsWith(RECEPTIONIST_PREFIX)) return "RECEPTIONIST";
  if (pathname.startsWith(PATIENT_PREFIX)) return "PATIENT";
  if (DENTIST_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return "DENTIST";
  return null;
}

/**
 * The session cookie's value is opaque here (middleware can't hit Postgres
 * from the Edge runtime — see header comment): this only checks whether the
 * cookie exists, never what it contains. To keep this genuinely safe rather
 * than "trust a client-editable cookie for authorization," middleware here
 * treats "cookie present" as "maybe authenticated, let it through to the
 * real DB-backed check in the layout/action" and only redirects on "no
 * cookie at all" (definitely unauthenticated) — it never grants access to a
 * specific role based on cookie contents alone.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return !!request.cookies.get(SESSION_COOKIE_NAME)?.value;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a fresh nonce per request. Next.js parses the CSP header off
  // the *request* headers (not just the response) during rendering and
  // auto-applies the nonce to framework/page scripts and Next's own inline
  // styles — see the "Adding a nonce with Proxy" section of
  // node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
  // That means the nonce must be forwarded on `request.headers` via
  // `NextResponse.next({ request: { headers } })`, not just set on the
  // outgoing response.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = routeGuard(request, pathname, requestHeaders);
  applySecurityHeaders(response, csp);
  return response;
}

function routeGuard(
  request: NextRequest,
  pathname: string,
  requestHeaders: Headers,
): NextResponse {
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const portal = matchPortal(pathname);
  if (!portal) {
    // Not a portal-gated path (e.g. `/api/*`, static assets already
    // excluded by the matcher below) — let it through. Individual API
    // routes/Server Actions are responsible for their own auth check.
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!hasSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // A session cookie is present. Middleware cannot cheaply verify its role
  // here (Edge runtime, no DB access — see header comment), so it lets the
  // request through; each portal's layout/page independently resolves the
  // real session server-side via `getCurrentSession()` and must redirect
  // an authenticated-but-wrong-role visitor to their own dashboard. This
  // keeps "wrong role" handling in one authoritative place (the DB-backed
  // session) instead of duplicating role logic into an unverified cookie
  // read at the edge.
  void portal;
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Build a strict, nonce-based CSP. Deliberately does NOT include
 * `unsafe-inline` or `unsafe-eval` in production — Next.js auto-applies the
 * per-request nonce to its own framework/hydration scripts and most inline
 * styles it generates, so a strict policy works without them for
 * application code. `unsafe-eval` is enabled only in development, per
 * Next's own documented guidance (React's dev build uses `eval` for
 * enhanced error stack reconstruction; production React/Next never do).
 *
 * Known residual gap: `next/image` sets a `style="color:transparent"`
 * attribute on its underlying <img> (verified via browser CSP-violation
 * reports; this repo's own components carry no inline `style=` — every
 * data-driven size/gradient uses SVG attributes or a named CSS class, see
 * globals.css). That one style is a fixed, non-user-controlled string with
 * no security relevance (it doesn't execute code or reflect any input) —
 * accepted as a known, low-severity, upstream Next.js/CSP interaction
 * rather than broadening `style-src` to `unsafe-inline`/`unsafe-hashes` for
 * the whole app to silence it. Revisit if a future Next release nonces it.
 *
 * `unsafe-inline` was previously listed here for style-src in development,
 * but per the CSP spec browsers ignore `unsafe-inline` whenever a nonce is
 * also present in the same directive — so it never actually did anything
 * and has been removed rather than left as misleading dead code. Dev-mode
 * Turbopack/React-Refresh inline styles are genuinely blocked by this CSP
 * in `next dev`; this is a dev-only console-noise/HMR-styling limitation
 * that does not reproduce in `next build && next start` (verified).
 */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' blob: data:`,
    // next/font/google self-hosts font files at build time (no runtime
    // request to Google's CDN), so 'self' is sufficient here.
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ];
  // `upgrade-insecure-requests` only makes sense once the app is actually
  // served over HTTPS (production). In dev, `next dev` serves plain
  // http://localhost with no TLS listener at all — Chromium happens to
  // special-case `localhost` as exempt from this directive, but Safari/
  // WebKit does not: it dutifully tries to upgrade every subresource
  // fetch (JS chunks, CSS, fonts) to https://localhost, which fails with
  // a TLS error since nothing is listening there, and the app never
  // hydrates. Confirmed via a WebKit-engine reproduction. Gating this to
  // production only (mirroring the `unsafe-eval` dev/prod split above)
  // fixes Safari in local dev without weakening the real production CSP.
  if (!isDev) {
    directives.push(`upgrade-insecure-requests`);
  }
  return directives.join("; ");
}

function applySecurityHeaders(response: NextResponse, csp: string): void {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), camera=(), microphone=()",
  );
  // Belt-and-suspenders alongside the CSP's frame-ancestors directive —
  // older browsers that don't support CSP frame-ancestors still get
  // clickjacking protection from this header.
  response.headers.set("X-Frame-Options", "DENY");
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and Next internals, so the
     * security headers above land on every real response. The route-guard
     * logic itself still no-ops for non-portal paths (see `routeGuard`).
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
