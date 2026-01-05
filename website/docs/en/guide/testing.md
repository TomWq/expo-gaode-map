# Testing & QA

expo-gaode-map uses automated tests to keep the core module and related packages stable.

## What Is Covered

- Core module APIs (SDK init, privacy compliance, location APIs)
- MapView and overlay components (rendering and props)
- Utilities (error handling, module loading)

## Run Tests

From the monorepo root:

```bash
bun test
```

Run tests for a specific package:

```bash
cd packages/core
bun test
```

Run a single test file or filter:

```bash
cd packages/core
bun test ExpoGaodeMapModule
bun test --testNamePattern="SDK init"
```

Generate a coverage report:

```bash
cd packages/core
bun test --coverage
```

## Lint

From the monorepo root:

```bash
bun run lint
```

## Debug Tips

- Prefer running tests in a package directory when iterating on one module.
- If a test depends on React Native environment, keep it inside the package using `expo-module test`.

## Related Documentation

- [Error Handling](/en/guide/error-handling)
- [Architecture](/en/guide/architecture)
