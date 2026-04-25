import {
  getDemoHref,
  getMenuBackFallbackHref,
  getPlayableRouteRedirect,
  type DemoRouteSnapshot,
} from "../demo-routes";

const hydratedIntro: DemoRouteSnapshot = {
  isHydrated: true,
  phase: "intro",
  activeView: "home",
  introSeen: false,
  playerId: null,
};

describe("demo route recovery", () => {
  it("maps persisted phases to their entry routes", () => {
    expect(getDemoHref("intro", "home", false)).toBe("/video-intro");
    expect(getDemoHref("intro", "home", true)).toBe("/login");
    expect(getDemoHref("login", "home")).toBe("/login");
    expect(getDemoHref("handle", "home")).toBe("/login");
    expect(getDemoHref("boot", "home")).toBe("/boot");
    expect(getDemoHref("home", "home")).toBe("/home");
    expect(getDemoHref("terminal", "market")).toBe("/terminal");
  });

  it("waits for hydration before redirecting protected routes", () => {
    expect(getPlayableRouteRedirect({ ...hydratedIntro, isHydrated: false })).toBeNull();
  });

  it("recovers protected deep links before a local player exists", () => {
    expect(getPlayableRouteRedirect(hydratedIntro)).toBe("/video-intro");
    expect(getPlayableRouteRedirect({ ...hydratedIntro, introSeen: true })).toBe("/login");
    expect(getPlayableRouteRedirect({ ...hydratedIntro, phase: "boot" })).toBe("/boot");
    expect(getPlayableRouteRedirect({ ...hydratedIntro, phase: "home" })).toBe("/login");
    expect(getPlayableRouteRedirect({ ...hydratedIntro, phase: "terminal", activeView: "market" })).toBe("/login");
  });

  it("allows playable routes once the local profile exists", () => {
    expect(getPlayableRouteRedirect({ ...hydratedIntro, phase: "home", playerId: "local_1" })).toBeNull();
    expect(getPlayableRouteRedirect({ ...hydratedIntro, phase: "terminal", activeView: "market", playerId: "local_1" })).toBeNull();
  });

  it("gives menu screens a non-empty back target when opened directly", () => {
    expect(getMenuBackFallbackHref({ phase: "terminal", playerId: "local_1" })).toBe("/home");
    expect(getMenuBackFallbackHref({ phase: "boot", playerId: null })).toBe("/boot");
    expect(getMenuBackFallbackHref({ phase: "intro", playerId: null })).toBe("/login");
  });
});
