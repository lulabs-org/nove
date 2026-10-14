# syntax=docker/dockerfile:1
# Build from the workspace root. Only the API dependency closure reaches runtime.
FROM node:22.23.1-alpine AS base
RUN corepack enable
WORKDIR /usr/src/app

FROM base AS pruner
RUN npm install --global turbo@2.11.7
COPY . .
RUN turbo prune @nove/api --docker

FROM base AS build
COPY --from=pruner /usr/src/app/out/json/ ./
RUN pnpm install --frozen-lockfile
COPY --from=pruner /usr/src/app/out/full/ ./
COPY tsconfig.base.json ./
RUN pnpm build:api && find apps/api/dist -type f -name '*.map' -delete

FROM base AS production-dependencies
COPY --from=pruner /usr/src/app/out/json/ ./
RUN pnpm install --prod --frozen-lockfile

FROM node:22.23.1-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app/apps/api
COPY --from=production-dependencies --chown=node:node /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=production-dependencies --chown=node:node /usr/src/app/apps/api/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/apps/api/dist ./dist
COPY --from=build --chown=node:node /usr/src/app/apps/api/package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
