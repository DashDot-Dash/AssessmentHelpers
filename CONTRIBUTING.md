# Contributing

## Repository model

`main` is the production branch. Every root-level `*.user.js` file is a
canonical, installable userscript, and its Tampermonkey update URLs point to the
copy on `main`.

Do not maintain full `DEV-*.user.js` copies. Development uses Git branches plus
generated local loaders:

- `feature/<name>` for new behavior
- `fix/<name>` for bug fixes
- `chore/<name>` for tooling, documentation, and maintenance

A long-lived `develop` branch is unnecessary unless the project later needs a
separately installable beta channel.

## Initial setup

Install the declared development dependencies:

```bash
npm ci
```

Generate the local Tampermonkey loaders:

```bash
npm run dev:loaders
```

This creates one loader per production script in `.local/`. The directory is
ignored by Git because each loader contains an absolute `file://` path for the
current computer.

In the browser extension settings, allow Tampermonkey access to local file URLs.
Install the desired `.local/*-loader.user.js` file in Tampermonkey. Each loader
contains metadata and one local `@require`; it intentionally contains no copy of
the implementation.

Re-run `npm run dev:loaders` after moving or renaming the repository, adding a
userscript, or changing userscript metadata. Reinstall a loader if its generated
metadata changes.

## Development workflow

Start from an up-to-date production branch:

```bash
git switch main
git pull --ff-only
git switch -c feature/short-description
```

Edit the canonical root-level production file directly. The installed local
loader reads that working-tree file, so switching branches also switches the
code Tampermonkey runs.

Before committing:

```bash
npm test
git diff --check
```

Commit only related files and push the feature branch:

```bash
git add path/to/related-files
git commit -m "feat: describe the change"
git push -u origin feature/short-description
```

Open a pull request into `main`. Prefer squash merging so production history
contains one focused commit per change.

## Validation

The following commands are available:

```bash
npm run check:userscripts
npm run test:dock
npm test
```

`check:userscripts` enforces:

- valid JavaScript syntax;
- one semantic `@version`;
- canonical `@updateURL` and `@downloadURL` values pointing to `main`;
- explicit match/include and grant metadata;
- no machine-specific `file://` requirement in production;
- unique userscript names; and
- no root-level full DEV duplicates.

GitHub Actions runs the same production checks and browser smoke tests for pull
requests and pushes to `main`.

## Release checklist

Merging into `main` releases the changed userscript because Tampermonkey polls
the raw production URL.

Before merging:

1. Increment the changed userscript's `@version`.
2. Run `npm test`.
3. Confirm its `@updateURL` and `@downloadURL` target its canonical filename.
4. Update the README if installation or behavior changed.
5. Review the pull request diff and merge only after CI passes.

After merging, optionally create an immutable Git tag, for example:

```bash
git switch main
git pull --ff-only
git tag benchmarker-v1.1.0
git push origin benchmarker-v1.1.0
```

In GitHub repository settings, protect `main` and require the `test` status
check before merging. This is a repository-host setting rather than a committed
file.
