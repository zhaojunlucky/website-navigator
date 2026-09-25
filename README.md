# WebsiteNavigator

This project uses [Angular CLI](https://github.com/angular/angular-cli) version 22 and Yarn 4.

## Development server

To start a local development server, run:

```bash
yarn start
```

Once the server is running, open your browser and navigate to `http://localhost:4201/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
yarn ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
yarn ng generate --help
```

## Building

To build the project run:

```bash
yarn build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
yarn test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
yarn ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Bookmark binding

Open `https://gndrive.de/?userId=<user-id>` or use **Open Navigator** in Virtue's URL Bookmark toolbar. The instance endpoint takes a **user ID**, not a collection ID.

A valid URL user ID overrides the saved binding. Navigator remembers it in localStorage for subsequent visits without a query parameter. Missing bindings show setup instructions; invalid or duplicate parameters show an invalid-link message without replacing the saved binding. If storage is unavailable, bookmark the URL containing the user ID.

Use **Change account binding** in the menu to clear the binding and return to setup. Data and expanded-category caches are isolated by API environment and user ID; old unscoped caches are ignored.

Development uses Navigator on port 4201 and Virtue on port 4200. `apiServer` must match Virtue's API environment (currently `http://test.magicworldz.de:8080` in development); `bookmarkUiUrl` points to that environment's Virtue `/url-bookmark` page. Configure both in `src/environments/environment*.ts`.

## CI candidates

`.github/workflows/ci.yml` builds pull requests targeting `main` with Node 24 and the Yarn version pinned in `package.json`. It installs with `--immutable`, runs packaging and ChromeHeadless application tests, and builds the production app. Build, packaging, and Nora uploads run in one job, using local files without a GitHub artifact transfer. Same-repository PRs publish through `zhaojunlucky/exia-nora-push-action/raw@v1` using Nora OIDC; fork PRs build and test without publishing. Nora must authorize this repository's workflow identity for the candidate prefix.

Versions follow `1.0.<github.run_number>`. A PR candidate is uploaded to:

```text
nora.exia.app/website-navigator/ci/pr-<pr>-1.0.<run>/
├── website-navigator.zip
├── checksums.sha256
└── index.json
```

The ZIP contains **all contents of `dist/website-navigator/`**, including `browser/` and top-level build metadata, without an extra `website-navigator/` wrapper. The index uses the promoter's `versioned-run` layout and records the archive's file name, version, byte count, and SHA-256. Checksums and the archive upload first; `index.json` uploads last. `checksums.sha256` is a candidate convenience file; the index lists the application archive as the release artifact.

CI never writes `release/` or `release/latest.json`. Reruns keep the original run number, matching the reference workflow: already-published Nora paths are immutable and fail on re-upload rather than being overwritten. A new workflow run gets a new candidate version.

To package a local production build (requires `zip`; packaging tests also require `unzip`):

```sh
yarn build --configuration production
GITHUB_RUN_NUMBER=42 node tools/package-candidate.mjs
node --test tools/package-candidate.test.mjs
```

Files are generated in `dist/candidate/`. The candidate index is accessible through the artifact gateway only if its raw allowlist maps `website-navigator` to the `website-navigator` prefix and permits `ci/**`:

```text
https://exia-artifact-promoter.exia.app/raw/cdn/website-navigator/ci/pr-<pr>-1.0.<run>/index.json
```

Gateway configuration and promotion deployment are managed separately. The inspected promoter currently attempts Docker promotion alongside raw promotion; raw-only repositories need that behavior adjusted to avoid reporting missing-image failures after raw artifacts are promoted.
