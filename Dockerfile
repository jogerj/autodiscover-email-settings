FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install production dependencies only
FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Final image
FROM base
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY tsconfig.json ./

EXPOSE 8000

CMD ["bun", "run", "src/server.ts"]
