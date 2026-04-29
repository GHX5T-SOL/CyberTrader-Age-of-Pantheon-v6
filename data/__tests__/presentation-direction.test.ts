import {
  COMMODITY_PRESENTATION,
  FACTION_PRESENTATION,
  OS_TIER_PRESENTATION,
  PRESENTATION_ASSET_REQUESTS,
  ZORO_P1_003_SUPERDESIGN,
  getCommodityLaneCounts,
  getCommodityPresentation,
  getFactionPresentationList,
} from "@/data/presentation-direction";
import { STORE_RISK_COPY_BLOCKLIST } from "@/data/tutorial-copy";
import { DEMO_COMMODITIES } from "@/engine/demo-market";
import { FACTION_DEFINITIONS } from "@/engine/factions";
import type { Faction, OsTier } from "@/engine/types";

const TERMINAL_ACCENTS = ["cyan", "green", "amber", "red"];

describe("zoro-p1-003 presentation direction", () => {
  it("covers every launch commodity with a visual lane and capture role", () => {
    expect(Object.keys(COMMODITY_PRESENTATION).sort()).toEqual(
      DEMO_COMMODITIES.map((commodity) => commodity.ticker).sort(),
    );

    for (const commodity of DEMO_COMMODITIES) {
      const presentation = getCommodityPresentation(commodity.ticker);
      expect(presentation.name).toBe(commodity.name);
      expect(TERMINAL_ACCENTS).toContain(presentation.accent);
      expect(presentation.riskLabel.length).toBeGreaterThan(4);
      expect(presentation.silhouetteRule.length).toBeGreaterThan(24);
      expect(presentation.captureRole.length).toBeGreaterThan(24);
    }
  });

  it("keeps commodity lanes balanced across starter, upgrade, and contraband reads", () => {
    expect(getCommodityLaneCounts()).toEqual({
      "starter-stabilizer": 1,
      "safe-cycle": 2,
      "upgrade-signal": 4,
      "contraband-anomaly": 4,
    });
  });

  it("covers all AgentOS factions without introducing untracked palette names", () => {
    expect(Object.keys(FACTION_PRESENTATION).sort()).toEqual(
      FACTION_DEFINITIONS.map((faction) => faction.id).sort(),
    );

    for (const presentation of getFactionPresentationList()) {
      expect(TERMINAL_ACCENTS).toContain(presentation.accent);
      expect(presentation.sigilRule.length).toBeGreaterThan(24);
      expect(presentation.assetRequest.length).toBeGreaterThan(32);
    }
  });

  it("defines a compact OS hierarchy for PirateOS, AgentOS, and PantheonOS", () => {
    const tiers: OsTier[] = ["PIRATE", "AGENT", "PANTHEON"];

    expect(Object.keys(OS_TIER_PRESENTATION).sort()).toEqual(tiers.sort());
    expect(OS_TIER_PRESENTATION.PIRATE.rankBand).toBe("RANK 1-4");
    expect(OS_TIER_PRESENTATION.AGENT.hierarchyLabel).toContain("FACTION");
    expect(OS_TIER_PRESENTATION.PANTHEON.captureRule).toContain("locked late-game promise");
  });

  it("files concrete follow-up asset requests for Palette, Vex, and Reel", () => {
    expect(PRESENTATION_ASSET_REQUESTS).toHaveLength(4);
    expect(PRESENTATION_ASSET_REQUESTS.map((request) => request.id)).toEqual([
      "palette-p1-006-commodity-lane-silhouettes",
      "palette-p1-007-agentos-faction-sigils",
      "vex-p1-008-os-tier-hierarchy-rails",
      "reel-p1-004-preview-asset-beat-list",
    ]);

    for (const request of PRESENTATION_ASSET_REQUESTS) {
      expect(request.acceptance.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("records the SuperDesign project and branch drafts used for the pass", () => {
    expect(ZORO_P1_003_SUPERDESIGN.currentDraft).toContain("7a48e6d9");
    expect(ZORO_P1_003_SUPERDESIGN.assetDirectionDraft).toContain("a9ccd626");
    expect(ZORO_P1_003_SUPERDESIGN.osFactionDraft).toContain("218326c6");
  });

  it("keeps presentation direction store safe and fictional", () => {
    const joined = JSON.stringify({
      commodities: COMMODITY_PRESENTATION,
      factions: FACTION_PRESENTATION,
      os: OS_TIER_PRESENTATION,
      requests: PRESENTATION_ASSET_REQUESTS,
    }).toLowerCase();

    for (const phrase of STORE_RISK_COPY_BLOCKLIST) {
      expect(joined).not.toContain(phrase);
    }

    expect(joined).toContain("0bol");
    expect(joined).not.toContain("$obol");
  });
});
