import { parseArgs } from "node:util";
import { basename, dirname } from "node:path";
import { ChromeLaunchConfig } from "./chrome-config";

export function parseCliArgs(argv: string[]): ChromeLaunchConfig {
  const { values } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      headless: { type: "boolean" },
      "no-headless": { type: "boolean" },
      "user-data-dir": { type: "string" },
      "profile-directory": { type: "string" },
      "profile-path": { type: "string" },
      "chrome-port": { type: "string" },
      "remote-debugging-port": { type: "string" },
      "chrome-flag": { type: "string", multiple: true },
    },
  });

  const config: ChromeLaunchConfig = {
    extraChromeFlags: [],
  };

  if (typeof values.headless === "boolean") {
    config.headless = values.headless;
  }

  if (values["no-headless"]) {
    config.headless = false;
  }

  if (typeof values["user-data-dir"] === "string") {
    config.userDataDir = values["user-data-dir"];
  }

  if (typeof values["profile-directory"] === "string") {
    config.profileDirectory = values["profile-directory"];
  }

  if (typeof values["profile-path"] === "string") {
    config.userDataDir = dirname(values["profile-path"]);
    config.profileDirectory = basename(values["profile-path"]);
  }

  const chromePort = parsePort(values["chrome-port"]);
  const remoteDebuggingPort = parsePort(values["remote-debugging-port"]);
  const resolvedPort = remoteDebuggingPort ?? chromePort;

  if (resolvedPort) {
    config.remoteDebuggingPort = resolvedPort;
  }

  const extraFlags = values["chrome-flag"];

  if (Array.isArray(extraFlags)) {
    config.extraChromeFlags = extraFlags.filter((flag): flag is string => typeof flag === "string");
  } else if (typeof extraFlags === "string") {
    config.extraChromeFlags = [extraFlags];
  }

  return config;
}

function parsePort(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const port = Number(value);
  if (!Number.isFinite(port) || port <= 0) {
    return undefined;
  }

  return port;
}
