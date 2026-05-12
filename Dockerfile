FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy backend and frontend package files to preserve workspace structure
COPY server/package.json server/
COPY client/package.json client/

# Install all dependencies (we need this to build the frontend)
RUN npm ci

# Copy the rest of the application
COPY server/ server/
COPY client/ client/

# Build the client
WORKDIR /app/client
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Set node environment
ENV NODE_ENV=production

# Copy root files
COPY package.json package-lock.json ./

# Copy server package and install ONLY production dependencies
COPY server/package.json server/
RUN npm ci --omit=dev --workspace=server

# Copy server source
COPY server/ server/

# Copy built client from builder stage
COPY --from=builder /app/client/dist /app/client/dist

# Expose the server port
EXPOSE 3001

# Add healthcheck using our /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

WORKDIR /app/server
CMD ["node", "index.js"]
