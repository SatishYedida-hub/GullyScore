# ---- Frontend: React static build served by nginx ----
# Multi-stage: build the CRA bundle, then serve it from a tiny nginx image.

# The build-time API URL is baked into the bundle because CRA only reads
# REACT_APP_* at compile time. Override it per environment, e.g.:
#   docker build --build-arg REACT_APP_API_URL=https://api.example.com/api .
ARG REACT_APP_API_URL=/api

# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copy manifest first for better layer caching.
COPY package.json ./
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . .

# Re-declare ARG inside the stage so it's visible to the RUN below.
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# CI=false because CRA treats lint warnings as errors with CI=true, which
# can break builds on transient warnings.
RUN CI=false npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine AS runtime

# SPA-friendly nginx config: serve /, fall back to index.html for client
# routes, gzip static assets, proxy /api to the backend service.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ship the CRA build output.
COPY --from=build /app/build /usr/share/nginx/html

# nginx listens on 80 by default; expose it.
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
