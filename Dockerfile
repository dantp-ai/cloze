# Cloze production image. Used by both `docker compose --profile app up`
# (local) and Fly.io. See the README deployment sections.

# --- Build stage: install deps, generate Prisma client, build Next.js ---
FROM node:20-slim AS build
# Prisma needs OpenSSL at generate/build time.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# A dummy URL just to satisfy Prisma client construction during the build.
# No database is queried at build time (the pages are dynamic), and the real
# DATABASE_URL is provided at runtime.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cloze?schema=public"
# Generate the Prisma client here (on Linux) so the query engine matches the
# runtime image; then build the app.
RUN npx prisma generate && npm run build

# --- Runtime stage: serve the built app ---
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Carry over everything needed to serve AND to run `prisma migrate deploy`
# (the Prisma CLI + engines live in node_modules, the schema in prisma/).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000

# Serve only. Migrations are applied by the platform:
# - local: the compose `app` service runs `prisma migrate deploy` first
# - Fly.io: via `release_command` in fly.toml
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
