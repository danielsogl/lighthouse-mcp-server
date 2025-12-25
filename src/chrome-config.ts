import { existsSync, mkdirSync } from "fs";
import { CHROME_FLAGS } from "./lighthouse-constants";

export type ChromeLaunchConfig = {
  headless?: boolean;
  userDataDir?: string;
  profileDirectory?: string;
  remoteDebuggingPort?: number;
  extraChromeFlags?: string[];
};

const DEFAULT_CONFIG: Required<Pick<ChromeLaunchConfig, "headless" | "extraChromeFlags">> = {
  headless: true,
  extraChromeFlags: [],
};

let runtimeConfig: ChromeLaunchConfig = { ...DEFAULT_CONFIG };

export function setChromeLaunchConfig(config: ChromeLaunchConfig) {
  runtimeConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    extraChromeFlags: config.extraChromeFlags ?? DEFAULT_CONFIG.extraChromeFlags,
  };
}

export function getChromeLaunchConfig(): ChromeLaunchConfig {
  return {
    ...runtimeConfig,
    extraChromeFlags: [...(runtimeConfig.extraChromeFlags ?? [])],
  };
}

export function buildChromeFlags(config: ChromeLaunchConfig): string[] {
  const headless = config.headless ?? DEFAULT_CONFIG.headless;
  const extraFlags = config.extraChromeFlags ?? [];
  const hasHeadlessOverride = extraFlags.some((flag) => flag.startsWith("--headless"));
  const allowHeadlessFlags = headless || hasHeadlessOverride;
  const baseFlags = hasHeadlessOverride ? CHROME_FLAGS.filter((flag) => !flag.startsWith("--headless")) : CHROME_FLAGS;
  const combined: string[] = [];

  for (const flag of baseFlags) {
    if (allowHeadlessFlags || !flag.startsWith("--headless")) {
      combined.push(flag);
    }
  }

  if (config.profileDirectory) {
    combined.push(`--profile-directory=${config.profileDirectory}`);
  }

  for (const flag of extraFlags) {
    if (allowHeadlessFlags || !flag.startsWith("--headless")) {
      combined.push(flag);
    }
  }

  return dedupeFlags(combined);
}

export function buildChromeLaunchOptions(config: ChromeLaunchConfig) {
  const launchOptions: { chromeFlags: string[]; userDataDir?: string } = {
    chromeFlags: buildChromeFlags(config),
  };

  if (config.userDataDir) {
    launchOptions.userDataDir = config.userDataDir;
  }

  return launchOptions;
}

export function getChromeLaunchOptions() {
  const config = getChromeLaunchConfig();

  if (config.userDataDir) {
    ensureDirectory(config.userDataDir);
  }

  return buildChromeLaunchOptions(config);
}

export function isProfileConfig(config: ChromeLaunchConfig) {
  if (config.userDataDir || config.profileDirectory) {
    return true;
  }

  const extraFlags = config.extraChromeFlags ?? [];

  return extraFlags.some((flag) => flag.startsWith("--user-data-dir") || flag.startsWith("--profile-directory"));
}

function dedupeFlags(flags: string[]) {
  return [...new Set(flags)];
}

function ensureDirectory(path: string) {
  if (existsSync(path)) {
    return;
  }

  mkdirSync(path, { recursive: true });
}
