# ─────────────────────────────────────────────────────────────────────────────
# frontend/Dockerfile
#
# Two-stage build:
#
# Stage 1 (builder) – installs ALL dependencies (including devDeps) and runs
#                     `vite build` to produce a static dist/ folder.
# Stage 2 (nginx)   – copies only the compiled static files into a minimal
#                     Nginx image.  No Node.js runtime in the final image.
#
# The resulting image is ~25 MB vs ~400 MB for a Node-based image.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including vite, eslint, etc.)
RUN npm ci

# Copy source code
COPY . .

# Build arguments allow injecting the API URL at build time:
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Produce the optimised static bundle in /app/dist
RUN npm run build

# ── Stage 2: serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the compiled React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx config (handles SPA routing + /api proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx listens on port 80 inside the container.
# Map it to any host port in docker-compose.yml.
EXPOSE 80

# Nginx runs in the foreground so Docker can track the process
CMD ["nginx", "-g", "daemon off;"]
