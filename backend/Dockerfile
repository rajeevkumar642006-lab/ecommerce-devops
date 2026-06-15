# ─────────────────────────────────────────────────────────────────────────────
# backend/Dockerfile
#
# Multi-stage build for the Node.js + Express API.
#
# Stage 1 (deps)   – install only production dependencies in a clean layer
#                    so the final image doesn't carry devDependencies or the
#                    npm cache.
# Stage 2 (runner) – copy the installed node_modules and source code into a
#                    minimal runtime image.
#
# Why node:20-alpine?
#   Alpine images are ~5× smaller than the full Debian-based images.
#   Node 20 is the current LTS release (supported until April 2026).
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install OS packages needed by some native npm modules (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy only the manifest files first so Docker can cache this layer.
# node_modules are only re-installed when package.json / package-lock.json change.
COPY package.json package-lock.json* ./

# Install production dependencies only (no devDependencies in the image)
RUN npm ci --omit=dev

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Switch to non-root user
USER appuser

# Document the port the app listens on (actual binding is done at runtime)
EXPOSE 5001

# Health check — Docker will mark the container unhealthy if the API
# stops responding, triggering a restart in Compose / Kubernetes.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5001/api/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
