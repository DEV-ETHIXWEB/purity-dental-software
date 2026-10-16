import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, it, expect } from "vitest";
import { PERMISSION_KEYS } from "@/lib/auth/permissions";

/**
 * Invariants about how the route tree gates itself.
 *
 * These read the source rather than the running app because what they guard
 * is a property of the whole tree, not of any one module: a single page
 * reaching for the wrong gate is the kind of thing that only shows up when
 * someone's permission is actually revoked, which no other test exercises.
 */

const APP_DIR = join(process.cwd(), "src", "app");
const SRC_DIR = join(process.cwd(), "src");

function routeFiles(): { path: string; source: string }[] {
  const out: { path: string; source: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/^(page|layout|route)\.tsx?$/.test(entry.name)) {
        out.push({
          path: full.slice(APP_DIR.length + 1).split(sep).join("/"),
          source: readFileSync(full, "utf8"),
        });
      }
    }
  };
  walk(APP_DIR);
  return out;
}

const FILES = routeFiles();

describe("page permission gates", () => {
  it("found the route tree", () => {
    expect(FILES.length).toBeGreaterThan(30);
  });

  it("every gated permission is a real permission key", () => {
    const used = new Set<string>();
    for (const { source } of FILES) {
      for (const m of source.matchAll(/requirePagePermission\(\s*"([^"]+)"/g)) {
        used.add(m[1]);
      }
    }

    expect(used.size).toBeGreaterThan(0);
    for (const key of used) {
      expect(PERMISSION_KEYS).toContain(key);
    }
  });

  it("no dashboard gates itself on a permission", () => {
    /*
     * `requirePagePermission` redirects a failing viewer to
     * `dashboardPathForRole(role)` — their own dashboard. Gating a dashboard
     * with it therefore redirects that viewer to the page that just
     * redirected them, which is an infinite loop rather than a denial.
     * Dashboards stay on `requirePageRole`.
     */
    const dashboards = FILES.filter(({ path }) => path.includes("dashboard/page."));

    expect(dashboards.length).toBe(5);
    for (const { path, source } of dashboards) {
      expect(source, `${path} must not use requirePagePermission`).not.toContain(
        "requirePagePermission",
      );
    }
  });

  it("no staff route still gates a permissioned action on a bare role list", () => {
    // `requireRole` throws instead of redirecting and knows nothing about
    // overrides. Route Handlers that serve permissioned data should use
    // `requirePermission`; this pins the one that used to.
    const pdf = FILES.find(({ path }) => path.endsWith("pdf/route.ts"));

    expect(pdf).toBeDefined();
    expect(pdf!.source).toContain('requirePermission("billing.view")');
    expect(pdf!.source).not.toContain("requireRole(");
    // A refusal is a 403, not an uncaught throw (a 500), and the old
    // Dentist/Admin-only rule still applies on top of the permission.
    expect(pdf!.source).toContain("AuthorizationError");
    expect(pdf!.source).toContain('"DENTIST"');
  });
});

describe("the UI reflects every gated action", () => {
  /*
   * A Server Action gated on a permission whose key appears nowhere in the
   * UI means a control that is still rendered for everyone and refuses on
   * click — the exact defect this pass set out to remove. This does not
   * prove the right control is hidden, only that nothing was gated on the
   * server and then forgotten on the way out.
   */
  function sourcesUnder(dir: string, match: RegExp): string[] {
    const out: string[] = [];
    const walk = (d: string) => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (match.test(entry.name)) out.push(readFileSync(full, "utf8"));
      }
    };
    walk(dir);
    return out;
  }

  it("has a UI check for each permission an action requires", () => {
    const actionSources = sourcesUnder(join(SRC_DIR, "lib", "actions"), /\.ts$/);
    const required = new Set<string>();
    for (const source of actionSources) {
      for (const m of source.matchAll(/requirePermission\(\s*"([^"]+)"/g)) {
        required.add(m[1]);
      }
    }

    const uiSources = [
      ...sourcesUnder(join(SRC_DIR, "app"), /\.tsx?$/),
      ...sourcesUnder(join(SRC_DIR, "components"), /\.tsx?$/),
    ].join("\n");

    expect(required.size).toBeGreaterThan(5);
    for (const key of required) {
      const reflected =
        uiSources.includes(`can("${key}")`) ||
        uiSources.includes(`requirePagePermission("${key}"`) ||
        uiSources.includes(`hasPermission(session.user, "${key}")`);
      expect(reflected, `nothing in the UI checks "${key}"`).toBe(true);
    }
  });
});
