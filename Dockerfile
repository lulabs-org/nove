# Build from the workspace root; the API owns its dependencies and artifacts.
FROM node:22.23.1-alpine AS build
RUN corepack enable
WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm --filter @nove/api... install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/api ./apps/api
RUN pnpm build:api && \
    find apps/api/dist -type f -name "*.map" -delete && \
    CI=true pnpm --filter @nove/api... install --prod --frozen-lockfile

FROM node:22.23.1-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app/apps/api

# Preserve pnpm's workspace-relative links to the root virtual store.
COPY --from=build --chown=node:node /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=build --chown=node:node /usr/src/app/apps/api/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/apps/api/dist ./dist
COPY --from=build --chown=node:node /usr/src/app/apps/api/package.json ./package.json

USER node
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
