import { parseArgs } from "node:util";
import { parseCliArgs } from "../src/cli";
import { setChromeLaunchConfig } from "../src/chrome-config";
import { runLighthouseAudit } from "../src/lighthouse-core";

type Device = "desktop" | "mobile";

type SmokeOptions = {
  url?: string;
  device?: Device;
  categories?: string[];
  throttling?: boolean;
};

async function main() {
  try {
    const argv = process.argv.slice(2);
    const chromeConfig = parseCliArgs(argv);
    const smokeOptions = parseSmokeArgs(argv);

    setChromeLaunchConfig(chromeConfig);

    if (!smokeOptions.url) {
      printUsage();
      process.exit(1);
    }

    const result = await runLighthouseAudit(
      smokeOptions.url,
      smokeOptions.categories,
      smokeOptions.device ?? "desktop",
      smokeOptions.throttling ?? false,
    );

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Smoke audit failed:", error);
    process.exit(1);
  }
}

function parseSmokeArgs(argv: string[]): SmokeOptions {
  const { values } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      url: { type: "string" },
      device: { type: "string" },
      categories: { type: "string" },
      throttling: { type: "boolean" },
      "no-throttling": { type: "boolean" },
    },
  });

  const options: SmokeOptions = {};

  if (typeof values.url === "string") {
    options.url = values.url;
  }

  if (values.device === "desktop" || values.device === "mobile") {
    options.device = values.device;
  }

  if (typeof values.categories === "string") {
    options.categories = values.categories
      .split(",")
      .map((category) => category.trim())
      .filter(Boolean);
  }

  if (values["no-throttling"]) {
    options.throttling = false;
  } else if (typeof values.throttling === "boolean") {
    options.throttling = values.throttling;
  }

  return options;
}

function printUsage() {
  // eslint-disable-next-line no-console
  console.error(String.raw`Usage:
  npm run smoke:profile -- --url https://example.com \
    --profile-path "<profile-path>" \
    --no-headless

  npm run smoke:profile -- --url https://example.com --chrome-port 9222

Optional flags:
  --device desktop|mobile
  --categories performance,accessibility,seo
  --throttling | --no-throttling
  --profile-path <path>
  --chrome-flag=--disable-gpu (repeatable)
  --chrome-port <port> or --remote-debugging-port <port>`);
  // eslint-disable-next-line no-console
  console.error("Note: if --user-data-dir points to a missing directory, it will be created as a fresh profile.");
}

void main();
