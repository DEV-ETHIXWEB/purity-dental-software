import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE on `output: "standalone"`: considered for containerized deploys
  // (a smaller image — minimal `server.js` + only the traced `node_modules`
  // files, instead of a full `npm install`), but rejected here: Next 16
  // hard-errors "next start" does not work with "output: standalone"
  // configuration" — and this project's own `npm run start` (used by both
  // local verification and this repo's Playwright `webServer`) IS `next
  // start`. Switching to standalone would mean either running
  // `node .next/standalone/server.js` everywhere `next start` is used today
  // (a bigger workflow change than this deploy-readiness pass should make
  // unilaterally) or maintaining two different start paths for dev/test vs.
  // production. Left as the default (non-standalone) output; revisit if/when
  // the deploy target is containerized and `next start` is retired in favor
  // of the standalone server script everywhere.

  // Removes the `X-Powered-By: Next.js` response header. Minor
  // information-disclosure hardening (don't advertise the framework/version
  // to every client) consistent with the CSP/security-headers work already
  // done in src/middleware.ts.
  poweredByHeader: false,

  // The dev-only route indicator (a <nextjs-portal> element `next dev`
  // injects at the top of <body>) sits near the sidebar logo and reads as
  // a broken/placeholder image at a glance. It never renders in production
  // (`next build && next start`) — this only affects local dev.
  devIndicators: false,
};

export default nextConfig;
