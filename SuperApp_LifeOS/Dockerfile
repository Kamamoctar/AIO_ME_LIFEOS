FROM node:24-bookworm-slim AS dependencies

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY scripts/prisma-generate.mjs ./scripts/prisma-generate.mjs
RUN --mount=type=cache,target=/root/.npm SKIP_PRISMA_GENERATE=1 npm ci --prefer-offline --no-audit
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN node scripts/prisma-generate.mjs

FROM dependencies AS development

COPY . .
RUN node scripts/prisma-generate.mjs

ENV NODE_ENV=development
ENV DATABASE_URL=file:/data/financeos.db

EXPOSE 3000

CMD ["sh", "-c", "node scripts/prisma-generate.mjs && node scripts/apply-turso-migrations.mjs && exec npm run dev -- --hostname 0.0.0.0"]

FROM dependencies AS builder

COPY . .

ENV NODE_ENV=production
ENV DATABASE_URL=file:/tmp/financeos-build.db

RUN npm run build

FROM node:24-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/data/financeos.db
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /data \
  && chown nextjs:nodejs /data

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma/migrations ./prisma/migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts/apply-turso-migrations.mjs ./scripts/apply-turso-migrations.mjs

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node scripts/apply-turso-migrations.mjs && exec node server.js"]

