import { describe, it, expect } from "vitest";
import { join } from "path";
import { buildChromeFlags, isProfileConfig } from "./chrome-config";
import { CHROME_FLAGS } from "./lighthouse-constants";

describe("chrome-config", () => {
  describe("buildChromeFlags", () => {
    it("uses default Chrome flags by default", () => {
      const flags = buildChromeFlags({});

      CHROME_FLAGS.forEach((flag) => {
        expect(flags).toContain(flag);
      });
    });

    it("removes headless flags when headless is disabled", () => {
      const flags = buildChromeFlags({ headless: false });

      expect(flags.some((flag) => flag.startsWith("--headless"))).toBe(false);
    });

    it("adds profile directory flag when provided", () => {
      const flags = buildChromeFlags({ profileDirectory: "Custom Profile" });

      expect(flags).toContain("--profile-directory=Custom Profile");
    });

    it("appends extra chrome flags", () => {
      const flags = buildChromeFlags({ extraChromeFlags: ["--disable-gpu"] });

      expect(flags).toContain("--disable-gpu");
    });

    it("prefers headless override when provided in extra flags", () => {
      const flags = buildChromeFlags({ extraChromeFlags: ["--headless=new"] });

      expect(flags).toContain("--headless=new");
      expect(flags).not.toContain("--headless");
    });

    it("keeps explicit headless overrides even when headless is disabled", () => {
      const flags = buildChromeFlags({ headless: false, extraChromeFlags: ["--headless=new"] });

      expect(flags).toContain("--headless=new");
      expect(flags).not.toContain("--headless");
    });
  });

  describe("isProfileConfig", () => {
    it("returns true when userDataDir is set", () => {
      const userDataDir = join("/", "Users", "example", "Chrome", "ProfileData");

      expect(isProfileConfig({ userDataDir })).toBe(true);
    });

    it("returns true when profileDirectory is set", () => {
      expect(isProfileConfig({ profileDirectory: "Custom Profile" })).toBe(true);
    });

    it("returns false when only remoteDebuggingPort is set", () => {
      expect(isProfileConfig({ remoteDebuggingPort: 9222 })).toBe(false);
    });

    it("returns true when extra flags include profile settings", () => {
      const userDataDir = join("/", "Users", "example", "Chrome", "ProfileData");

      expect(isProfileConfig({ extraChromeFlags: [`--user-data-dir=${userDataDir}`] })).toBe(true);
      expect(isProfileConfig({ extraChromeFlags: ["--profile-directory=Custom Profile"] })).toBe(true);
    });

    it("returns false when no profile settings are present", () => {
      expect(isProfileConfig({})).toBe(false);
    });
  });
});
