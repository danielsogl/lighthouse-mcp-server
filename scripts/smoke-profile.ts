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
}

function parseSmokeArgs(argv: string[]): SmokeOptions {
  const options: SmokeOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg.startsWith("--url")) {
      const parsed = readArgValue(argv, i);
      if (parsed.value) {
        options.url = parsed.value;
      }
      i += parsed.offset;
      continue;
    }

    if (arg.startsWith("--device")) {
      const parsed = readArgValue(argv, i);
      if (parsed.value === "desktop" || parsed.value === "mobile") {
        options.device = parsed.value;
      }
      i += parsed.offset;
      continue;
    }

    if (arg.startsWith("--categories")) {
      const parsed = readArgValue(argv, i);
      if (parsed.value) {
        options.categories = parsed.value
          .split(",")
          .map((category) => category.trim())
          .filter(Boolean);
      }
      i += parsed.offset;
      continue;
    }

    if (arg === "--throttling") {
      options.throttling = true;
      continue;
    }

    if (arg === "--no-throttling") {
      options.throttling = false;
      continue;
    }
  }

  return options;
}

function readArgValue(argv: string[], index: number) {
  const arg = argv[index];
  const equalsIndex = arg.indexOf("=");

  if (equalsIndex !== -1) {
    return { value: arg.slice(equalsIndex + 1), offset: 0 };
  }

  const nextValue = argv[index + 1];
  if (!nextValue || nextValue.startsWith("--")) {
    return { offset: 0 };
  }

  return { value: nextValue, offset: 1 };
}

function printUsage() {
  // eslint-disable-next-line no-console
  console.error(`Usage:
  npm run smoke:profile -- --url https://example.com \\
    --profile-path "<profile-path>" \\
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

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Smoke audit failed:", error);
  process.exit(1);
});
