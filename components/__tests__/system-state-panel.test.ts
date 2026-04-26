import {
  getSystemStateAccent,
  getSystemStateCopy,
  type SystemStateKind,
} from "@/components/system-state-panel";

const KINDS: SystemStateKind[] = ["loading", "empty", "offline", "error"];

describe("system state panel copy", () => {
  it("defines diegetic copy for every supported state", () => {
    for (const kind of KINDS) {
      const copy = getSystemStateCopy(kind);

      expect(copy.eyebrow).toMatch(/\S/);
      expect(copy.title).toMatch(/\S/);
      expect(copy.message).toMatch(/\S/);
      expect(getSystemStateAccent(kind)).toMatch(/^#/);
    }
  });

  it("allows route-specific state copy overrides", () => {
    expect(
      getSystemStateCopy("error", {
        title: "HANDLE REJECTED",
        message: "INVALID HANDLE.",
      }),
    ).toMatchObject({
      eyebrow: "RECOVERY NODE",
      title: "HANDLE REJECTED",
      message: "INVALID HANDLE.",
      detail: "RETRY FROM A STABLE NODE",
    });
  });

  it("keeps default copy when an override value is undefined", () => {
    expect(getSystemStateCopy("loading", { title: undefined }).title).toBe("STITCHING SESSION VECTOR");
  });
});
