# ARTESH: one dependency-free Node server plus static files. No build step, no npm install.
FROM node:22-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    ARTESH_DATA_DIR=/app/private

WORKDIR /app

# .dockerignore is an allowlist, so this copies only the server, the app shell and the CLI.
COPY --chown=node:node . .

# The campaign, sessions, journal and backups live here. Mount a volume to keep them.
RUN mkdir -p /app/private && chown node:node /app/private && chmod 700 /app/private
VOLUME /app/private

USER node
EXPOSE 8080

# /robots.txt is served without a login, so it works as a liveness probe.
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/robots.txt" || exit 1

CMD ["node", "server.mjs"]
