// Stub for the `server-only` package inside Vitest.
//
// `server-only`'s real implementation unconditionally throws — it relies on
// Next's webpack/Turbopack bundler to alias it to a no-op when the importing
// module is actually bundled for a server context, and to make the *real*
// (throwing) version show up only in a client bundle as a build-time guard.
// Vitest runs modules directly under Node with no such bundler-level
// aliasing, so without this stub, every module that imports "server-only"
// (a correct and desirable marker in the real app) would fail to import in
// tests even though it's genuinely server-only code being tested in a
// server-like (Node) test environment. Aliased in `vitest.config.ts`.
export {};
