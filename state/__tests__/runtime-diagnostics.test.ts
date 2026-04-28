import {
  clearRuntimeDiagnostics,
  formatRuntimeDiagnosticsForQa,
  getRuntimeDiagnosticsSnapshot,
  installRuntimeDiagnostics,
  recordRuntimeDiagnostic,
  redactSensitiveText,
} from "@/state/runtime-diagnostics";

describe("runtime diagnostics", () => {
  afterEach(() => {
    clearRuntimeDiagnostics();
  });

  it("redacts credential-shaped values before storing diagnostic entries", () => {
    const entry = recordRuntimeDiagnostic(
      "exception",
      new Error(
        "fetch failed api_key=demo-key access_token=demo-token authorization: bearer demoCredential12345",
      ),
    );

    expect(entry.message).toContain("api_key=[REDACTED]");
    expect(entry.message).toContain("access_token=[REDACTED]");
    expect(entry.message).toContain("authorization=[REDACTED]");
    expect(entry.message).not.toContain("demo-key");
    expect(entry.message).not.toContain("demo-token");
    expect(entry.message).not.toContain("demoCredential12345");
  });

  it("includes QA session context without storing handle or player identifiers", () => {
    recordRuntimeDiagnostic("manual", "qa marker", {
      context: {
        route: "/terminal?api_key=route-key",
        platform: "ios",
        phase: "terminal",
        activeView: "market",
        tick: 12,
        heat: 44,
        balanceBand: "100k-999k",
        selectedTicker: "VBLM",
        handlePresent: true,
        playerIdPresent: true,
        hydrated: true,
      },
    });

    const report = formatRuntimeDiagnosticsForQa();

    expect(report).toContain('"route": "/terminal?api_key=[REDACTED]"');
    expect(report).toContain('"phase": "terminal"');
    expect(report).toContain('"tick": 12');
    expect(report).toContain('"handlePresent": true');
    expect(report).toContain('"playerIdPresent": true');
    expect(report).not.toContain("route-key");
  });

  it("keeps diagnostics bounded to the most recent entries", () => {
    for (let index = 0; index < 25; index += 1) {
      recordRuntimeDiagnostic("manual", `event-${index}`);
    }

    const snapshot = getRuntimeDiagnosticsSnapshot();

    expect(snapshot.entries).toHaveLength(20);
    expect(snapshot.entries[0]?.message).toBe("event-24");
    expect(snapshot.entries[19]?.message).toBe("event-5");
  });

  it("exposes a QA diagnostics bridge when installed", () => {
    const cleanup = installRuntimeDiagnostics(() => ({
      route: "/home",
      platform: "web",
      phase: "home",
      activeView: "home",
      tick: 3,
      heat: 9,
      balanceBand: "100k-999k",
      selectedTicker: "VBLM",
      handlePresent: false,
      playerIdPresent: false,
      hydrated: true,
    }));
    const bridge = (
      globalThis as typeof globalThis & {
        __CYBERTRADER_QA_DIAGNOSTICS__?: {
          record: (message: string) => unknown;
          formatReport: () => string;
        };
      }
    ).__CYBERTRADER_QA_DIAGNOSTICS__;

    bridge?.record("manual qa export");

    expect(bridge?.formatReport()).toContain("manual qa export");
    cleanup();
  });

  it("redacts sensitive URL query parameters directly", () => {
    expect(redactSensitiveText("/home?access_token=route-token&mode=qa")).toBe(
      "/home?access_token=[REDACTED]&mode=qa",
    );
  });
});
