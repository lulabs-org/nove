# Repository Guidelines

## Project Structure & Module Organization

This NestJS 11/TypeScript API uses Prisma with PostgreSQL and Redis/BullMQ. Group features under `apps/api/src/` by domain, such as `auth/`, `meeting/`, `order/`, and `drive/`. Keep controllers, services, repositories, DTOs, and module definitions within their domain. Shared utilities and infrastructure live in `apps/api/src/common/`, `apps/api/src/configs/`, and `apps/api/src/prisma/`.

Prisma schemas, migrations, and seeds belong in `apps/api/prisma/`; shared test fixtures and helpers in `apps/api/test/`; documentation in `docs/`; maintenance tools in `apps/api/scripts/`. Treat `apps/api/dist/` and `apps/api/coverage/` as generated output.

## Build, Test, and Development Commands

Use Node.js 22.12+ (CI uses 22.23.1) and pnpm 9.15.9 to match CI.

- `pnpm install --frozen-lockfile`: install locked dependencies.
- `pnpm start:dev`: start the API with watch mode.
- `pnpm build:api`: generate Prisma Client and compile the API into `apps/api/dist/`.
- `pnpm build` / `pnpm dev`: run workspace tasks through Turbo, including docs.
- `pnpm lint` / `pnpm lint:prisma`: lint application/test or Prisma TypeScript.
- `pnpm format`: format source, tests, and Prisma TypeScript with Prettier.
- `pnpm db:generate`: regenerate the Prisma client.
- `pnpm db:migrate`: create/apply development migrations.
- `pnpm --filter @nove/api exec prisma validate`: validate the Prisma schema.
- `pnpm docs:dev`: serve the documentation locally.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes, and trailing commas. Follow Prettier and the type-aware ESLint configuration. Use kebab-case filenames, PascalCase classes, and camelCase functions and variables. Retain role suffixes such as `.service.ts`, `.controller.ts`, and `.dto.ts`. Prefer `@/` imports for paths rooted at `apps/api/src/`.

## Testing Guidelines

Tests use Jest, ts-jest, and Supertest. Place unit tests in `apps/api/src/**/*.spec.ts` or `apps/api/test/unit/**/*.spec.ts`; integration tests in `apps/api/test/integration/**/*.int-spec.ts`; end-to-end tests in `apps/api/test/e2e/**/*.e2e-spec.ts`.

Run `pnpm --filter @nove/api exec jest --selectProjects unit --runInBand` for serial unit tests. Use `pnpm test:integration` or `pnpm test:e2e` for broader checks and `pnpm test:ci` for all configured projects with coverage. Unit coverage thresholds are configured at 80% for branches, functions, lines, and statements. Current CI runs unit tests. Add focused regression tests for behavior changes; use isolated test databases.

## Commit & Pull Request Guidelines

Follow Conventional Commits, e.g., `fix(role): guard member removal`. Keep commits scoped; include migrations with schema changes. PRs should explain behavior, link relevant issues, document configuration/database changes, and report validation. Run build, lint, relevant tests, and Prisma validation when applicable before review.

## Security & Configuration

Copy `apps/api/.env.example` to `apps/api/.env` for local configuration; document new keys in the example. Never commit credentials or log tokens. Review migration and seed effects before running them against shared databases.

## Workspace Boundaries

Root dependencies are workspace tooling only. Keep API dependencies and Node-specific TypeScript settings in `apps/api`; keep generic compiler options in `tsconfig.base.json`. Run package-local tools with `pnpm --filter @nove/api exec`. API and Admin share the VitePress site and documentation dependencies in `docs/` (`@nove/docs`); API-specific documentation lives in `docs/developer/api/`, Admin documentation in `docs/developer/admin/`, shared workflows in `docs/engineering/`, and proposals in `docs/roadmap/`. Both applications use `guides/` for how-to documentation. Admin code lives in `apps/admin`. Use `pnpm docs:dev` and `pnpm docs:build` for the unified site. Use `pnpm build:admin`, `pnpm lint:admin`, and `pnpm test:admin` for the React/Vite application. Keep Admin browser libraries, environment files, and TypeScript settings isolated from the API. All packages share the root lockfile; do not install nested Git hooks. Run `pnpm generate:api` to compile the API, export OpenAPI in Nest preview mode, and generate the Admin client. Root Admin tasks prepare the contract automatically; direct package-local tools require generation first. `pnpm test` runs API unit and Admin tests; use `pnpm test:all` for API integration/E2E. Keep `scripts/ci-scope.test.mjs` passing when changing task selection. API image builds use `turbo prune`; Admin images include the API only during contract generation.
