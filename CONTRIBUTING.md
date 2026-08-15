# Contributing

Thanks for your interest in improving the Lighthouse MCP server.

## Development setup

Requires **Node.js 22 or newer** and a local Chrome/Chromium installation.

```bash
git clone https://github.com/danielsogl/lighthouse-mcp-server.git
cd lighthouse-mcp-server
npm install
```

Git hooks are installed automatically via husky: `lint-staged` runs on commit and the unit
tests run on push.

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the server from source via tsx |
| `npm run build` | Type-check and emit to `dist/` |
| `npm run lint` / `npm run lint:fix` | ESLint + Prettier |
| `npm run test:run` | Unit tests |
| `npm run test:coverage` | Unit tests with coverage (thresholds enforced) |
| `npm run test:e2e` | Builds, then drives the real server with real Lighthouse runs |
| `npm run smoke:profile -- --url <url>` | One-off manual audit against a real site |

## Testing

The suite has two layers, and they cover genuinely different risks.

**Unit tests** (`src/**/*.test.ts`) mock Lighthouse and cover the tool logic. Note that they
mock the dependency *entirely*, so on their own they cannot catch upstream API changes.

**End-to-end tests** (`e2e/`) launch the built server over stdio with a real MCP client and
audit a fixture page served on loopback. They need Chrome; set `CHROME_PATH` if it is
installed somewhere non-standard. Use these whenever a change touches how the server talks
to Lighthouse or to MCP clients.

Two conventions exist specifically to catch upstream drift — please preserve them:

- Constants that name Lighthouse audit IDs, and the metric weights in the scoring resource,
  are asserted against the **installed Lighthouse config**, not against a copy of
  themselves. Lighthouse removes and renames audits between majors; hardcoding both sides
  of the assertion makes the test a tautology that cannot fail.
- Tools declare an `outputSchema`, and the test harness validates `structuredContent`
  against it exactly as the SDK does. If you change a tool's payload, update its schema in
  `src/output-schemas.ts` or the tests will tell you.

Coverage thresholds are enforced at 80%. If a change drops coverage, add tests rather than
lowering the gate.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and
release-please, so commit messages drive the changelog and the version bump:

- `fix:` → patch release
- `feat:` → minor release
- `feat!:` or a `BREAKING CHANGE:` footer → major release
- `chore:`, `docs:`, `test:`, `refactor:` → no release on their own

Scope the change when it helps, e.g. `fix(lighthouse): ...`. Explain *why* in the body when
the reason is not obvious from the diff — especially for upstream API changes, where the
next person needs to know which Lighthouse version changed what.

## Pull requests

1. Branch off `main`.
2. Make sure `npm run lint`, `npm run build`, `npm run test:coverage` and `npm run test:e2e`
   all pass.
3. Update the README when you add, remove or rename a tool, prompt, resource or parameter.
4. Open the PR against `main` and describe the user-visible effect.

CI runs lint, both type-checks, unit tests with coverage, the e2e suite, and a build
verification. Releases are published automatically by release-please once merged.

## Reporting issues

Bug reports and feature requests: [GitHub Issues](https://github.com/danielsogl/lighthouse-mcp-server/issues).
For security issues, please follow the [Security Policy](./SECURITY.md) instead of opening a
public issue.
