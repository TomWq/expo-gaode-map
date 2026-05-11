# Testing & QA

expo-gaode-map uses automated tests across the whole monorepo: `core`, `navigation`, `web-api`, and the key `example-navigation` flows.

## What Is Covered

### Core package

- SDK init, privacy, location, and permissions
- `MapView` and overlay components
- Utilities and error handling

### Navigation package

- Route geometry and anchor extraction
- Web API fallback mapping
- follow-web navigation
- independent route chain behavior

### Example app

- `example-navigation` smoke tests
- key navigation screen startup and rendering checks

## Run Tests

From the monorepo root:

```bash
yarn test
```

Run a specific package:

```bash
yarn test:core
yarn test:navigation
yarn test:web-api
```

Run the example app tests:

```bash
yarn test:example-navigation
```

Run the full verification flow:

```bash
yarn verify
```

If you want to work in a single package manually:

```bash
cd packages/core && bun test
cd packages/navigation && yarn test
cd example-navigation && npm test -- --runInBand
```

Generate coverage:

```bash
cd packages/core && bun test --coverage
cd packages/navigation && yarn test --coverage
```

> Coverage reports are generated per package, so the numbers depend on the package you run.

## Testing Tips

- Prefer unit tests for pure logic helpers such as route parsing, normalizers, and scoring functions.
- Prefer component tests for prop passing, event callbacks, and conditional rendering.
- Prefer integration tests for multi-step flows such as independent route planning and navigation startup.
- For web adaptation work, test the adapter or fallback branch too, not just the native path.

## Debug

```bash
yarn test:navigation -- --testNamePattern="followWebPlannedRoute"
```

```bash
cd packages/navigation && yarn test --watch
```

## Related Docs

- [Architecture](/en/guide/architecture)
- [Navigation Guide](/en/guide/navigation)
- [Web API Guide](/en/guide/web-api)
