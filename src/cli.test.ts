import { describe, it, expect } from "vitest";
import { basename, dirname, join } from "path";
import { parseCliArgs } from "./cli";

describe("parseCliArgs", () => {
  it("parses chrome profile and headless settings", () => {
    const userDataDir = join("/", "Users", "example", "Chrome", "ProfileData");
    const config = parseCliArgs([
      "--user-data-dir",
      userDataDir,
      "--profile-directory=Custom Profile",
      "--chrome-flag",
      "--disable-gpu",
      "--no-headless",
    ]);

    expect(config.userDataDir).toBe(userDataDir);
    expect(config.profileDirectory).toBe("Custom Profile");
    expect(config.extraChromeFlags).toEqual(["--disable-gpu"]);
    expect(config.headless).toBe(false);
  });

  it("supports chrome-flag with equals syntax", () => {
    const config = parseCliArgs(["--chrome-flag=--disable-web-security"]);

    expect(config.extraChromeFlags).toEqual(["--disable-web-security"]);
  });

  it("parses remote debugging port flags", () => {
    const config = parseCliArgs(["--chrome-port", "9222", "--remote-debugging-port=9223"]);

    expect(config.remoteDebuggingPort).toBe(9223);
  });

  it("parses profile path into user data dir and profile directory", () => {
    const profilePath = join("/", "Users", "example", "Chrome", "Custom Profile");
    const config = parseCliArgs(["--profile-path", profilePath]);

    expect(config.userDataDir).toBe(dirname(profilePath));
    expect(config.profileDirectory).toBe(basename(profilePath));
  });
});
