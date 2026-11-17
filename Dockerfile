# Home Front: one dependency-free Node server plus the built interface.
# Stage 1 builds the interface (React + the vendored design system) into dist/. Stage 2 is the server and what it serves;
# it has no node_modules.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor ./vendor
RUN npm ci
COPY index.html sw.js vite.config.js ./
COPY src ./src
COPY js ./js
COPY css ./css
RUN npm run build

FROM node:22-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    HOMEFRONT_DATA_DIR=/app/private

WORKDIR /app

# Only what server.mjs serves or imports: the server, the engine it shares with the app (js/), the maps, the icons, the CLI.
COPY --chown=node:node package.json server.mjs manifest.webmanifest ./
COPY --chown=node:node server ./server
COPY --chown=node:node js ./js
COPY --chown=node:node data ./data
COPY --chown=node:node icons ./icons
COPY --chown=node:node bin ./bin
COPY --chown=node:node --from=build /app/dist ./dist

# The campaign, sessions, journal and backups live here. Mount a volume to keep them.
RUN mkdir -p /app/private && chown node:node /app/private && chmod 700 /app/private
VOLUME /app/private

USER node
EXPOSE 8080

# /robots.txt is served without a login, so it works as a liveness probe.
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/robots.txt" || exit 1

CMD ["node", "server.mjs"]
