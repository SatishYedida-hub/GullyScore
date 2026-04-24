# ---- Backend: GullyScore API ----
# Small, production-ready Node image. Builds are deterministic IF you commit
# a package-lock.json (recommended). Without it we fall back to `npm install`.

FROM node:20-alpine AS base
WORKDIR /app

# tini gives us proper PID 1 signal handling so Kubernetes SIGTERM shuts the
# process down cleanly instead of waiting for grace-period timeouts.
RUN apk add --no-cache tini

# Install only prod deps. If package-lock.json exists, `npm ci` is used for
# speed + determinism; otherwise we fall back to `npm install`.
FROM base AS deps
COPY package.json ./
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev --no-audit --no-fund; \
    fi

# ---- Runtime image ----
FROM base AS runtime

ENV NODE_ENV=production \
    PORT=5000

# Run as non-root. node:alpine ships with the `node` user (uid 1000).
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

USER node
EXPOSE 5000

# Built-in Node-based healthcheck — avoids adding curl/wget to the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 5000) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
